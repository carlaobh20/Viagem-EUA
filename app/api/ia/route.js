import { createClient } from '@supabase/supabase-js';

// IA do "Conversar" (Gemini): traduz texto, lê foto (cardápio, placa) e ouve
// áudio (fala em português → transcreve + traduz). Tudo num modelo só, que
// entende texto, imagem e áudio nativamente.
//
// Precisa da variável GEMINI_API_KEY na Vercel (Settings → Environment Variables).
// Chave gratuita em https://aistudio.google.com → "Get API key".

// O Google aposenta modelos de tempos em tempos (o 2.5-flash já foi). O código
// tenta nesta ordem e passa pro próximo quando o Google responde "modelo não
// existe" (404). GEMINI_MODEL na Vercel, se existir, entra na frente da lista.
const MODELOS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const NOMES = { 'pt-BR': 'português do Brasil', 'en-US': 'inglês', 'es-ES': 'espanhol', 'fr-FR': 'francês', 'it-IT': 'italiano', 'de-DE': 'alemão', 'ja-JP': 'japonês' };
const nome = (c) => NOMES[c] || c;

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request) {
  try {
    // --- Tranca: só usuário logado (evita abuso da chave) ---
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return Response.json({ ok: false, erro: 'Faça login pra usar o tradutor' }, { status: 401 });
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: udata, error: aerr } = await sb.auth.getUser(token);
    if (aerr || !udata || !udata.user) return Response.json({ ok: false, erro: 'Sessão inválida' }, { status: 401 });
    // ----------------------------------------------------------

    // aceita o nome em maiúsculas (padrão) ou como foi salvo na Vercel em minúsculas
    const apiKey = (process.env.GEMINI_API_KEY || process.env.gemini_api_key || process.env.Gemini_Api_Key || '').trim();
    if (!apiKey) return Response.json({ ok: false, erro: 'A chave do Gemini (GEMINI_API_KEY) ainda não foi configurada na Vercel.' }, { status: 500 });

    const { modo, de, para, texto, base64, mime } = await request.json();
    const P = nome(para || 'pt-BR');
    const D = nome(de || 'pt-BR');
    const parts = [];
    let instrucao;

    if (modo === 'texto') {
      if (!texto || !texto.trim()) return Response.json({ ok: false, erro: 'Sem texto' }, { status: 400 });
      if (texto.length > 4000) return Response.json({ ok: false, erro: 'Texto grande demais (máx. 4.000 letras)' }, { status: 413 });
      instrucao = `Traduza o texto abaixo de ${D} para ${P}. Mantenha o sentido natural, como um falante nativo diria. Se o texto já estiver em ${P}, apenas repita. Responda SOMENTE em JSON: {"original": "<texto recebido, sem mudar>", "traduzido": "<tradução>"}.\n\nTexto:\n${texto}`;
      parts.push({ text: instrucao });
    } else if (modo === 'imagem') {
      if (!base64) return Response.json({ ok: false, erro: 'Sem imagem' }, { status: 400 });
      instrucao = `Esta foto foi tirada por um turista (cardápio, placa, embalagem, aviso...). 1) Transcreva TODO o texto legível da imagem, na língua em que está, mantendo a ordem e quebras de linha. 2) Traduza esse texto para ${P}. Se houver preços, mantenha. Se não houver texto legível, deixe "original" vazio. Responda SOMENTE em JSON: {"original": "<texto da foto>", "traduzido": "<tradução em ${P}>"}.`;
      parts.push({ text: instrucao }, { inline_data: { mime_type: mime || 'image/jpeg', data: base64 } });
    } else if (modo === 'audio') {
      if (!base64) return Response.json({ ok: false, erro: 'Sem áudio' }, { status: 400 });
      instrucao = `Este áudio é uma pessoa falando em ${D}. 1) Transcreva exatamente o que ela disse (sem inventar; se não der pra entender, deixe "original" vazio). 2) Traduza para ${P}, do jeito que um nativo diria em conversa. Responda SOMENTE em JSON: {"original": "<transcrição em ${D}>", "traduzido": "<tradução em ${P}>"}.`;
      parts.push({ text: instrucao }, { inline_data: { mime_type: mime || 'audio/wav', data: base64 } });
    } else {
      return Response.json({ ok: false, erro: 'Modo inválido' }, { status: 400 });
    }

    const body = JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: { type: 'OBJECT', properties: { original: { type: 'STRING' }, traduzido: { type: 'STRING' } }, required: ['original', 'traduzido'] },
      },
    });
    const candidatos = [...new Set([(process.env.GEMINI_MODEL || '').trim(), ...MODELOS].filter(Boolean))];
    let resp = null, ultimoErro = '';
    for (const modelo of candidatos) {
      resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      });
      if (resp.ok) break;
      const t = await resp.text();
      ultimoErro = t.slice(0, 300);
      if (resp.status === 400 && /API key not valid/i.test(t)) return Response.json({ ok: false, erro: 'A chave do Gemini está inválida. Confira GEMINI_API_KEY na Vercel.' }, { status: 502 });
      if (resp.status === 429) return Response.json({ ok: false, erro: 'A IA atingiu o limite de uso por agora. Tenta de novo em um minuto.' }, { status: 502 });
      // modelo aposentado / inexistente pra esta conta: tenta o próximo da lista
      if (resp.status === 404 || /not found|no longer available|not supported/i.test(t)) { resp = null; continue; }
      return Response.json({ ok: false, erro: 'Falha na IA: ' + ultimoErro }, { status: 502 });
    }
    if (!resp) return Response.json({ ok: false, erro: 'Nenhum modelo do Gemini disponível pra esta chave. Último erro: ' + ultimoErro }, { status: 502 });
    const json = await resp.json();
    const txt = json && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts
      ? json.candidates[0].content.parts.map((p) => p.text || '').join('') : '';
    let out;
    try { out = JSON.parse(txt); } catch (e) {
      const m = txt.match(/\{[\s\S]*\}/);
      try { out = m ? JSON.parse(m[0]) : null; } catch (e2) { out = null; }
    }
    if (!out) return Response.json({ ok: false, erro: 'A IA respondeu num formato inesperado. Tenta de novo.' }, { status: 502 });
    return Response.json({ ok: true, original: String(out.original || '').trim(), traduzido: String(out.traduzido || '').trim() });
  } catch (e) {
    return Response.json({ ok: false, erro: 'Erro inesperado: ' + (e && e.message ? e.message : String(e)) }, { status: 500 });
  }
}

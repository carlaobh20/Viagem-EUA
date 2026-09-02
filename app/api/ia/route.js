import { createClient } from '@supabase/supabase-js';

// IA do "Conversar": traduz texto, lê foto (cardápio, placa) e ouve áudio (fala
// em português → transcreve + traduz).
//
// Funciona com DOIS provedores — usa o que tiver chave na Vercel:
//   • GROQ_API_KEY   → Groq (chave grátis em https://console.groq.com, sem cartão)
//   • GEMINI_API_KEY → Google Gemini (https://aistudio.google.com)
// Se as duas existirem, tenta a Groq primeiro e cai pro Gemini se ela falhar.
// Cada provedor tem uma lista de modelos: quando um é aposentado, passa pro próximo.

export const runtime = 'nodejs';
export const maxDuration = 60;

const NOMES = { 'pt-BR': 'português do Brasil', 'en-US': 'inglês', 'es-ES': 'espanhol', 'fr-FR': 'francês', 'it-IT': 'italiano', 'de-DE': 'alemão', 'ja-JP': 'japonês' };
const nome = (c) => NOMES[c] || c;
const iso = (c) => String(c || 'pt').split('-')[0].toLowerCase(); // 'pt-BR' → 'pt'

// ----- Prompts (iguais pros dois provedores) -----
function promptTexto(D, P, texto) {
  return `Traduza o texto abaixo de ${D} para ${P}. Mantenha o sentido natural, como um falante nativo diria. Se o texto já estiver em ${P}, apenas repita. Responda SOMENTE em JSON: {"original": "<texto recebido, sem mudar>", "traduzido": "<tradução>"}.\n\nTexto:\n${texto}`;
}
function promptImagem(P) {
  return `Esta foto foi tirada por um turista (cardápio, placa, embalagem, aviso...). 1) Transcreva TODO o texto legível da imagem, na língua em que está, mantendo a ordem e quebras de linha. 2) Traduza esse texto para ${P}. Se houver preços, mantenha. Se não houver texto legível, deixe "original" vazio. Responda SOMENTE em JSON: {"original": "<texto da foto>", "traduzido": "<tradução em ${P}>"}.`;
}
function promptAudio(D, P) {
  return `Este áudio é uma pessoa falando em ${D}. 1) Transcreva exatamente o que ela disse (sem inventar; se não der pra entender, deixe "original" vazio). 2) Traduza para ${P}, do jeito que um nativo diria em conversa. Responda SOMENTE em JSON: {"original": "<transcrição em ${D}>", "traduzido": "<tradução em ${P}>"}.`;
}
function extrairJson(txt) {
  try { return JSON.parse(txt); } catch (e) {
    const m = String(txt || '').match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : null; } catch (e2) { return null; }
  }
}
const limpar = (o) => ({ original: String((o && o.original) || '').trim(), traduzido: String((o && o.traduzido) || '').trim() });

// Erro com mensagem já pronta pra tela, e um sinal de "tenta o próximo provedor"
class ErroIA extends Error { constructor(msg, tentarOutro = false) { super(msg); this.tentarOutro = tentarOutro; } }

// =====================================================================
// GROQ (OpenAI-compatível): whisper pra áudio, llama com visão pra foto/texto
// =====================================================================
const GROQ_CHAT = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.3-70b-versatile'];
const GROQ_AUDIO = ['whisper-large-v3-turbo', 'whisper-large-v3'];

async function groqChat(apiKey, content, modelos) {
  let ultimo = '';
  for (const model of modelos) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'user', content }] }),
    });
    if (r.ok) {
      const j = await r.json();
      const txt = j && j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '';
      const out = extrairJson(txt);
      if (!out) throw new ErroIA('A IA respondeu num formato inesperado. Tenta de novo.');
      return limpar(out);
    }
    const t = await r.text(); ultimo = t.slice(0, 300);
    if (r.status === 401) throw new ErroIA('A chave da Groq está inválida. Confira GROQ_API_KEY na Vercel.', true);
    if (r.status === 429) throw new ErroIA('A IA atingiu o limite de uso por agora. Tenta de novo em um minuto.', true);
    if (r.status === 404 || (r.status === 400 && /model|decommissioned|not found/i.test(t))) continue; // modelo aposentado → próximo
    throw new ErroIA('Falha na IA (Groq): ' + ultimo, true);
  }
  throw new ErroIA('Nenhum modelo da Groq disponível. Último erro: ' + ultimo, true);
}

async function groqTranscrever(apiKey, base64, mime, lang) {
  const bytes = Buffer.from(base64, 'base64');
  let ultimo = '';
  for (const model of GROQ_AUDIO) {
    const fd = new FormData();
    fd.append('file', new Blob([bytes], { type: mime || 'audio/wav' }), 'fala.wav');
    fd.append('model', model);
    fd.append('language', iso(lang));
    fd.append('response_format', 'json');
    fd.append('temperature', '0');
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { authorization: `Bearer ${apiKey}` }, body: fd });
    if (r.ok) { const j = await r.json(); return String((j && j.text) || '').trim(); }
    const t = await r.text(); ultimo = t.slice(0, 300);
    if (r.status === 401) throw new ErroIA('A chave da Groq está inválida. Confira GROQ_API_KEY na Vercel.', true);
    if (r.status === 429) throw new ErroIA('A IA atingiu o limite de uso por agora. Tenta de novo em um minuto.', true);
    if (r.status === 404 || (r.status === 400 && /model|decommissioned|not found/i.test(t))) continue;
    throw new ErroIA('Falha ao ouvir o áudio (Groq): ' + ultimo, true);
  }
  throw new ErroIA('Nenhum modelo de áudio da Groq disponível. Último erro: ' + ultimo, true);
}

async function viaGroq({ apiKey, modo, de, para, texto, base64, mime }) {
  const D = nome(de), P = nome(para);
  const chat = [...new Set([(process.env.GROQ_MODEL || '').trim(), ...GROQ_CHAT].filter(Boolean))];
  if (modo === 'texto') return groqChat(apiKey, promptTexto(D, P, texto), chat);
  if (modo === 'imagem') {
    return groqChat(apiKey, [
      { type: 'text', text: promptImagem(P) },
      { type: 'image_url', image_url: { url: `data:${mime || 'image/jpeg'};base64,${base64}` } },
    ], chat);
  }
  // áudio: primeiro vira texto (whisper), depois traduz
  const falado = await groqTranscrever(apiKey, base64, mime, de);
  if (!falado) return { original: '', traduzido: '' };
  const out = await groqChat(apiKey, promptTexto(D, P, falado), chat);
  return { original: falado, traduzido: out.traduzido };
}

// =====================================================================
// GEMINI
// =====================================================================
const GEMINI_MODELOS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

async function viaGemini({ apiKey, modo, de, para, texto, base64, mime }) {
  const D = nome(de), P = nome(para);
  const parts = [];
  if (modo === 'texto') parts.push({ text: promptTexto(D, P, texto) });
  else if (modo === 'imagem') parts.push({ text: promptImagem(P) }, { inline_data: { mime_type: mime || 'image/jpeg', data: base64 } });
  else parts.push({ text: promptAudio(D, P) }, { inline_data: { mime_type: mime || 'audio/wav', data: base64 } });
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { original: { type: 'STRING' }, traduzido: { type: 'STRING' } }, required: ['original', 'traduzido'] } },
  });
  const candidatos = [...new Set([(process.env.GEMINI_MODEL || '').trim(), ...GEMINI_MODELOS].filter(Boolean))];
  let ultimo = '';
  for (const modelo of candidatos) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey }, body,
    });
    if (r.ok) {
      const j = await r.json();
      const txt = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts ? j.candidates[0].content.parts.map((p) => p.text || '').join('') : '';
      const out = extrairJson(txt);
      if (!out) throw new ErroIA('A IA respondeu num formato inesperado. Tenta de novo.');
      return limpar(out);
    }
    const t = await r.text(); ultimo = t.slice(0, 300);
    if (r.status === 400 && /API key not valid/i.test(t)) throw new ErroIA('A chave do Gemini está inválida. Confira GEMINI_API_KEY na Vercel.', true);
    if (r.status === 403) throw new ErroIA('O Google bloqueou este projeto do Gemini ("denied access"). Use uma chave da Groq (GROQ_API_KEY) — grátis e sem cartão.', true);
    if (r.status === 429) throw new ErroIA('A IA atingiu o limite de uso por agora. Tenta de novo em um minuto.', true);
    if (r.status === 404 || /not found|no longer available|not supported/i.test(t)) continue;
    throw new ErroIA('Falha na IA (Gemini): ' + ultimo, true);
  }
  throw new ErroIA('Nenhum modelo do Gemini disponível. Último erro: ' + ultimo, true);
}

// =====================================================================
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

    // aceita o nome em MAIÚSCULAS (padrão) ou em minúsculas (como foi salvo na Vercel)
    const env = (k) => (process.env[k] || process.env[k.toLowerCase()] || '').trim();
    const groqKey = env('GROQ_API_KEY');
    const geminiKey = env('GEMINI_API_KEY');
    if (!groqKey && !geminiKey) return Response.json({ ok: false, erro: 'Nenhuma chave de IA configurada na Vercel (GROQ_API_KEY ou GEMINI_API_KEY).' }, { status: 500 });

    const { modo, de, para, texto, base64, mime } = await request.json();
    if (!['texto', 'imagem', 'audio'].includes(modo)) return Response.json({ ok: false, erro: 'Modo inválido' }, { status: 400 });
    if (modo === 'texto') {
      if (!texto || !texto.trim()) return Response.json({ ok: false, erro: 'Sem texto' }, { status: 400 });
      if (texto.length > 4000) return Response.json({ ok: false, erro: 'Texto grande demais (máx. 4.000 letras)' }, { status: 413 });
    } else if (!base64) {
      return Response.json({ ok: false, erro: modo === 'audio' ? 'Sem áudio' : 'Sem imagem' }, { status: 400 });
    }
    const args = { modo, de: de || 'pt-BR', para: para || 'pt-BR', texto, base64, mime };

    const provedores = [];
    if (groqKey) provedores.push(() => viaGroq({ apiKey: groqKey, ...args }));
    if (geminiKey) provedores.push(() => viaGemini({ apiKey: geminiKey, ...args }));

    let ultimoErro = null;
    for (const p of provedores) {
      try {
        const out = await p();
        return Response.json({ ok: true, ...out });
      } catch (e) {
        ultimoErro = e;
        if (!(e instanceof ErroIA) || !e.tentarOutro) break;
      }
    }
    const msg = ultimoErro && ultimoErro.message ? ultimoErro.message : 'A IA não respondeu.';
    return Response.json({ ok: false, erro: msg }, { status: 502 });
  } catch (e) {
    return Response.json({ ok: false, erro: 'Erro inesperado: ' + (e && e.message ? e.message : String(e)) }, { status: 500 });
  }
}

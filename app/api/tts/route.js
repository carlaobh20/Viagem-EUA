// Voz pra "Conversar" — gera o áudio no servidor e devolve um MP3.
//
// Por que existe: a voz nativa do celular (Web Speech) falha de um jeito diferente
// em cada aparelho — no iPhone fica muda com a chavinha de silencioso ligada, em
// muitos Android não existe voz em inglês instalada, e o Chrome corta frases.
// Um MP3 tocado por <audio> não depende de nada disso: mesma voz em todo aparelho.
//
// A fonte é o serviço de voz do Google Tradutor (gratuito, sem chave). Não é uma
// API oficial — se um dia parar, o app cai sozinho pra voz nativa (ver lib/voz.js).
// Limite do serviço: ~200 caracteres por pedido, por isso o texto é quebrado em
// pedaços e os MP3s são emendados.

export const runtime = 'nodejs';

const MAX = 190;
const LANG_OK = /^[a-z]{2}(-[A-Za-z]{2,4})?$/;

// Quebra em frases/pedaços de até MAX caracteres, respeitando pontuação e espaços.
function pedacos(txt) {
  const out = [];
  const frases = txt.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…;:])\s+/);
  let atual = '';
  for (const f of frases) {
    if (!f) continue;
    if ((atual + ' ' + f).trim().length <= MAX) { atual = (atual + ' ' + f).trim(); continue; }
    if (atual) out.push(atual);
    if (f.length <= MAX) { atual = f; continue; }
    // frase gigante sem pontuação: corta por palavra
    let buf = '';
    for (const w of f.split(' ')) {
      if ((buf + ' ' + w).trim().length > MAX) { if (buf) out.push(buf); buf = w; } else buf = (buf + ' ' + w).trim();
    }
    atual = buf;
  }
  if (atual) out.push(atual);
  return out;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  let tl = (searchParams.get('tl') || 'en').trim();
  if (!q) return new Response('Sem texto', { status: 400 });
  if (q.length > 1500) return new Response('Texto grande demais', { status: 413 });
  if (!LANG_OK.test(tl)) tl = 'en';
  // o serviço entende 'en', 'es', 'fr'…; pra português mantém o sotaque do Brasil
  const base = tl.toLowerCase().startsWith('pt') ? 'pt-BR' : tl.split('-')[0].toLowerCase();

  try {
    const partes = pedacos(q);
    const buffers = [];
    for (const p of partes) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(base)}&q=${encodeURIComponent(p)}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', Referer: 'https://translate.google.com/' },
        cache: 'no-store',
      });
      if (!r.ok) return new Response('Serviço de voz indisponível', { status: 502 });
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('audio')) return new Response('Serviço de voz indisponível', { status: 502 });
      buffers.push(Buffer.from(await r.arrayBuffer()));
    }
    const mp3 = Buffer.concat(buffers);
    return new Response(mp3, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(mp3.length),
        // mesmo texto + idioma = mesmo áudio: pode guardar por um ano (no aparelho e na Vercel)
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    return new Response('Serviço de voz indisponível', { status: 502 });
  }
}

// Leitura em voz alta (Web Speech API — nativa do celular, sem servidor).
//
// Por que o som "não funcionava" antes:
// 1. Chrome (Android) descarta a fala no meio se o objeto da frase não ficar
//    guardado em algum lugar — por isso o `_atual` aqui embaixo.
// 2. Chamar cancel() e speak() no mesmo instante engole a frase no iPhone —
//    agora, se já tem algo falando, cancela e espera um instante antes de falar.
// 3. Muitos aparelhos não têm voz em inglês instalada. Aí não é bug: é preciso
//    instalar a voz no sistema. `temVoz()` deixa a tela avisar isso em vez de
//    ficar muda sem explicação.

let _vozes = [];
let _atual = null;

export function carregarVozes() {
  try {
    const synth = typeof window !== 'undefined' && window.speechSynthesis;
    if (!synth) return [];
    _vozes = synth.getVoices() || [];
    return _vozes;
  } catch (e) { return []; }
}

export function suportaVoz() { return typeof window !== 'undefined' && !!window.speechSynthesis; }

function base(lang) { return String(lang || '').toLowerCase().split(/[-_]/)[0]; }

export function escolherVoz(lang) {
  if (!_vozes.length) carregarVozes();
  const alvo = String(lang || '').toLowerCase().replace('_', '-');
  const b = base(lang);
  return _vozes.find((v) => v.lang && v.lang.toLowerCase().replace('_', '-') === alvo)
    || _vozes.find((v) => base(v.lang) === b)
    || null;
}

// true = tem voz pra esse idioma; false = não tem; null = ainda não deu pra saber
// (o iPhone só entrega a lista de vozes depois de um tempo / do primeiro toque)
export function temVoz(lang) {
  if (!suportaVoz()) return false;
  if (!_vozes.length) carregarVozes();
  if (!_vozes.length) return null;
  return !!escolherVoz(lang);
}

// ----- Caminho 1 (preferido): MP3 gerado no servidor (/api/tts) -----
// Mesma voz em qualquer aparelho, toca mesmo com o iPhone no silencioso, não
// depende de voz instalada. O <audio> é criado UMA vez e o play() é chamado
// dentro do toque da pessoa — é isso que o iPhone exige pra deixar tocar.
let _audio = null;
function audioEl() {
  if (_audio) return _audio;
  _audio = new Audio();
  _audio.preload = 'auto';
  try { _audio.setAttribute('playsinline', ''); } catch (e) {}
  return _audio;
}

export function pararDeFalar() {
  try { if (_audio) { _audio.pause(); _audio.removeAttribute('src'); _audio.load(); } } catch (e) {}
  try { if (suportaVoz()) window.speechSynthesis.cancel(); } catch (e) {}
  _atual = null;
}

/**
 * Lê o texto em voz alta. Tenta o MP3 do servidor; se falhar (sem internet,
 * serviço fora), cai pra voz nativa do aparelho.
 * @param {string} txt
 * @param {string} lang  ex.: 'en-US'
 * @param {(estado: 'falando'|'ok'|'erro'|'sem-voz') => void} [onEstado]
 */
export function falar(txt, lang = 'en-US', onEstado) {
  if (!txt) { onEstado && onEstado('sem-voz'); return; }
  if (typeof window === 'undefined') return;
  pararDeFalar();
  const a = audioEl();
  let caiuPraNativa = false;
  const nativa = () => { if (caiuPraNativa) return; caiuPraNativa = true; falarNativo(txt, lang, onEstado); };
  a.onplaying = () => onEstado && onEstado('falando');
  a.onended = () => onEstado && onEstado('ok');
  a.onerror = nativa;
  a.onstalled = null;
  try {
    a.src = `/api/tts?tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(txt)}`;
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(nativa);
  } catch (e) { nativa(); }
}

// ----- Caminho 2 (reserva): voz nativa do aparelho (Web Speech) -----
function falarNativo(txt, lang = 'en-US', onEstado) {
  const synth = suportaVoz() ? window.speechSynthesis : null;
  if (!synth || !txt) { onEstado && onEstado('sem-voz'); return; }
  const dispara = () => {
    try {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = lang;
      u.rate = 0.9; // um pouco mais devagar, mais fácil de entender
      const v = escolherVoz(lang);
      if (v) u.voice = v;
      u.onstart = () => onEstado && onEstado('falando');
      u.onend = () => { _atual = null; onEstado && onEstado('ok'); };
      u.onerror = (e) => { _atual = null; onEstado && onEstado(e && e.error === 'interrupted' ? 'ok' : 'erro'); };
      _atual = u; // segura a referência (ver nota 1 lá em cima)
      synth.speak(u);
      setTimeout(() => { try { synth.resume(); } catch (e) {} }, 50); // Chrome às vezes começa pausado
    } catch (e) { onEstado && onEstado('erro'); }
  };
  if (synth.speaking || synth.pending) { try { synth.cancel(); } catch (e) {} setTimeout(dispara, 150); }
  else dispara();
}

// Só aparece quando o MP3 do servidor E a voz nativa falharam.
export function dicaInstalarVoz(nomeIdioma) {
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const semNet = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (semNet) return 'Sem internet: a voz precisa de conexão (ou de uma voz instalada no aparelho).';
  if (ios) return `Não consegui tocar o áudio. Confira o volume, e se ainda assim ficar mudo: Ajustes → Acessibilidade → Conteúdo Falado → Vozes → ${nomeIdioma}.`;
  return `Não consegui tocar o áudio. Confira o volume de mídia, e se ainda assim ficar mudo: Configurações → Conversão de texto em voz → instalar dados de voz em ${nomeIdioma}.`;
}

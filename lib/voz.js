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

/**
 * @param {string} txt
 * @param {string} lang  ex.: 'en-US'
 * @param {(estado: 'falando'|'ok'|'erro'|'sem-voz') => void} [onEstado]
 */
export function falar(txt, lang = 'en-US', onEstado) {
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

export function pararDeFalar() { try { if (suportaVoz()) window.speechSynthesis.cancel(); } catch (e) {} _atual = null; }

// Instruções pra instalar a voz que falta — o motivo nº 1 de "não sai som".
export function dicaInstalarVoz(nomeIdioma) {
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (ios) return `Seu iPhone não tem voz em ${nomeIdioma}. Ajustes → Acessibilidade → Conteúdo Falado → Vozes → ${nomeIdioma} → baixar uma voz.`;
  return `Seu aparelho não tem voz em ${nomeIdioma}. Configurações → Sistema (ou Idioma) → Conversão de texto em voz → Google Text-to-speech → Instalar dados de voz → ${nomeIdioma}.`;
}

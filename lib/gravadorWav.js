// Gravador de voz em WAV (16 kHz, mono) — funciona igual no iPhone e no Android.
//
// Por que não usar o MediaRecorder: cada celular grava num formato diferente
// (webm no Android, mp4 no iPhone) e a IA não aceita todos. WAV é universal.
// Usa ScriptProcessorNode (antigo, mas é o que roda em todo navegador, inclusive
// o Safari) e reduz pra 16 kHz — o bastante pra voz, e o arquivo fica pequeno
// (30 s ≈ 1 MB).

const TAXA_ALVO = 16000;

function reduzir(buffer, taxaOrigem) {
  if (taxaOrigem === TAXA_ALVO) return buffer;
  const razao = taxaOrigem / TAXA_ALVO;
  const n = Math.round(buffer.length / razao);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ini = Math.floor(i * razao), fim = Math.min(buffer.length, Math.floor((i + 1) * razao));
    let soma = 0, c = 0;
    for (let j = ini; j < fim; j++) { soma += buffer[j]; c++; }
    out[i] = c ? soma / c : 0;
  }
  return out;
}

function paraWav(samples, taxa) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, taxa, true); v.setUint32(28, taxa * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/**
 * Começa a gravar. Devolve { parar(): Promise<Blob>, cancelar() }.
 * Lança erro se não houver microfone / permissão.
 */
export async function iniciarGravacao({ maxSegundos = 60, onNivel } = {}) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Este navegador não deixa gravar áudio.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  try { await ctx.resume(); } catch (e) {}
  const fonte = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const pedacos = [];
  let total = 0;
  const limite = ctx.sampleRate * maxSegundos;
  let parou = false;
  proc.onaudioprocess = (ev) => {
    if (parou) return;
    const d = ev.inputBuffer.getChannelData(0);
    pedacos.push(new Float32Array(d));
    total += d.length;
    if (onNivel) { let m = 0; for (let i = 0; i < d.length; i += 16) m = Math.max(m, Math.abs(d[i])); onNivel(m); }
    if (total >= limite) parou = true;
  };
  fonte.connect(proc);
  proc.connect(ctx.destination); // no Safari, sem conectar na saída o processador não roda
  const desligar = () => {
    parou = true;
    try { proc.disconnect(); fonte.disconnect(); } catch (e) {}
    try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { ctx.close(); } catch (e) {}
  };
  return {
    parar: async () => {
      desligar();
      const tudo = new Float32Array(total);
      let o = 0; for (const p of pedacos) { tudo.set(p.subarray(0, Math.min(p.length, total - o)), o); o += p.length; if (o >= total) break; }
      return paraWav(reduzir(tudo, ctx.sampleRate), TAXA_ALVO);
    },
    cancelar: desligar,
  };
}

export function blobParaBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '../DataProvider';
import { dataLocal, hojeLocal } from '../../lib/format';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function fmtChip(d) {
  const dt = new Date(d + 'T00:00:00');
  return { wd: DIAS_SEMANA[dt.getDay()], dia: String(dt.getDate()).padStart(2, '0'), mes: MESES[dt.getMonth()] };
}
function fmtTituloDia(d) {
  const dt = new Date(d + 'T00:00:00');
  return `${DIAS_SEMANA[dt.getDay()][0].toUpperCase()}${DIAS_SEMANA[dt.getDay()].slice(1)}, ${dt.getDate()} de ${MESES[dt.getMonth()]}`;
}
function fmtHora(iso) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
}
function fmtDur(seg) {
  const s = Math.max(0, Math.round(seg || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function extDeMime(mime) {
  if (!mime) return 'webm';
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('aac')) return 'aac';
  return 'webm';
}
function reduzirImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1400;
      let w = img.width, h = img.height;
      if (w > max || h > max) { if (w >= h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' })) : reject(new Error('falha ao processar imagem'));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem inválida')); };
    img.src = url;
  });
}

export default function Diario({ ir }) {
  const { viagem, diario, perfis, perfil, adicionarEntradaDiario, removerEntradaDiario, urlDiario } = useData();

  const diasComEntrada = Array.from(new Set((diario || []).map((e) => e.data))).sort();
  const diasBase = (() => {
    if (viagem && viagem.data_ida && viagem.data_volta) {
      const lista = [];
      let d = new Date(viagem.data_ida + 'T00:00:00');
      const fim = new Date(viagem.data_volta + 'T00:00:00');
      let guard = 0;
      while (d <= fim && guard < 120) { lista.push(dataLocal(d)); d.setDate(d.getDate() + 1); guard += 1; }
      return lista;
    }
    return Array.from(new Set([...diasComEntrada, hojeLocal()])).sort();
  })();
  const [diaExtra, setDiaExtra] = useState([]);
  const dias = Array.from(new Set([...diasBase, ...diaExtra])).sort();

  const [diaSel, setDiaSel] = useState(() => (diasBase.includes(hojeLocal()) ? hojeLocal() : (diasBase[diasBase.length - 1] || hojeLocal())));
  const dataInputRef = useRef(null);

  const entradasDoDia = (diario || [])
    .filter((e) => e.data === diaSel)
    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));

  // ===== composer =====
  const [texto, setTexto] = useState('');
  const [fotos, setFotos] = useState([]); // { file, preview }
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const fileRef = useRef(null);
  const [publicando, setPublicando] = useState(false);
  const [fotoAberta, setFotoAberta] = useState(null);

  // ===== gravação de áudio =====
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [gravando, setGravando] = useState(false);
  const [tempoGrav, setTempoGrav] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [audioSeg, setAudioSeg] = useState(0);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    fotos.forEach((f) => URL.revokeObjectURL(f.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function escolherMime() {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
    const candidatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
    return candidatos.find((c) => MediaRecorder.isTypeSupported(c)) || '';
  }

  async function iniciarGravacao() {
    if (typeof window === 'undefined' || !navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      alert('Seu navegador não suporta gravação de áudio.'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = escolherMime();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setGravando(true);
      setTempoGrav(0);
      timerRef.current = setInterval(() => setTempoGrav((t) => t + 1), 1000);
    } catch (e) {
      alert('Não consegui acessar o microfone. Verifique a permissão do navegador para este site.');
    }
  }
  function pararGravacao() {
    if (mediaRecorderRef.current && gravando) mediaRecorderRef.current.stop();
    setGravando(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioSeg(tempoGrav);
  }
  function descartarAudio() {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioBlob(null); setAudioPreview(null); setAudioSeg(0); setTempoGrav(0);
  }

  async function aoEscolherFotos(e) {
    const arquivos = Array.from(e.target.files || []);
    if (!arquivos.length) return;
    setProcessandoFotos(true);
    try {
      const novas = [];
      for (const f of arquivos) { const reduzida = await reduzirImagem(f); novas.push({ file: reduzida, preview: URL.createObjectURL(reduzida) }); }
      setFotos((prev) => [...prev, ...novas]);
    } catch (err) { alert('Não consegui processar uma das fotos.'); }
    finally { setProcessandoFotos(false); if (fileRef.current) fileRef.current.value = ''; }
  }
  function removerFoto(i) { setFotos((prev) => { const cp = [...prev]; URL.revokeObjectURL(cp[i].preview); cp.splice(i, 1); return cp; }); }

  const podePublicar = (texto.trim() || fotos.length > 0 || audioBlob) && !publicando && !gravando;

  async function publicar() {
    if (!podePublicar) return;
    setPublicando(true);
    try {
      await adicionarEntradaDiario({
        data: diaSel,
        texto,
        fotos: fotos.map((f) => f.file),
        audioBlob: audioBlob || null,
        audioExt: audioBlob ? extDeMime(audioBlob.type) : null,
        audioDuracao: audioBlob ? (audioSeg || tempoGrav) : null,
      });
      setTexto('');
      fotos.forEach((f) => URL.revokeObjectURL(f.preview));
      setFotos([]);
      descartarAudio();
    } catch (e) {
      alert('Não consegui salvar: ' + (e && e.message ? e.message : 'erro desconhecido'));
    } finally { setPublicando(false); }
  }

  function apagar(entrada) {
    if (window.confirm('Apagar esse momento do diário? Não tem como desfazer.')) removerEntradaDiario(entrada);
  }

  function autorDe(entrada) { return (perfis || []).find((p) => p.id === entrada.perfil_id); }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ padding: '4px 2px 16px' }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Diário da viagem</div>
        <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 2 }}>Escreva, grave um áudio ou guarde uma foto de cada dia</div>
      </div>

      {/* seletor de dias */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 16, WebkitOverflowScrolling: 'touch' }}>
        {dias.map((d) => {
          const c = fmtChip(d);
          const ativo = d === diaSel;
          const temEntrada = diasComEntrada.includes(d);
          return (
            <button key={d} onClick={() => setDiaSel(d)} style={{
              flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 13px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: ativo ? 'var(--ui-teal, #0E9C8C)' : 'var(--ui-card)',
              color: ativo ? '#fff' : 'var(--ui-ink)', boxShadow: 'var(--ui-shadow)', position: 'relative',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.85 }}>{c.wd}</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{c.dia}</span>
              <span style={{ fontSize: 9.5, opacity: 0.85 }}>{c.mes}</span>
              {temEntrada && !ativo && <span style={{ position: 'absolute', top: 6, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--ui-teal, #0E9C8C)' }} />}
            </button>
          );
        })}
        <button onClick={() => dataInputRef.current && dataInputRef.current.showPicker ? dataInputRef.current.showPicker() : dataInputRef.current.click()} style={{
          flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44,
          borderRadius: 14, border: '1px dashed var(--ui-line-strong, var(--ui-line))', cursor: 'pointer', background: 'transparent', color: 'var(--ui-muted)', fontSize: 18,
        }} aria-label="Escolher outro dia">+
          <input ref={dataInputRef} type="date" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
            onChange={(e) => { const v = e.target.value; if (v) { setDiaExtra((prev) => Array.from(new Set([...prev, v]))); setDiaSel(v); } }} />
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ui-muted)', margin: '0 2px 10px' }}>{fmtTituloDia(diaSel)}</div>

      {/* composer */}
      <div style={{ ...card, padding: 14, marginBottom: 18 }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que aconteceu nesse dia?"
          rows={3}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 14, fontFamily: 'inherit', background: 'transparent', color: 'var(--ui-ink)', minHeight: 60 }}
        />

        {fotos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, marginTop: 10 }}>
            {fotos.map((f, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removerFoto(i)} aria-label="Remover foto" style={{
                  position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 12, lineHeight: 1, cursor: 'pointer',
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {(gravando || audioBlob) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '8px 12px', borderRadius: 12, background: 'var(--ui-bg)' }}>
            {gravando ? (
              <>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E0413B', animation: 'v3Pulse 1.1s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Gravando… {fmtDur(tempoGrav)}</span>
                <button onClick={pararGravacao} style={{ border: 'none', background: '#E0413B', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Parar</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }}>🎙️</span>
                <audio src={audioPreview} controls style={{ flex: 1, height: 32 }} />
                <span style={{ fontSize: 12, color: 'var(--ui-muted)' }}>{fmtDur(audioSeg || tempoGrav)}</span>
                <button onClick={descartarAudio} aria-label="Descartar áudio" style={{ border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 15, cursor: 'pointer' }}>✕</button>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={aoEscolherFotos} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current && fileRef.current.click()} disabled={processandoFotos} className="v3-press" style={{
            border: '1px solid var(--ui-line)', background: 'var(--ui-card)', color: 'var(--ui-ink)', borderRadius: 20, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>📷 {processandoFotos ? 'Processando…' : 'Foto'}</button>

          {!gravando && !audioBlob && (
            <button onClick={iniciarGravacao} className="v3-press" style={{
              border: '1px solid var(--ui-line)', background: 'var(--ui-card)', color: 'var(--ui-ink)', borderRadius: 20, padding: '8px 13px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>🎤 Áudio</button>
          )}

          <div style={{ flex: 1 }} />
          <button onClick={publicar} disabled={!podePublicar} className="v3-press" style={{
            border: 'none', borderRadius: 20, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: podePublicar ? 'pointer' : 'default',
            background: podePublicar ? 'linear-gradient(135deg,#10B981,#0EA5E9)' : 'var(--ui-line)', color: podePublicar ? '#fff' : 'var(--ui-faint)',
          }}>{publicando ? 'Publicando…' : 'Publicar'}</button>
        </div>
      </div>

      {/* feed do dia */}
      {entradasDoDia.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, padding: '30px 10px' }}>Nada registrado nesse dia ainda. Comece escrevendo, gravando um áudio ou adicionando uma foto acima.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entradasDoDia.map((entrada) => {
          const autor = autorDe(entrada);
          const meu = perfil && entrada.perfil_id === perfil.id;
          return (
            <div key={entrada.id} className="v3-in" style={{ ...card, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: (autor && autor.cor) || 'var(--ui-teal, #0E9C8C)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  {(autor ? autor.nome : '?').slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{autor ? autor.nome : 'Alguém da viagem'}</div>
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--ui-faint)' }}>{fmtHora(entrada.criado_em)}</span>
                {meu && (
                  <button onClick={() => apagar(entrada)} aria-label="Apagar" style={{ border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', padding: '2px 4px' }}>🗑️</button>
                )}
              </div>

              {entrada.texto && <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: (entrada.fotos && entrada.fotos.length) || entrada.audio_url ? 10 : 0 }}>{entrada.texto}</div>}

              {entrada.fotos && entrada.fotos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: entrada.fotos.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(96px, 1fr))', gap: 6, marginBottom: entrada.audio_url ? 10 : 0 }}>
                  {entrada.fotos.map((p, i) => {
                    const url = urlDiario(p);
                    return (
                      <button key={i} onClick={() => setFotoAberta(url)} style={{ border: 'none', padding: 0, cursor: 'pointer', borderRadius: 10, overflow: 'hidden', aspectRatio: entrada.fotos.length === 1 ? '16/10' : '1' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </button>
                    );
                  })}
                </div>
              )}

              {entrada.audio_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>🎙️</span>
                  <audio src={urlDiario(entrada.audio_url)} controls style={{ flex: 1, height: 32 }} />
                  {entrada.audio_duracao ? <span style={{ fontSize: 11.5, color: 'var(--ui-faint)' }}>{fmtDur(entrada.audio_duracao)}</span> : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fotoAberta && (
        <div onClick={() => setFotoAberta(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={fotoAberta} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
          <button onClick={() => setFotoAberta(null)} aria-label="Fechar" style={{ position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '../DataProvider';
import { dataLocal, hojeLocal } from '../../lib/format';
import { supabase } from '../../lib/supabaseClient';
import { Button, PageHeader, Segmented, Reveal } from '../ui';

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

// Botão da barra do composer (Foto, Áudio, Limpar): só ícone, redondo, alvo de 44px.
// Em 375px não cabe Foto + Áudio + 🗑 + Publicar com rótulo — o rótulo vai no aria-label/title.
function BotaoComposer({ label, onClick, disabled, tom, children }) {
  const cores = tom === 'danger' ? { background: 'var(--ui-debit-soft)', color: 'var(--ui-debit)' } : { background: 'var(--ui-sunken)', color: 'var(--ui-ink)' };
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="ui-iconbtn ui-press" style={{ borderRadius: 999, fontSize: 18, opacity: disabled ? 0.5 : 1, ...cores }}>{children}</button>
  );
}

export default function Diario({ ir }) {
  const { viagem, diario, perfis, perfil, adicionarEntradaDiario, removerEntradaDiario, urlDiario } = useData();

  // Viagem sozinha não tem com quem compartilhar o diário — o modo "Em grupo"
  // some (não tem sentido sem mais ninguém) e fica só o individual, sem
  // precisar escolher.
  const sozinho = (perfis || []).length <= 1;
  const [modo, setModo] = useState('grupo'); // 'grupo' | 'individual'
  const modoEfetivo = sozinho ? 'individual' : modo;
  const diarioDoModo = (diario || []).filter((e) => (e.modo || 'grupo') === modoEfetivo);

  const diasComEntrada = Array.from(new Set(diarioDoModo.map((e) => e.data))).sort();
  const temDatasDaViagem = !!(viagem && viagem.data_ida && viagem.data_volta);
  const diasBase = (() => {
    if (temDatasDaViagem) {
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

  // Dia inicial: hoje (durante a viagem); antes da viagem, o primeiro dia; depois, o último.
  const [diaSel, setDiaSel] = useState(() => {
    const h = hojeLocal();
    if (diasBase.includes(h)) return h;
    if (diasBase.length && h < diasBase[0]) return diasBase[0];
    return diasBase[diasBase.length - 1] || h;
  });
  const chipsRef = useRef(null);
  useEffect(() => {
    // deixa o dia escolhido visível na tira de dias
    const el = chipsRef.current && chipsRef.current.querySelector(`[data-dia="${diaSel}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [diaSel]);
  const dataInputRef = useRef(null);

  const entradasDoDia = diarioDoModo
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

  // ===== IA: transforma o áudio (e/ou o texto rascunhado) na entrada do diário =====
  const [ia, setIa] = useState({ rodando: false, msg: '', ok: false });
  const podeIA = !gravando && !ia.rodando && (audioBlob || texto.trim().length >= 8);
  function blobParaBase64(blob) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(blob); });
  }
  async function escreverComIA() {
    if (!podeIA) return;
    if (audioBlob && audioBlob.size > 3.5 * 1024 * 1024) { setIa({ rodando: false, msg: 'Áudio muito longo pra IA (máx. uns 5 minutos). Grava em partes ou publica só o áudio.', ok: false }); return; }
    setIa({ rodando: true, msg: audioBlob ? 'Ouvindo o áudio e escrevendo…' : 'Organizando o texto…', ok: false });
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : null;
      const body = { modo: 'diario', texto: texto.trim() || undefined };
      if (audioBlob) { body.base64 = await blobParaBase64(audioBlob); body.mime = audioBlob.type || 'audio/webm'; }
      const r = await fetch('/api/ia', { method: 'POST', headers: { 'content-type': 'application/json', authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      const d = j && j.ok && j.diario;
      if (!d || !d.texto) { setIa({ rodando: false, msg: (j && j.erro) || 'Não entendi o áudio. Tenta gravar mais perto do celular, sem barulho em volta.', ok: false }); return; }
      const partes = [];
      if (d.titulo) partes.push(`✨ ${d.titulo}`);
      partes.push(d.texto);
      if (d.destaques && d.destaques.length) partes.push('Destaques:\n' + d.destaques.map((x) => `• ${x}`).join('\n'));
      if (d.lugares && d.lugares.length) partes.push(`📍 ${d.lugares.join(' · ')}`);
      setTexto(partes.join('\n\n'));
      setIa({ rodando: false, msg: 'Pronto — revisa, ajusta o que quiser e publica. O áudio continua anexado (tira no ✕ se não quiser).', ok: true });
    } catch (e) { setIa({ rodando: false, msg: 'Sem resposta da IA agora. Tenta de novo em instantes.', ok: false }); }
  }

  const podePublicar = (texto.trim() || fotos.length > 0 || audioBlob) && !publicando && !gravando;
  const temRascunho = !!(texto.trim() || fotos.length > 0 || audioBlob);
  // Descarta tudo o que ainda não foi publicado: texto (inclusive o que a IA
  // escreveu), áudio gravado e fotos escolhidas.
  function limparTudo() {
    if (!temRascunho) return;
    if (!window.confirm('Apagar o que você escreveu, gravou e escolheu? Nada disso foi publicado ainda.')) return;
    if (gravando) pararGravacao();
    setTexto('');
    fotos.forEach((f) => URL.revokeObjectURL(f.preview));
    setFotos([]);
    descartarAudio();
    setIa({ rodando: false, msg: '', ok: false });
  }

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
        modo: modoEfetivo,
      });
      setTexto('');
      fotos.forEach((f) => URL.revokeObjectURL(f.preview));
      setFotos([]);
      descartarAudio();
      setIa({ rodando: false, msg: '', ok: false });
    } catch (e) {
      alert('Não consegui salvar: ' + (e && e.message ? e.message : 'erro desconhecido'));
    } finally { setPublicando(false); }
  }

  function apagar(entrada) {
    if (window.confirm('Apagar esse momento do diário? Não tem como desfazer.')) removerEntradaDiario(entrada);
  }

  function autorDe(entrada) { return (perfis || []).find((p) => p.id === entrada.perfil_id); }

  // Cabeçalho: "Dia 3 de 12 · 2 registros" (ou a data, quando a viagem não tem datas)
  const diaVazio = entradasDoDia.length === 0;
  const idxDia = diasBase.indexOf(diaSel);
  const n = entradasDoDia.length;
  const registros = n === 0 ? 'nenhum registro ainda' : `${n} registro${n === 1 ? '' : 's'}`;
  const subtitulo = temDatasDaViagem && idxDia >= 0
    ? `Dia ${idxDia + 1} de ${diasBase.length} · ${registros}`
    : `${fmtTituloDia(diaSel)} · ${registros}`;

  return (
    <div className="ui-screen ui-theme">
      <PageHeader titulo="Diário da viagem" subtitulo={subtitulo} />

      {/* individual x grupo — só aparece com mais de uma pessoa na viagem */}
      {sozinho ? (
        <div className="ui-caption ui-faint" style={{ margin: '0 2px 14px' }}>🔒 Diário particular — só você vê.</div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <Segmented opcoes={[{ id: 'grupo', label: '👥 Em grupo' }, { id: 'individual', label: '🔒 Individual' }]} valor={modo} onChange={setModo} />
          <div className="ui-hint" style={{ margin: '6px 2px 0' }}>
            {modo === 'grupo' ? 'Todo mundo da viagem vê e participa dessa conversa.' : 'Só você vê o que escrever aqui — seu diário particular da viagem.'}
          </div>
        </div>
      )}

      {/* seletor de dias */}
      <div ref={chipsRef} className="ui-chips-scroll" style={{ marginBottom: 12, alignItems: 'stretch' }}>
        {dias.map((d) => {
          const c = fmtChip(d);
          const ativo = d === diaSel;
          const temEntrada = diasComEntrada.includes(d);
          return (
            <button key={d} data-dia={d} onClick={() => setDiaSel(d)} aria-pressed={ativo} aria-label={fmtTituloDia(d)} className="ui-press" style={{
              flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
              minWidth: 52, minHeight: 56, padding: '6px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: ativo ? 'var(--ui-teal)' : 'var(--ui-card)',
              color: ativo ? '#fff' : 'var(--ui-ink)', boxShadow: ativo ? 'none' : 'var(--ui-shadow)', position: 'relative',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: ativo ? 0.9 : 0.7 }}>{c.wd}</span>
              <span className="ui-num" style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>{c.dia}</span>
              <span style={{ fontSize: 9.5, opacity: ativo ? 0.9 : 0.7 }}>{c.mes}</span>
              {temEntrada && !ativo && <span aria-hidden="true" style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--ui-teal)' }} />}
            </button>
          );
        })}
        <button onClick={() => dataInputRef.current && dataInputRef.current.showPicker ? dataInputRef.current.showPicker() : dataInputRef.current.click()} className="ui-press" style={{
          flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, minHeight: 56,
          borderRadius: 14, border: '1.5px dashed var(--ui-line-strong)', cursor: 'pointer', background: 'transparent', color: 'var(--ui-muted)', fontSize: 20, position: 'relative',
        }} aria-label="Escolher outro dia">+
          <input ref={dataInputRef} type="date" tabIndex={-1} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            onChange={(e) => { const v = e.target.value; if (v) { setDiaExtra((prev) => Array.from(new Set([...prev, v]))); setDiaSel(v); } }} />
        </button>
      </div>

      <div className="ui-section" style={{ margin: '0 4px 10px' }}>{fmtTituloDia(diaSel)}</div>

      {/* composer: protagonista quando o dia está vazio; mais compacto quando já tem registros */}
      <div className="ui-card" style={{ padding: 14, marginBottom: 18 }}>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={modoEfetivo === 'individual' ? 'Escreva algo só seu sobre esse dia…' : 'O que aconteceu nesse dia?'}
          rows={diaVazio ? 4 : 2}
          aria-label="Texto do diário"
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 15, lineHeight: 1.45, fontFamily: 'inherit', background: 'transparent', color: 'var(--ui-ink)', minHeight: diaVazio ? 84 : 48, padding: '2px 0' }}
        />

        {fotos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, marginTop: 10 }}>
            {fotos.map((f, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removerFoto(i)} aria-label="Remover foto" style={{
                  position: 'absolute', top: 2, right: 2, width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 12, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {(gravando || audioBlob) && (
          <div className="ui-sunken" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '6px 6px 6px 12px', minHeight: 48 }}>
            {gravando ? (
              <>
                <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--ui-debit)', animation: 'v3Pulse 1.1s ease-in-out infinite', flex: '0 0 auto' }} />
                <span className="ui-num" style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Gravando… {fmtDur(tempoGrav)}</span>
                <Button variant="danger" size="sm" onClick={pararGravacao} style={{ minHeight: 40 }}>Parar</Button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }} aria-hidden="true">🎙️</span>
                <audio src={audioPreview} controls style={{ flex: 1, minWidth: 0, height: 32 }} />
                <span className="ui-caption ui-num">{fmtDur(audioSeg || tempoGrav)}</span>
                <button onClick={descartarAudio} aria-label="Descartar áudio" style={{ width: 40, height: 40, border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 15, cursor: 'pointer', borderRadius: 10, flex: '0 0 auto' }}>✕</button>
              </>
            )}
          </div>
        )}

        {/* IA do diário */}
        {(audioBlob || texto.trim().length >= 8 || ia.msg) && !gravando && (
          <div className="ui-sunken" style={{ marginTop: 10, padding: '8px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="soft" onClick={escreverComIA} disabled={!podeIA} style={{ borderRadius: 999, flex: '0 0 auto' }}>
                {ia.rodando ? '✨ Escrevendo…' : audioBlob ? '✨ Escrever com IA (do áudio)' : '✨ Arrumar com IA'}
              </Button>
              <span className="ui-caption" style={{ flex: 1, minWidth: 140 }}>
                {ia.msg
                  ? <span style={{ color: ia.ok ? 'var(--ui-credit)' : (ia.rodando ? 'var(--ui-muted)' : 'var(--ui-debit)'), fontWeight: ia.rodando ? 500 : 600 }}>{ia.msg}</span>
                  : (audioBlob ? 'A IA ouve o que você contou e escreve o dia bonito: título, parágrafos, destaques e lugares.' : 'A IA organiza seu rascunho em título, parágrafos e destaques.')}
              </span>
            </div>
          </div>
        )}
        {!audioBlob && !gravando && !texto.trim() && diaVazio && (
          <div className="ui-hint" style={{ marginTop: 4 }}>Dica: toca em 🎤, conta o dia do seu jeito (até uns 5 min), e depois em ✨ pra IA escrever por você.</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={aoEscolherFotos} style={{ display: 'none' }} />
          <BotaoComposer label={processandoFotos ? 'Processando fotos…' : 'Adicionar foto'} onClick={() => fileRef.current && fileRef.current.click()} disabled={processandoFotos}>{processandoFotos ? '⏳' : '📷'}</BotaoComposer>

          {!gravando && !audioBlob && (
            <BotaoComposer label="Gravar áudio" onClick={iniciarGravacao}>🎤</BotaoComposer>
          )}

          {temRascunho && !publicando && (
            <BotaoComposer label="Apagar texto, áudio e fotos não publicados" onClick={limparTudo} tom="danger">🗑</BotaoComposer>
          )}

          <span className="ui-caption ui-faint" style={{ flex: 1, minWidth: 0, fontSize: 11 }}>{processandoFotos ? 'Processando fotos…' : ''}</span>
          <Button onClick={publicar} disabled={!podePublicar} style={{ borderRadius: 999, flex: '0 0 auto' }}>{publicando ? 'Publicando…' : 'Publicar'}</Button>
        </div>
      </div>

      {/* feed do dia */}
      {diaVazio && (
        <div className="ui-empty ui-in" style={{ padding: '10px 18px 20px' }}>
          <div className="ico" aria-hidden="true">{modoEfetivo === 'individual' ? '🔒' : '📖'}</div>
          <div className="t">{modoEfetivo === 'individual' ? 'Nada no seu diário particular nesse dia ainda.' : 'Ninguém escreveu nada nesse dia ainda.'}</div>
          <div className="s">Comece escrevendo, gravando um áudio ou adicionando uma foto acima.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entradasDoDia.map((entrada, i) => {
          const autor = autorDe(entrada);
          const meu = perfil && entrada.perfil_id === perfil.id;
          const temMidia = (entrada.fotos && entrada.fotos.length) || entrada.audio_url;
          return (
            <Reveal key={entrada.id} delay={Math.min(i, 4) * 0.04}>
              <div className="ui-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="avatar" style={{ width: 28, height: 28, background: (autor && autor.cor) || 'var(--ui-teal)' }}>
                    {(autor ? autor.nome : '?').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="ui-clamp1" style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700 }}>{autor ? autor.nome : 'Alguém da viagem'}</div>
                  <span className="ui-caption ui-faint ui-num">{fmtHora(entrada.criado_em)}</span>
                  {meu && (
                    <button onClick={() => apagar(entrada)} aria-label="Apagar" title="Apagar" style={{ width: 40, height: 40, margin: '-8px -10px -8px 0', border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', borderRadius: 10, flex: '0 0 auto' }}>🗑️</button>
                  )}
                </div>

                {entrada.texto && <div className="ui-wrap" style={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: temMidia ? 10 : 0 }}>{entrada.texto}</div>}

                {entrada.fotos && entrada.fotos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: entrada.fotos.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(96px, 1fr))', gap: 6, marginBottom: entrada.audio_url ? 10 : 0 }}>
                    {entrada.fotos.map((p, i2) => {
                      const url = urlDiario(p);
                      return (
                        <button key={i2} onClick={() => setFotoAberta(url)} aria-label="Abrir foto" className="ui-press" style={{ border: 'none', padding: 0, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', aspectRatio: entrada.fotos.length === 1 ? '16/10' : '1', background: 'var(--ui-sunken)' }}>
                          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {entrada.audio_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }} aria-hidden="true">🎙️</span>
                    <audio src={urlDiario(entrada.audio_url)} controls style={{ flex: 1, minWidth: 0, height: 32 }} />
                    {entrada.audio_duracao ? <span className="ui-caption ui-faint ui-num">{fmtDur(entrada.audio_duracao)}</span> : null}
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>

      {fotoAberta && (
        <div onClick={() => setFotoAberta(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,43,54,.92)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={fotoAberta} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }} />
          <button onClick={() => setFotoAberta(null)} aria-label="Fechar" style={{ position: 'absolute', top: 18, right: 18, width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.16)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}

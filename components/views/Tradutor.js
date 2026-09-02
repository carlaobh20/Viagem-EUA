'use client';
import { useState, useEffect, useRef } from 'react';
import { IDIOMAS, idioma, traduzir, pedirIA } from '../../lib/traduzir';
import { falar, dicaInstalarVoz } from '../../lib/voz';
import { iniciarGravacao, blobParaBase64 } from '../../lib/gravadorWav';

// Reduz a foto antes de ler (celular manda foto de 12 MP; o leitor fica lento e
// não fica mais preciso com isso). Também corrige orientação via createImageBitmap.
async function fotoParaCanvas(file, max = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  const img = bmp || await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const w = img.width, h = img.height;
  const esc = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * esc); c.height = Math.round(h * esc);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// Foto → JPEG pequeno em base64 pra mandar pra IA (ela lê o texto e já traduz).
async function fotoParaBase64(file) {
  const c = await fotoParaCanvas(file, 1600);
  const dataUrl = c.toDataURL('image/jpeg', 0.85);
  return dataUrl.split(',')[1] || '';
}

const LS_DE = 'tradutor-de', LS_PARA = 'tradutor-para';
function lerLS(k, padrao) { try { return localStorage.getItem(k) || padrao; } catch (e) { return padrao; } }
function gravarLS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

export default function Tradutor({ idiomaDestino }) {
  // padrão: português → língua do destino (falar com alguém). Foto inverte sozinha
  // (foto quase sempre é cardápio/placa na língua de lá → português). ⇄ troca na mão.
  const [de, setDe] = useState(() => lerLS(LS_DE, 'pt-BR'));
  const [para, setPara] = useState(() => lerLS(LS_PARA, idiomaDestino || 'en-US'));
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState('');
  const [erro, setErro] = useState('');
  const [traduzindo, setTraduzindo] = useState(false);
  const [falando, setFalando] = useState(null); // 'de' | 'para' | null
  const [avisoVoz, setAvisoVoz] = useState('');
  const camRef = useRef(null), galRef = useRef(null);
  const timer = useRef(null);
  const pedido = useRef(0);
  const [ouvindo, setOuvindo] = useState(false);   // gravando a voz
  const [pensando, setPensando] = useState('');    // IA trabalhando: mensagem de status
  const [nivel, setNivel] = useState(0);           // volume do microfone (só visual)
  const gravRef = useRef(null);
  const timerGrav = useRef(null);
  const [segs, setSegs] = useState(0);
  useEffect(() => () => { try { gravRef.current && gravRef.current.cancelar(); } catch (e) {} clearInterval(timerGrav.current); }, []);

  useEffect(() => { gravarLS(LS_DE, de); gravarLS(LS_PARA, para); }, [de, para]);

  // traduz sozinho enquanto digita (espera a pessoa parar de digitar por 700 ms)
  useEffect(() => {
    clearTimeout(timer.current);
    const t = texto.trim();
    if (!t) { setResultado(''); setErro(''); setTraduzindo(false); return; }
    setTraduzindo(true);
    timer.current = setTimeout(async () => {
      const meu = ++pedido.current;
      try {
        const out = await traduzir(t, de, para);
        if (meu !== pedido.current) return; // já veio outro texto depois
        setResultado(out); setErro('');
      } catch (e) {
        if (meu !== pedido.current) return;
        setResultado(''); setErro(e.message || 'Não deu pra traduzir.');
      } finally { if (meu === pedido.current) setTraduzindo(false); }
    }, 700);
    return () => clearTimeout(timer.current);
  }, [texto, de, para]);

  function inverter() { const a = de; setDe(para); setPara(a); if (resultado) { setTexto(resultado); } }

  async function escolherFoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setErro('');
    // foto é quase sempre texto na língua de lá: se estava "português → X", vira "X → português"
    let deFoto = de, paraFoto = para;
    if (de === 'pt-BR' && para !== 'pt-BR') { deFoto = para; paraFoto = 'pt-BR'; setDe(para); setPara('pt-BR'); }
    setPensando('📖 Lendo a foto e traduzindo…');
    try {
      const base64 = await fotoParaBase64(file);
      const { original, traduzido } = await pedirIA({ modo: 'imagem', de: deFoto, para: paraFoto, base64, mime: 'image/jpeg' });
      if (!original && !traduzido) { setErro('Não achei texto legível na foto. Tenta mais perto, com luz e sem tremer.'); return; }
      pedido.current += 1; // não deixa o tradutor automático refazer o que a IA já fez
      setTexto(original); setResultado(traduzido);
    } catch (err) { setErro(err.message || 'Não consegui ler a foto.'); }
    finally { setPensando(''); }
  }

  // 🎤: grava em WAV (funciona no iPhone e no Android), manda pra IA, que devolve
  // o que foi dito + a tradução. Depois lê a tradução em voz alta.
  async function ditar() {
    if (ouvindo) { await pararGravacao(); return; }
    setErro(''); setResultado(''); setTexto('');
    try {
      const g = await iniciarGravacao({ maxSegundos: 60, onNivel: (n) => setNivel(n) });
      gravRef.current = g;
      setOuvindo(true); setSegs(0);
      timerGrav.current = setInterval(() => setSegs((x) => { if (x + 1 >= 60) pararGravacao(); return x + 1; }), 1000);
    } catch (err) {
      const m = String(err && err.name || '');
      if (m === 'NotAllowedError' || m === 'SecurityError') setErro('Preciso de permissão pro microfone. Toque no cadeado ao lado do endereço (ou em Ajustes → Safari/Chrome) e libere o microfone.');
      else if (m === 'NotFoundError') setErro('Não achei microfone neste aparelho.');
      else setErro(err.message || 'Não consegui ligar o microfone.');
    }
  }

  async function pararGravacao() {
    clearInterval(timerGrav.current);
    const g = gravRef.current; gravRef.current = null;
    setOuvindo(false); setNivel(0);
    if (!g) return;
    setPensando('🧠 Entendendo o que você disse…');
    try {
      const blob = await g.parar();
      if (segs < 1 && blob.size < 20000) { setErro('Gravação curta demais. Toque em 🎤, fale a frase, e toque de novo pra parar.'); return; }
      const base64 = await blobParaBase64(blob);
      const { original, traduzido } = await pedirIA({ modo: 'audio', de, para, base64, mime: 'audio/wav' });
      if (!original && !traduzido) { setErro('Não entendi o áudio. Fala um pouco mais perto do microfone e tenta de novo.'); return; }
      pedido.current += 1; // a IA já traduziu; não refaz
      setTexto(original); setResultado(traduzido);
      if (traduzido) falar(traduzido, idioma(para).voz, (st) => setFalando(st === 'falando' ? 'para' : null));
    } catch (err) { setErro(err.message || 'Não consegui entender o áudio.'); }
    finally { setPensando(''); }
  }

  function ouvir(lado) {
    const txt = lado === 'de' ? texto : resultado;
    const lang = idioma(lado === 'de' ? de : para).voz;
    const nome = idioma(lado === 'de' ? de : para).nome;
    setAvisoVoz('');
    falar(txt, lang, (st) => {
      if (st === 'falando') setFalando(lado);
      else if (st === 'sem-voz' || st === 'erro') { setFalando(null); setAvisoVoz(dicaInstalarVoz(nome)); }
      else setFalando(null);
    });
  }

  async function copiar() { try { await navigator.clipboard.writeText(resultado); } catch (e) {} }

  const card = { background: 'var(--ui-card)', borderRadius: 16, boxShadow: 'var(--ui-shadow)' };
  const sel = { border: '1px solid var(--ui-line)', borderRadius: 12, padding: '9px 10px', fontSize: 13.5, fontWeight: 600, background: 'var(--ui-bg)', color: 'var(--ui-ink)', flex: 1, minWidth: 0 };
  const btnFoto = { flex: 1, border: '1px solid var(--ui-line)', borderRadius: 12, padding: '10px 8px', background: 'var(--ui-card)', color: 'var(--ui-ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const btnSom = (on) => ({ border: 'none', background: on ? 'var(--ui-teal)' : 'rgba(0,199,177,.14)', color: on ? '#fff' : 'var(--ui-teal)', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer', flex: '0 0 auto' });
  const ocupado = !!pensando;

  return (
    <div>
      {/* idiomas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <select value={de} onChange={(e) => setDe(e.target.value)} style={sel} aria-label="Traduzir de">
          {IDIOMAS.map((i) => <option key={i.code} value={i.code}>{i.bandeira} {i.nome}</option>)}
        </select>
        <button onClick={inverter} aria-label="Inverter idiomas" style={{ border: 'none', background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)', width: 38, height: 38, borderRadius: 12, fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>⇄</button>
        <select value={para} onChange={(e) => setPara(e.target.value)} style={sel} aria-label="Traduzir para">
          {IDIOMAS.map((i) => <option key={i.code} value={i.code}>{i.bandeira} {i.nome}</option>)}
        </select>
      </div>

      {/* entrada */}
      <div style={{ ...card, padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--ui-faint)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>{idioma(de).bandeira} {idioma(de).nome}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {texto && <button onClick={() => ouvir('de')} aria-label="Ouvir o texto original" style={btnSom(falando === 'de')}>🔊</button>}
            {texto && <button onClick={() => { setTexto(''); setResultado(''); setErro(''); }} aria-label="Limpar" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 16, cursor: 'pointer' }}>✕</button>}
          </div>
        </div>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Digite ou cole em ${idioma(de).nome.toLowerCase()}… ou tire uma foto do texto`} rows={4}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 16, fontFamily: 'inherit', background: 'transparent', color: 'var(--ui-ink)', minHeight: 70 }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={ditar} disabled={ocupado} style={{ ...btnFoto, flex: 1.3, background: ouvindo ? '#E14B5A' : 'var(--ui-teal)', color: '#fff', border: 'none', opacity: ocupado ? 0.6 : 1, boxShadow: ouvindo ? `0 0 0 ${Math.round(nivel * 10)}px rgba(225,75,90,.25)` : 'none', transition: 'box-shadow .1s' }}>
            {ouvindo ? `● Gravando ${segs}s — toque pra parar` : `🎤 Falar em ${idioma(de).nome.toLowerCase()}`}
          </button>
          <button onClick={() => camRef.current && camRef.current.click()} disabled={ocupado || ouvindo} style={{ ...btnFoto, opacity: (ocupado || ouvindo) ? 0.6 : 1 }}>📷 Foto</button>
          <button onClick={() => galRef.current && galRef.current.click()} disabled={ocupado || ouvindo} style={{ ...btnFoto, opacity: (ocupado || ouvindo) ? 0.6 : 1 }}>🖼️</button>
        </div>
        {ouvindo && <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 8 }}>Fale a frase e toque no botão vermelho quando terminar.</div>}
        <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={escolherFoto} style={{ display: 'none' }} />
        <input ref={galRef} type="file" accept="image/*" onChange={escolherFoto} style={{ display: 'none' }} />
        {pensando && <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 8 }}>{pensando}</div>}
      </div>

      {/* resultado */}
      {(resultado || traduzindo || erro) && (
        <div style={{ ...card, padding: 14, marginBottom: 10, background: 'rgba(0,199,177,.08)', boxShadow: 'none', border: '1px solid rgba(0,199,177,.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ui-teal)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700 }}>{idioma(para).bandeira} {idioma(para).nome}</span>
            {resultado && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => ouvir('para')} aria-label="Ouvir a tradução" style={btnSom(falando === 'para')}>🔊</button>
                <button onClick={copiar} aria-label="Copiar" style={{ border: 'none', background: 'rgba(0,199,177,.14)', color: 'var(--ui-teal)', height: 36, padding: '0 12px', borderRadius: 18, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Copiar</button>
              </div>
            )}
          </div>
          {erro ? <div style={{ fontSize: 13.5, color: '#B42318' }}>{erro}</div>
            : traduzindo && !resultado ? <div style={{ fontSize: 13.5, color: 'var(--ui-muted)' }}>traduzindo…</div>
              : <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.35, whiteSpace: 'pre-wrap', opacity: traduzindo ? 0.6 : 1 }}>{resultado}</div>}
        </div>
      )}

      {avisoVoz && <div style={{ fontSize: 12, color: '#B42318', margin: '0 4px 10px', lineHeight: 1.4 }}>🔇 {avisoVoz}</div>}

      <div style={{ fontSize: 11.5, color: 'var(--ui-faint)', margin: '4px 4px 0', lineHeight: 1.4 }}>
        Tradução, leitura de foto e de voz feitas pela IA do app. Foto: aproxime e deixe com luz. Voz: fale perto do celular, sem música alta em volta. Precisa de internet.
      </div>
    </div>
  );
}

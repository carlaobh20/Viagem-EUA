'use client';
import { useState, useRef } from 'react';
import { useData } from '../DataProvider';

// Documentos da viagem: PDF ou foto de passagem, reserva, ESTA, seguro, passaporte...
// Ficam num cofre privado (só quem está na viagem abre, por link que vence em 1 h).
// Um documento pode ser "só eu vejo" — passaporte, por exemplo.

export const CATEGORIAS_DOC = [
  { id: 'passagem', nome: 'Passagens', emoji: '✈️' },
  { id: 'hospedagem', nome: 'Hospedagem / reservas', emoji: '🏨' },
  { id: 'motorhome', nome: 'Motorhome / carro', emoji: '🚐' },
  { id: 'visto', nome: 'Visto / ESTA', emoji: '🛂' },
  { id: 'seguro', nome: 'Seguro viagem', emoji: '🛡️' },
  { id: 'identidade', nome: 'Passaporte / identidade', emoji: '🪪' },
  { id: 'ingresso', nome: 'Ingressos / parques', emoji: '🎟️' },
  { id: 'outros', nome: 'Outros', emoji: '📄' },
];
const cat = (id) => CATEGORIAS_DOC.find((c) => c.id === id) || CATEGORIAS_DOC[CATEGORIAS_DOC.length - 1];

const TAM_MAX = 20 * 1024 * 1024;
function fmtTamanho(b) {
  if (!b) return '';
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
const ehPdf = (m) => m === 'application/pdf';
const ehImagem = (m) => /^image\//.test(m || '');

// Foto: reduz pra no máximo 1800 px e JPEG 0.8 (passaporte continua legível, arquivo cai pra ~500 KB)
function reduzirImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1800;
      let w = img.width, h = img.height;
      const esc = Math.min(1, max / Math.max(w, h));
      w = Math.round(w * esc); h = Math.round(h * esc);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); blob ? resolve(blob) : reject(new Error('Falha ao processar a imagem')); }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Formato de imagem não suportado')); };
    img.src = url;
  });
}

const rotulo = { fontSize: 11.5, fontWeight: 700, color: 'var(--ui-muted)', margin: '0 2px 5px', letterSpacing: '.3px' };
const Campo = ({ label, children }) => <div style={{ marginBottom: 12 }}><div style={rotulo}>{label}</div>{children}</div>;

export default function Documentos({ ir }) {
  const { viagem, perfil, perfis, documentos, adicionarDocumento, editarDocumento, removerDocumento, urlDocumento } = useData();
  const meu = perfil?.user_id;
  const inputArq = useRef(null);
  const inputFoto = useRef(null);
  const [form, setForm] = useState(null);  // { id?, titulo, categoria, obs, privado, file?, mime?, nomeArquivo? }
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [abrindo, setAbrindo] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 15, background: 'var(--ui-bg)', color: 'var(--ui-ink)', fontFamily: 'inherit' };

  const lista = documentos || [];
  const visiveis = filtro === 'todos' ? lista : lista.filter((d) => (d.categoria || 'outros') === filtro);
  const grupos = CATEGORIAS_DOC.map((c) => ({ ...c, docs: visiveis.filter((d) => (d.categoria || 'outros') === c.id) })).filter((g) => g.docs.length > 0);
  const comDocs = new Set(lista.map((d) => d.categoria || 'outros'));

  function abrirNovo(categoria) { setErro(''); setForm({ titulo: '', categoria: categoria || 'passagem', obs: '', privado: false, file: null, mime: null, nomeArquivo: '' }); }
  function abrirEdicao(d) { setErro(''); setForm({ id: d.id, titulo: d.titulo || '', categoria: d.categoria || 'outros', obs: d.obs || '', privado: !!d.privado, mime: d.mime, nomeArquivo: '' }); }

  async function aoEscolher(e) {
    const file = e.target.files && e.target.files[0];
    const input = e.target;
    if (!file) return;
    setErro('');
    try {
      let blob = file, mime = file.type || '';
      if (ehImagem(mime)) { blob = await reduzirImagem(file); mime = 'image/jpeg'; }
      else if (!ehPdf(mime)) { setErro('Só aceito PDF ou foto (JPG/PNG). Se for outro tipo, tira um print ou salva como PDF.'); return; }
      if (blob.size > TAM_MAX) { setErro('Arquivo grande demais (máx. 20 MB).'); return; }
      setForm((f) => ({ ...f, file: blob, mime, nomeArquivo: file.name || (ehPdf(mime) ? 'documento.pdf' : 'foto.jpg'), titulo: f.titulo || (file.name || '').replace(/\.[^.]+$/, '') }));
    } catch (err) { setErro('Não consegui abrir esse arquivo: ' + err.message); }
    finally { if (input) input.value = ''; }
  }

  async function salvar() {
    if (!form) return;
    if (!form.titulo.trim()) { setErro('Dá um nome pro documento (ex.: Passagem ida LATAM).'); return; }
    if (!form.id && !form.file) { setErro('Escolhe o arquivo (PDF ou foto).'); return; }
    setSalvando(true); setErro('');
    const r = form.id
      ? await editarDocumento(form.id, { titulo: form.titulo, categoria: form.categoria, obs: form.obs, privado: form.privado })
      : await adicionarDocumento({ titulo: form.titulo, categoria: form.categoria, obs: form.obs, privado: form.privado, file: form.file, mime: form.mime });
    setSalvando(false);
    if (r && r.erro) { setErro(r.erro); return; }
    setForm(null);
  }
  async function apagar(d) {
    if (!window.confirm(`Apagar "${d.titulo}"? O arquivo some pra todo mundo da viagem.`)) return;
    await removerDocumento(d);
    setForm(null);
  }
  async function abrir(d, baixar) {
    setAbrindo(d.id + (baixar ? 'b' : 'a'));
    // no iPhone, window.open precisa acontecer dentro do toque — abre a aba antes e troca a URL depois
    const aba = !baixar && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    const u = await urlDocumento(d, baixar);
    setAbrindo('');
    if (!u) { if (aba) aba.close(); window.alert('Não consegui abrir o documento agora. Confere a internet.'); return; }
    if (aba) aba.location.href = u; else window.location.href = u;
  }

  const Doc = ({ d }) => {
    const c = cat(d.categoria);
    const dono = d.user_id === meu;
    return (
      <div style={{ ...card, padding: 12, marginBottom: 10, display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', columnGap: 10 }}>
        <button onClick={() => abrir(d, false)} aria-label="Abrir" style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: ehPdf(d.mime) ? 'rgba(220,38,38,.10)' : 'rgba(14,156,140,.12)', fontSize: 20, cursor: 'pointer' }}>{ehPdf(d.mime) ? '📕' : '🖼️'}</button>
        <div style={{ minWidth: 0 }}>
          <div onClick={() => abrir(d, false)} style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere', cursor: 'pointer' }}>{d.privado ? '🔒 ' : ''}{d.titulo}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ui-muted)', marginTop: 2 }}>{c.emoji} {c.nome}{d.tamanho ? ` · ${fmtTamanho(d.tamanho)}` : ''}{ehPdf(d.mime) ? ' · PDF' : ' · foto'}</div>
          {d.obs && <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{d.obs}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <button onClick={() => abrir(d, false)} disabled={abrindo === d.id + 'a'} style={{ border: 'none', borderRadius: 999, padding: '6px 12px', background: 'var(--ui-teal)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{abrindo === d.id + 'a' ? 'Abrindo…' : '👁 Abrir'}</button>
            <button onClick={() => abrir(d, true)} disabled={abrindo === d.id + 'b'} style={{ border: '1px solid var(--ui-line)', borderRadius: 999, padding: '6px 12px', background: 'transparent', color: 'var(--ui-ink)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>⬇ Baixar</button>
            <button onClick={() => abrirEdicao(d)} style={{ border: '1px solid var(--ui-line)', borderRadius: 999, padding: '6px 12px', background: 'transparent', color: 'var(--ui-muted)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>✏️</button>
            {(dono || !d.privado) && <button onClick={() => apagar(d)} aria-label="Apagar" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', marginLeft: 'auto' }}>✕</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <input ref={inputArq} type="file" accept="application/pdf,image/*" onChange={aoEscolher} style={{ display: 'none' }} />
      <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={aoEscolher} style={{ display: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => (form ? setForm(null) : ir('menu'))} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>{form ? (form.id ? 'Editar documento' : 'Novo documento') : 'Documentos'}</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>{form ? 'PDF ou foto, até 20 MB' : `${lista.length} arquivo${lista.length === 1 ? '' : 's'} · ${(perfis || []).length > 1 ? 'todos da viagem veem' : 'guardados na viagem'}`}</div>
        </div>
        {!form && <button onClick={() => abrirNovo()} style={{ border: 'none', borderRadius: 12, padding: '9px 14px', background: 'var(--ui-teal)', color: '#fff', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', flex: '0 0 auto' }}>+ Adicionar</button>}
      </div>

      {form ? (
        <div style={{ ...card, padding: 16 }}>
          {!form.id && (
            <Campo label="ARQUIVO">
              {form.file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--ui-line)', borderRadius: 12, padding: '10px 12px', background: 'var(--ui-bg)' }}>
                  <span style={{ fontSize: 22 }}>{ehPdf(form.mime) ? '📕' : '🖼️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.nomeArquivo}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ui-muted)' }}>{fmtTamanho(form.file.size)}{ehImagem(form.mime) ? ' · foto comprimida' : ''}</div>
                  </div>
                  <button onClick={() => inputArq.current && inputArq.current.click()} style={{ border: 'none', background: 'none', color: 'var(--ui-teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>trocar</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => inputArq.current && inputArq.current.click()} style={{ flex: 1, border: '1.5px dashed var(--ui-line)', borderRadius: 12, padding: '16px 8px', background: 'transparent', color: 'var(--ui-ink)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>📎 PDF ou imagem<div style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 500, marginTop: 3 }}>do celular / e-mail</div></button>
                  <button onClick={() => inputFoto.current && inputFoto.current.click()} style={{ flex: 1, border: '1.5px dashed var(--ui-line)', borderRadius: 12, padding: '16px 8px', background: 'transparent', color: 'var(--ui-ink)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>📷 Tirar foto<div style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 500, marginTop: 3 }}>do documento em papel</div></button>
                </div>
              )}
            </Campo>
          )}
          <Campo label="NOME"><input style={inp} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Passagem ida LATAM · Reserva Cruise America" /></Campo>
          <Campo label="TIPO">
            <select style={inp} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS_DOC.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
            </select>
          </Campo>
          <Campo label="OBSERVAÇÃO (opcional)"><textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Nº da reserva, validade, o que conferir…" /></Campo>
          <Campo label="QUEM VÊ">
            <div className="toggle">
              <button onClick={() => setForm({ ...form, privado: false })} style={!form.privado ? { background: 'var(--ui-teal)', color: '#fff', fontWeight: 700 } : {}}>👥 Todos da viagem</button>
              <button onClick={() => setForm({ ...form, privado: true })} style={form.privado ? { background: 'var(--ui-teal)', color: '#fff', fontWeight: 700 } : {}}>🔒 Só eu</button>
            </div>
          </Campo>

          {erro && <div style={{ color: '#C2410C', fontSize: 13, marginBottom: 10 }}>{erro}</div>}
          <button onClick={salvar} disabled={salvando} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 14, background: 'var(--ui-teal)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>{salvando ? 'Enviando…' : form.id ? 'Salvar' : 'Guardar documento'}</button>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={() => setForm(null)} style={{ flex: 1, border: '1px solid var(--ui-line)', borderRadius: 14, padding: 12, background: 'transparent', color: 'var(--ui-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            {form.id && <button onClick={() => apagar(lista.find((d) => d.id === form.id) || { id: form.id, titulo: form.titulo })} style={{ flex: 1, border: 'none', borderRadius: 14, padding: 12, background: 'rgba(194,65,12,.1)', color: '#C2410C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Apagar</button>}
          </div>
        </div>
      ) : (
        <>
          {lista.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 6 }}>
              {[{ id: 'todos', nome: 'Todos', emoji: '📁' }, ...CATEGORIAS_DOC.filter((c) => comDocs.has(c.id))].map((c) => (
                <button key={c.id} onClick={() => setFiltro(c.id)} style={{ border: 'none', borderRadius: 999, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', background: filtro === c.id ? 'var(--ui-teal)' : 'var(--ui-card)', color: filtro === c.id ? '#fff' : 'var(--ui-muted)', boxShadow: 'var(--ui-shadow)' }}>{c.emoji} {c.nome}</button>
              ))}
            </div>
          )}

          {lista.length === 0 && (
            <div style={{ ...card, padding: 22, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Tudo da viagem num lugar só</div>
              <div style={{ fontSize: 13, color: 'var(--ui-muted)', lineHeight: 1.45, marginBottom: 14 }}>Passagens, reserva do motorhome, ESTA, seguro, ingressos… Guarda o PDF que veio por e-mail ou tira foto do papel. No aeroporto ou na fronteira, abre daqui — sem caçar no e-mail.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIAS_DOC.slice(0, 6).map((c) => (
                  <button key={c.id} onClick={() => abrirNovo(c.id)} style={{ border: '1px solid var(--ui-line)', borderRadius: 12, padding: '10px 8px', background: 'var(--ui-bg)', color: 'var(--ui-ink)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>{c.emoji} {c.nome}</button>
                ))}
              </div>
            </div>
          )}

          {grupos.map((g) => (
            <div key={g.id} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 8px' }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)' }}>{g.emoji} {g.nome.toUpperCase()} <span style={{ color: 'var(--ui-faint)', fontWeight: 600 }}>· {g.docs.length}</span></span>
                <button onClick={() => abrirNovo(g.id)} style={{ border: 'none', background: 'none', color: 'var(--ui-teal)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>+ adicionar</button>
              </div>
              {g.docs.map((d) => <Doc key={d.id} d={d} />)}
            </div>
          ))}

          {lista.length > 0 && filtro !== 'todos' && grupos.length === 0 && <div style={{ textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, padding: 20 }}>Nada nesse tipo.</div>}

          <div style={{ fontSize: 11.5, color: 'var(--ui-faint)', marginTop: 8, padding: '0 4px', lineHeight: 1.45 }}>
            Os arquivos ficam num cofre privado: só quem está na viagem abre. Marcou "🔒 Só eu", ninguém mais vê. Dica: baixa os mais importantes no celular antes de embarcar — no avião não tem internet.
          </div>
        </>
      )}
    </div>
  );
}

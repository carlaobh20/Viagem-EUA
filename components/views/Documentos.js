'use client';
import { useState, useRef } from 'react';
import { useData } from '../DataProvider';
import { Button, Field, PageHeader, EmptyState, Segmented, Reveal, Expand, SectionHeader } from '../ui';

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

// ===== Peças de lista — fora do componente da tela de propósito: definidas lá
// dentro, o React trataria como componente novo a cada render (remonta tudo,
// perde foco de campo e reinicia a animação de expandir). =====

// Botão de ícone pequeno no desenho, mas com alvo de toque de 40px
const btnIcone = { width: 40, height: 40, border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, padding: 0, flex: '0 0 auto' };

// Uma linha de arquivo (dentro de um documento): nome + tipo/tamanho, ações pequenas à direita
function LinhaArquivo({ a, podeRemover, abrindo, onAbrir, onApagar }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, padding: '6px 0', minHeight: 48 }}>
      <span style={{ fontSize: 18 }} aria-hidden="true">{ehPdf(a.mime) ? '📕' : '🖼️'}</span>
      <div style={{ minWidth: 0 }}>
        <div onClick={() => onAbrir(a, false)} className="ui-wrap" style={{ fontSize: 13.5, fontWeight: 600, cursor: 'pointer', lineHeight: 1.25 }}>{a.nome || 'arquivo'}</div>
        <div className="ui-caption ui-faint" style={{ fontSize: 11 }}>{ehPdf(a.mime) ? 'PDF' : 'foto'}{a.tamanho ? ` · ${fmtTamanho(a.tamanho)}` : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="soft" size="sm" onClick={() => onAbrir(a, false)} disabled={abrindo === a.id + 'a'}>{abrindo === a.id + 'a' ? '…' : 'Abrir'}</Button>
        <button onClick={() => onAbrir(a, true)} disabled={abrindo === a.id + 'b'} aria-label="Baixar" title="Baixar" style={{ ...btnIcone, color: 'var(--ui-ink)', fontSize: 15 }}>⬇</button>
        {podeRemover && <button onClick={() => onApagar(a)} aria-label="Remover arquivo" style={btnIcone}>✕</button>}
      </div>
    </div>
  );
}

// Um documento na lista: linha tocável (abre/fecha os arquivos) + detalhes expandidos
function Doc({ d, meu, aberto, onAbrirFechar, onEditar, onApagar, abrindo, onAbrirArquivo, onApagarArquivo }) {
  const c = cat(d.categoria);
  const dono = d.user_id === meu;
  const podeMexer = dono || !d.privado;
  const n = d.arquivos.length;
  const exp = aberto || n <= 1;
  const icone = n > 1 ? '📂' : (n === 1 && ehPdf(d.arquivos[0].mime) ? '📕' : n === 1 ? '🖼️' : '📄');
  return (
    <div style={{ padding: '0 4px' }}>
      <div onClick={() => n > 1 && onAbrirFechar(d.id)} role={n > 1 ? 'button' : undefined} aria-expanded={n > 1 ? exp : undefined}
        style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', cursor: n > 1 ? 'pointer' : 'default', minHeight: 56, padding: '6px 0' }}>
        <span className="ui-sunken" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }} aria-hidden="true">{icone}</span>
        <div style={{ minWidth: 0 }}>
          <div className="ui-wrap" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{d.privado ? '🔒 ' : ''}{d.titulo}</div>
          <div className="ui-caption" style={{ marginTop: 2 }}>{c.emoji} {c.nome} · {n} arquivo{n === 1 ? '' : 's'}</div>
          {d.obs && <div className="ui-caption ui-wrap" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{d.obs}</div>}
        </div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); onEditar(d); }} aria-label="Editar" title="Editar" style={{ ...btnIcone, fontSize: 15 }}>✏️</button>
          {n > 1 && <span aria-hidden="true" style={{ color: 'var(--ui-faint)', fontSize: 14, width: 20, textAlign: 'center', transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }}>▾</span>}
        </div>
      </div>
      <Expand aberto={exp}>
        <div style={{ paddingBottom: 8 }}>
          <div className="ui-list" style={{ borderTop: '1px solid var(--ui-line)' }}>
            {d.arquivos.map((a) => <LinhaArquivo key={a.id} a={a} podeRemover={podeMexer && n > 1} abrindo={abrindo} onAbrir={onAbrirArquivo} onApagar={onApagarArquivo} />)}
          </div>
          {n === 0 && <div className="ui-caption ui-faint" style={{ padding: '6px 0' }}>Sem arquivo. Toque em ✏️ pra adicionar.</div>}
          {podeMexer && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
              <Button variant="ghost" size="sm" onClick={() => onEditar(d)} style={{ paddingLeft: 0 }}>+ adicionar arquivo</Button>
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={() => onApagar(d)} style={{ color: 'var(--ui-faint)', paddingRight: 0 }}>apagar documento</Button>
            </div>
          )}
        </div>
      </Expand>
    </div>
  );
}

// Botão grande tracejado de escolher arquivo (superfície outlined, inline com tokens)
function BotaoArquivo({ onClick, titulo, legenda }) {
  return (
    <button onClick={onClick} className="ui-press" style={{ flex: 1, minWidth: 0, minHeight: 64, border: '1.5px dashed var(--ui-line-strong)', borderRadius: 12, padding: '10px 8px', background: 'transparent', color: 'var(--ui-ink)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
      {titulo}
      <div className="ui-caption" style={{ fontWeight: 500, marginTop: 3 }}>{legenda}</div>
    </button>
  );
}

export default function Documentos({ ir }) {
  const { perfil, perfis, documentos, adicionarDocumento, adicionarArquivosDocumento, editarDocumento, removerDocumento, removerArquivoDocumento, urlArquivoDocumento } = useData();
  const meu = perfil?.user_id;
  const inputArq = useRef(null);
  const inputFoto = useRef(null);
  const [form, setForm] = useState(null);  // { id?, titulo, categoria, obs, privado, pendentes: [{file,mime,nome}] }
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [abrindo, setAbrindo] = useState('');
  const [filtroSel, setFiltro] = useState('todos');
  const [aberto, setAberto] = useState(null); // documento expandido na lista
  const [maisDetalhes, setMaisDetalhes] = useState(false); // observação + quem vê (secundários)

  const lista = (documentos || []).map((d) => ({ ...d, arquivos: d.arquivos || [] }));
  const comDocs = new Set(lista.map((d) => d.categoria || 'outros'));
  // Filtro só vale com mais de um tipo na lista; se o tipo escolhido sumiu (apagou tudo dele), volta pra "todos"
  const filtro = comDocs.size > 1 && comDocs.has(filtroSel) ? filtroSel : 'todos';
  const visiveis = filtro === 'todos' ? lista : lista.filter((d) => (d.categoria || 'outros') === filtro);
  const grupos = CATEGORIAS_DOC.map((c) => ({ ...c, docs: visiveis.filter((d) => (d.categoria || 'outros') === c.id) })).filter((g) => g.docs.length > 0);
  const totalArquivos = lista.reduce((n, d) => n + d.arquivos.length, 0);

  function abrirNovo(categoria) { setErro(''); setMaisDetalhes(false); setForm({ titulo: '', categoria: categoria || 'passagem', obs: '', privado: false, pendentes: [] }); }
  // Ao editar, os detalhes já abrem expandidos (a pessoa pode estar vindo justamente pra mexer neles)
  function abrirEdicao(d) { setErro(''); setMaisDetalhes(true); setForm({ id: d.id, titulo: d.titulo || '', categoria: d.categoria || 'outros', obs: d.obs || '', privado: !!d.privado, pendentes: [] }); }

  // aceita VÁRIOS arquivos de uma vez (o seu, o da esposa, o dos filhos…)
  async function aoEscolher(e) {
    const files = Array.from((e.target.files) || []);
    const input = e.target;
    if (!files.length) return;
    setErro('');
    const novos = [];
    const recusados = [];
    for (const file of files) {
      try {
        let blob = file, mime = file.type || '';
        if (ehImagem(mime)) { blob = await reduzirImagem(file); mime = 'image/jpeg'; }
        else if (!ehPdf(mime)) { recusados.push(file.name + ' (só PDF ou foto)'); continue; }
        if (blob.size > TAM_MAX) { recusados.push(file.name + ' (maior que 20 MB)'); continue; }
        novos.push({ file: blob, mime, nome: file.name || (ehPdf(mime) ? 'documento.pdf' : 'foto.jpg'), chave: Math.random().toString(36).slice(2) });
      } catch (err) { recusados.push(file.name); }
    }
    if (recusados.length) setErro('Não entrou: ' + recusados.join(', '));
    setForm((f) => ({ ...f, pendentes: [...f.pendentes, ...novos], titulo: f.titulo || (novos[0] ? novos[0].nome.replace(/\.[^.]+$/, '') : '') }));
    if (input) input.value = '';
  }
  const tirarPendente = (chave) => setForm((f) => ({ ...f, pendentes: f.pendentes.filter((p) => p.chave !== chave) }));

  async function salvar() {
    if (!form) return;
    if (!form.titulo.trim()) { setErro('Dá um nome pro documento (ex.: ESTA da família).'); return; }
    if (!form.id && !form.pendentes.length) { setErro('Escolhe pelo menos um arquivo (PDF ou foto).'); return; }
    setSalvando(true); setErro('');
    let r;
    if (form.id) {
      r = await editarDocumento(form.id, { titulo: form.titulo, categoria: form.categoria, obs: form.obs, privado: form.privado });
      if (r && r.ok && form.pendentes.length) r = await adicionarArquivosDocumento(form.id, form.pendentes);
    } else {
      r = await adicionarDocumento({ titulo: form.titulo, categoria: form.categoria, obs: form.obs, privado: form.privado, arquivos: form.pendentes });
    }
    setSalvando(false);
    if (r && r.erro) { setErro(r.erro); return; }
    if (r && r.aviso) window.alert(r.aviso);
    setForm(null);
  }
  async function apagar(d) {
    if (!window.confirm(`Apagar "${d.titulo}" e ${d.arquivos.length === 1 ? 'o arquivo' : `os ${d.arquivos.length} arquivos`}? Some pra todo mundo da viagem.`)) return;
    await removerDocumento(d);
    setForm(null);
  }
  async function apagarArquivo(a) {
    if (!window.confirm(`Remover "${a.nome || 'arquivo'}"?`)) return;
    await removerArquivoDocumento(a);
  }
  async function abrir(a, baixar) {
    setAbrindo(a.id + (baixar ? 'b' : 'a'));
    // no iPhone, window.open precisa acontecer dentro do toque — abre a aba antes e troca a URL depois
    const aba = !baixar && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    const u = await urlArquivoDocumento(a, baixar);
    setAbrindo('');
    if (!u) { if (aba) aba.close(); window.alert('Não consegui abrir o arquivo agora. Confere a internet.'); return; }
    if (aba) aba.location.href = u; else window.location.href = u;
  }

  const docEditando = form && form.id ? lista.find((d) => d.id === form.id) : null;
  const temArquivosNoForm = !!((docEditando && docEditando.arquivos.length) || (form && form.pendentes.length));

  const subtitulo = form
    ? 'Pode juntar vários arquivos num documento só'
    : (lista.length === 0
      ? 'Passagens, reservas, ESTA, seguro… num lugar só'
      : `${lista.length} documento${lista.length === 1 ? '' : 's'} · ${totalArquivos} arquivo${totalArquivos === 1 ? '' : 's'}${(perfis || []).length > 1 ? ' · todos da viagem veem' : ''}`);

  return (
    <div className="ui-screen ui-theme">
      <input ref={inputArq} type="file" accept="application/pdf,image/*" multiple onChange={aoEscolher} style={{ display: 'none' }} />
      <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={aoEscolher} style={{ display: 'none' }} />

      <PageHeader
        titulo={form ? (form.id ? 'Editar documento' : 'Novo documento') : 'Documentos'}
        subtitulo={subtitulo}
        onVoltar={() => (form ? setForm(null) : ir('menu'))}
        acao={!form && lista.length > 0 ? <Button onClick={() => abrirNovo()}>+ Adicionar</Button> : null}
      />

      {form ? (
        <Reveal>
          <div className="ui-card" style={{ padding: 16 }}>
            {/* em destaque: nome + arquivos */}
            <Field label="Nome do documento">
              <input className="ui-input" autoFocus={!form.id} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: ESTA da família · Passagens ida" />
            </Field>

            <Field label={`Arquivos${docEditando ? ` · ${docEditando.arquivos.length} já salvo${docEditando.arquivos.length === 1 ? '' : 's'}` : ''}`}>
              {temArquivosNoForm && (
                <div className="ui-list" style={{ marginBottom: 10 }}>
                  {docEditando && docEditando.arquivos.map((a) => <LinhaArquivo key={a.id} a={a} podeRemover abrindo={abrindo} onAbrir={abrir} onApagar={apagarArquivo} />)}
                  {form.pendentes.map((p) => (
                    <div key={p.chave} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, padding: '6px 0', minHeight: 48 }}>
                      <span style={{ fontSize: 18 }} aria-hidden="true">{ehPdf(p.mime) ? '📕' : '🖼️'}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="ui-wrap" style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{p.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--ui-teal-ink)', fontWeight: 600 }}>novo · {fmtTamanho(p.file.size)}{ehImagem(p.mime) ? ' · foto comprimida' : ''}</div>
                      </div>
                      <button onClick={() => tirarPendente(p.chave)} aria-label="Tirar" style={btnIcone}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <BotaoArquivo onClick={() => inputArq.current && inputArq.current.click()} titulo="📎 PDF ou imagem" legenda="pode escolher vários" />
                <BotaoArquivo onClick={() => inputFoto.current && inputFoto.current.click()} titulo="📷 Tirar foto" legenda="do papel" />
              </div>
            </Field>

            <Field label="Tipo">
              <select className="ui-input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS_DOC.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
              </select>
            </Field>

            {/* secundários: observação e quem vê */}
            {!maisDetalhes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => setMaisDetalhes(true)} style={{ paddingLeft: 0 }}>+ mais detalhes</Button>
                <span className="ui-caption ui-faint">observação · quem vê</span>
              </div>
            )}
            <Expand aberto={maisDetalhes}>
              <Field label="Observação" opcional>
                <textarea className="ui-input" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Nº da reserva, validade, o que conferir…" />
              </Field>
              <Field label="Quem vê" hint={form.privado ? 'Só você abre esse documento — bom pra passaporte e identidade.' : 'Todo mundo da viagem vê e pode abrir.'}>
                <Segmented opcoes={[{ id: 'todos', label: '👥 Todos da viagem' }, { id: 'eu', label: '🔒 Só eu' }]} valor={form.privado ? 'eu' : 'todos'} onChange={(id) => setForm({ ...form, privado: id === 'eu' })} />
              </Field>
            </Expand>

            {erro && <div className="ui-error" role="alert">{erro}</div>}
            <Button size="lg" full onClick={salvar} disabled={salvando} style={{ marginTop: 4 }}>
              {salvando ? `Enviando${form.pendentes.length > 1 ? ` ${form.pendentes.length} arquivos` : ''}…` : form.id ? 'Salvar' : `Guardar${form.pendentes.length > 1 ? ` (${form.pendentes.length} arquivos)` : ''}`}
            </Button>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <Button variant="secondary" full onClick={() => setForm(null)} style={{ flex: 1 }}>Cancelar</Button>
              {docEditando && <Button variant="danger" full onClick={() => apagar(docEditando)} style={{ flex: 1 }}>Apagar tudo</Button>}
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          {lista.length === 0 && (
            <EmptyState
              icone="🗂️"
              titulo="Seu cofre ainda está vazio."
              texto="Guarde aqui passagens, reserva do motorhome, ESTA, seguro, ingressos… Cada documento pode ter vários arquivos. No aeroporto, abre daqui, sem caçar no e-mail."
              cta="+ Adicionar documento"
              onCta={() => abrirNovo()}
              secundario={(
                <div className="chips" style={{ justifyContent: 'center' }}>
                  {CATEGORIAS_DOC.slice(0, 6).map((c) => (
                    <button key={c.id} className="chip ui-press" onClick={() => abrirNovo(c.id)}>{c.emoji} {c.nome}</button>
                  ))}
                </div>
              )}
            />
          )}

          {/* filtro por tipo — só quando há mais de um tipo pra filtrar */}
          {lista.length > 0 && comDocs.size > 1 && (
            <div className="ui-chips-scroll" style={{ marginBottom: 4 }}>
              {[{ id: 'todos', nome: 'Todos', emoji: '📁' }, ...CATEGORIAS_DOC.filter((c) => comDocs.has(c.id))].map((c) => (
                <button key={c.id} onClick={() => setFiltro(c.id)} className={`ui-chipbtn${filtro === c.id ? ' on' : ''}`} aria-pressed={filtro === c.id}>{c.emoji} {c.nome}</button>
              ))}
            </div>
          )}

          {/* um card por tipo, com os documentos em lista simples dentro */}
          {grupos.map((g) => (
            <div key={g.id} style={{ marginBottom: 6 }}>
              <SectionHeader title={`${g.emoji} ${g.nome} · ${g.docs.length}`} actionLabel="+ novo" onAction={() => abrirNovo(g.id)} style={{ marginTop: 14 }} />
              <div className="ui-card ui-list" style={{ padding: '2px 10px' }}>
                {g.docs.map((d) => (
                  <Doc key={d.id} d={d} meu={meu} aberto={aberto === d.id} onAbrirFechar={(id) => setAberto(aberto === id ? null : id)} onEditar={abrirEdicao} onApagar={apagar} abrindo={abrindo} onAbrirArquivo={abrir} onApagarArquivo={apagarArquivo} />
                ))}
              </div>
            </div>
          ))}

          {lista.length > 0 && filtro !== 'todos' && grupos.length === 0 && (
            <EmptyState compacto icone="📁" titulo="Nada nesse tipo ainda." cta="+ Adicionar aqui" onCta={() => abrirNovo(filtro)} />
          )}

          <p className="ui-caption ui-faint" style={{ marginTop: 16, padding: '0 4px', lineHeight: 1.45 }}>
            Os arquivos ficam num cofre privado: só quem está na viagem abre. Marcou "🔒 Só eu", ninguém mais vê. Dica: baixa os mais importantes no celular antes de embarcar — no avião não tem internet.
          </p>
        </Reveal>
      )}
    </div>
  );
}

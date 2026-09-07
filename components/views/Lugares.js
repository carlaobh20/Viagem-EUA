'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { PageHeader, Button, Field, EmptyState, Segmented, Reveal, Expand } from '../ui';

const ABAS = [['obrigatorio', 'Obrigatório'], ['sugerido', 'Sugerido']];

// Categorias: o emoji já diferencia — sem cor por categoria (paleta do app só).
const CATEGORIAS = [
  { id: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { id: 'parque', label: 'Parque', emoji: '🌳' },
  { id: 'turismo', label: 'Turismo', emoji: '🗽' },
  { id: 'compras', label: 'Compras', emoji: '🛍️' },
  { id: 'diversao', label: 'Diversão', emoji: '🎢' },
  { id: 'outro', label: 'Outro', emoji: '📍' },
];
const catDe = (id) => CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[5];

// ação secundária em texto com alvo de 44px
const acaoTxt = { background: 'none', border: 'none', minHeight: 44, padding: '0 6px', fontSize: 13.5, fontWeight: 700, color: 'var(--ui-teal-ink)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4 };

export default function Lugares({ ir }) {
  const { viagem, lugares, adicionarLugar, editarLugar, removerLugar, lugarParaRoteiro } = useData();
  const [aba, setAba] = useState('obrigatorio');
  const [addForm, setAddForm] = useState(null); // { nome, endereco, comentario, categoria }
  const [rotForm, setRotForm] = useState(null); // { id, data, hora }
  const [comentEdit, setComentEdit] = useState(null); // { id, txt }
  const [catFiltro, setCatFiltro] = useState('todos');
  const [addErro, setAddErro] = useState('');

  const todos = lugares || [];
  const nObrig = todos.filter((l) => (l.prioridade || 'sugerido') === 'obrigatorio').length;
  const nSug = todos.length - nObrig;
  const lista = todos.filter((l) => (l.prioridade || 'sugerido') === aba && (catFiltro === 'todos' || (l.categoria || 'outro') === catFiltro));
  const nomeAba = aba === 'obrigatorio' ? 'Obrigatório' : 'Sugerido';

  function abrirAdd() { setAddErro(''); setAddForm({ nome: '', endereco: '', comentario: '', categoria: catFiltro !== 'todos' ? catFiltro : 'restaurante' }); }
  function salvarAdd() {
    if (!addForm) return;
    if (!addForm.nome.trim()) { setAddErro('Dê um nome pro lugar.'); return; }
    adicionarLugar({ nome: addForm.nome, endereco: addForm.endereco, comentario: addForm.comentario, prioridade: aba, categoria: addForm.categoria || 'outro' });
    setAddForm(null);
  }
  function salvarRoteiro() {
    const l = lugares.find((x) => x.id === rotForm.id);
    if (l) lugarParaRoteiro(l, rotForm.data || null, rotForm.hora || null);
    setRotForm(null);
  }
  function salvarComent() {
    editarLugar(comentEdit.id, { comentario: comentEdit.txt.trim() || null });
    setComentEdit(null);
  }

  const subtitulo = todos.length === 0
    ? 'Sua lista de desejos da viagem'
    : `${nObrig} ${nObrig === 1 ? 'obrigatório' : 'obrigatórios'} · ${nSug} ${nSug === 1 ? 'sugerido' : 'sugeridos'}`;

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="Lugares para ir"
        subtitulo={subtitulo}
        onVoltar={() => ir('menu')}
        acao={!addForm ? <Button variant="soft" size="sm" onClick={abrirAdd} style={{ minHeight: 40 }}>+ Lugar</Button> : null}
      />

      {/* Obrigatório / Sugerido */}
      <Segmented
        opcoes={ABAS.map(([id, lbl]) => ({ id, label: `${lbl}${(id === 'obrigatorio' ? nObrig : nSug) > 0 ? ` · ${id === 'obrigatorio' ? nObrig : nSug}` : ''}` }))}
        valor={aba}
        onChange={setAba}
        style={{ marginBottom: 12 }}
      />

      {/* filtro por categoria (chips roláveis) */}
      <div className="ui-chips-scroll" style={{ marginBottom: 10 }}>
        {[{ id: 'todos', label: 'Todos', emoji: '' }, ...CATEGORIAS].map((c) => (
          <button key={c.id} onClick={() => setCatFiltro(c.id)} className={`ui-chipbtn${catFiltro === c.id ? ' on' : ''}`} aria-pressed={catFiltro === c.id}>{c.emoji ? c.emoji + ' ' : ''}{c.label}</button>
        ))}
      </div>

      {/* formulário de novo lugar (abre no topo, perto do botão que chamou) */}
      <Expand aberto={Boolean(addForm)}>
        {addForm && (
          <div className="ui-card" style={{ padding: 16, marginBottom: 14 }}>
            <div className="ui-h2" style={{ marginBottom: 14 }}>Novo lugar em {nomeAba}</div>
            <Field label="Nome"><input className="ui-input" autoFocus value={addForm.nome} onChange={(e) => setAddForm({ ...addForm, nome: e.target.value })} placeholder="Ex.: Universal Studios" /></Field>
            <Field label="Categoria">
              <div className="chips" style={{ gap: 8 }}>
                {CATEGORIAS.map((c) => {
                  const on = (addForm.categoria || 'outro') === c.id;
                  return <button key={c.id} type="button" onClick={() => setAddForm({ ...addForm, categoria: c.id })} className={`chip${on ? ' on' : ''}`} aria-pressed={on}>{c.emoji} {c.label}</button>;
                })}
              </div>
            </Field>
            <Field label="Endereço" opcional><input className="ui-input" value={addForm.endereco} onChange={(e) => setAddForm({ ...addForm, endereco: e.target.value })} placeholder="Rua, número e cidade" /></Field>
            <Field label="Comentário" opcional><textarea className="ui-input" value={addForm.comentario} onChange={(e) => setAddForm({ ...addForm, comentario: e.target.value })} placeholder="O que fazer aqui, links, horários…" /></Field>
            {addErro && <div className="ui-error">{addErro}</div>}
            <Button size="lg" full onClick={salvarAdd}>Adicionar em {nomeAba}</Button>
            <Button variant="ghost" full style={{ marginTop: 6 }} onClick={() => setAddForm(null)}>Cancelar</Button>
          </div>
        )}
      </Expand>

      {/* vazio */}
      {lista.length === 0 && !addForm && (
        catFiltro !== 'todos' ? (
          <EmptyState icone={catDe(catFiltro).emoji} titulo={`Nada em ${catDe(catFiltro).label.toLowerCase()} ainda.`} texto="Limpe o filtro ou adicione um lugar nessa categoria." cta="Adicionar lugar" onCta={abrirAdd} secundario={<button onClick={() => setCatFiltro('todos')} style={acaoTxt}>ver todos</button>} />
        ) : (
          <EmptyState icone={aba === 'obrigatorio' ? '⭐' : '💡'} titulo={aba === 'obrigatorio' ? 'Nenhum lugar obrigatório ainda.' : 'Nenhuma sugestão ainda.'} texto={aba === 'obrigatorio' ? 'Anote aqui o que a família não pode perder de jeito nenhum.' : 'Ideias de lugares pra encaixar se der tempo.'} cta="Adicionar lugar" onCta={abrirAdd} />
        )
      )}

      {/* lista: um card por prioridade, itens separados por linha fina */}
      {lista.length > 0 && (
        <Reveal>
          <div className="ui-card" style={{ padding: '2px 16px' }}>
            <div className="ui-list">
              {lista.map((l) => {
                const cat = catDe(l.categoria);
                const editandoComent = comentEdit && comentEdit.id === l.id;
                const abrindoRoteiro = rotForm && rotForm.id === l.id;
                return (
                  <div key={l.id} style={{ padding: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--ui-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: '0 0 auto' }}>{cat.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ui-wrap" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{l.nome}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          <span className="ui-pill ui-pill-neutral">{cat.label}</span>
                          {l.no_roteiro && <span className="ui-pill ui-pill-success">✓ no roteiro</span>}
                        </div>
                        {l.endereco && <div className="ui-caption ui-wrap" style={{ marginTop: 5 }}>📍 {l.endereco}</div>}
                      </div>
                      <button onClick={() => { if (window.confirm('Remover este lugar?')) removerLugar(l.id); }} aria-label="Remover lugar" className="ui-iconbtn" style={{ width: 40, height: 40, background: 'transparent', color: 'var(--ui-faint)', fontSize: 15, marginRight: -8 }}>✕</button>
                    </div>

                    {/* comentário / o que fazer aqui */}
                    {editandoComent ? (
                      <div style={{ marginTop: 10 }}>
                        <textarea className="ui-input" autoFocus value={comentEdit.txt} onChange={(e) => setComentEdit({ ...comentEdit, txt: e.target.value })} placeholder="O que tem pra fazer aqui? Links, dicas, horários…" />
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <Button size="sm" onClick={salvarComent} style={{ minHeight: 40 }}>Salvar comentário</Button>
                          <Button variant="ghost" size="sm" onClick={() => setComentEdit(null)} style={{ minHeight: 40 }}>Cancelar</Button>
                        </div>
                      </div>
                    ) : l.comentario ? (
                      <button onClick={() => setComentEdit({ id: l.id, txt: l.comentario })} className="ui-sunken ui-wrap" style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 10, border: 'none', padding: '9px 12px', fontSize: 13.5, lineHeight: 1.45, color: 'var(--ui-ink)', whiteSpace: 'pre-wrap' }}>
                        <span className="ui-label" style={{ margin: '0 0 3px' }}>O que fazer aqui · toque pra editar</span>{l.comentario}
                      </button>
                    ) : null}

                    {/* mandar pro roteiro */}
                    <Expand aberto={Boolean(abrindoRoteiro)}>
                      {abrindoRoteiro && (
                        <div className="ui-sunken" style={{ marginTop: 10, padding: 12 }}>
                          <div className="ui-label" style={{ margin: '0 2px 8px' }}>Que dia e horário você vai?</div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <input className="ui-input" type="date" value={rotForm.data} onChange={(e) => setRotForm({ ...rotForm, data: e.target.value })} style={{ flex: 1, minWidth: 0 }} />
                            <input className="ui-input" type="time" value={rotForm.hora} onChange={(e) => setRotForm({ ...rotForm, hora: e.target.value })} style={{ flex: '0 0 auto', width: 118 }} />
                          </div>
                          <Button full onClick={salvarRoteiro}>Adicionar ao roteiro</Button>
                          <Button variant="ghost" full size="sm" style={{ marginTop: 4, minHeight: 40 }} onClick={() => setRotForm(null)}>Cancelar</Button>
                        </div>
                      )}
                    </Expand>

                    {!abrindoRoteiro && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                          <Button variant={l.no_roteiro ? 'secondary' : 'soft'} onClick={() => setRotForm({ id: l.id, data: (viagem && viagem.data_ida) || '', hora: '' })} style={{ flex: 1, minWidth: 0 }}>📅 {l.no_roteiro ? 'Adicionar de novo' : 'Adicionar ao roteiro'}</Button>
                          {!l.comentario && !editandoComent && <button onClick={() => setComentEdit({ id: l.id, txt: '' })} style={acaoTxt}>+ comentário</button>}
                        </div>
                        <button onClick={() => ir('frases', l.categoria)} style={{ ...acaoTxt, padding: 0, minHeight: 40, fontSize: 12.5, fontWeight: 600, color: 'var(--ui-muted)' }}>💬 Frases em inglês pra {cat.label.toLowerCase()}</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {lista.length > 0 && !addForm && (
        <Button variant="secondary" full style={{ marginTop: 12 }} onClick={abrirAdd}>+ Adicionar lugar em {nomeAba}</Button>
      )}
    </div>
  );
}

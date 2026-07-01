'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

const ABAS = [['obrigatorio', 'Obrigatório'], ['sugerido', 'Sugerido']];

const CATEGORIAS = [
  { id: 'restaurante', label: 'Restaurante', emoji: '🍽️', cor: '#C2410C', bg: 'rgba(234,88,12,.12)' },
  { id: 'parque', label: 'Parque', emoji: '🌳', cor: '#15803D', bg: 'rgba(22,163,74,.12)' },
  { id: 'turismo', label: 'Turismo', emoji: '🗽', cor: '#1D4ED8', bg: 'rgba(37,99,235,.12)' },
  { id: 'compras', label: 'Compras', emoji: '🛍️', cor: '#7C3AED', bg: 'rgba(124,58,237,.12)' },
  { id: 'diversao', label: 'Diversão', emoji: '🎢', cor: '#BE185D', bg: 'rgba(219,39,119,.12)' },
  { id: 'outro', label: 'Outro', emoji: '📍', cor: '#57534E', bg: 'rgba(87,83,78,.12)' },
];
const catDe = (id) => CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[5];

export default function Lugares({ ir }) {
  const { viagem, lugares, adicionarLugar, editarLugar, removerLugar, lugarParaRoteiro } = useData();
  const [aba, setAba] = useState('obrigatorio');
  const [addForm, setAddForm] = useState(null); // { nome, endereco, comentario }
  const [rotForm, setRotForm] = useState(null); // { id, data, hora }
  const [comentEdit, setComentEdit] = useState(null); // { id, txt }
  const [catFiltro, setCatFiltro] = useState('todos');

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, background: 'var(--ui-bg)', color: 'var(--ui-ink)' };
  const lista = (lugares || []).filter((l) => (l.prioridade || 'sugerido') === aba && (catFiltro === 'todos' || (l.categoria || 'outro') === catFiltro));

  function salvarAdd() {
    if (!addForm || !addForm.nome.trim()) { setAddForm(null); return; }
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

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('menu')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Lugares para Ir</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Sua lista de desejos da viagem</div>
        </div>
      </div>

      {/* abas Obrigatório / Sugerido */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {ABAS.map(([id, lbl]) => (
          <button key={id} onClick={() => setAba(id)} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '10px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: aba === id ? 'var(--ui-teal)' : 'var(--ui-card)', color: aba === id ? '#fff' : 'var(--ui-muted)', boxShadow: aba === id ? 'none' : 'var(--ui-shadow)' }}>{lbl}</button>
        ))}
      </div>

      {/* filtros por categoria */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
        {[{ id: 'todos', label: 'Todos', emoji: '' }, ...CATEGORIAS].map((c) => {
          const on = catFiltro === c.id;
          return (
            <button key={c.id} onClick={() => setCatFiltro(c.id)} style={{ flex: '0 0 auto', border: 'none', borderRadius: 20, padding: '7px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: on ? (c.cor || 'var(--ui-teal)') : 'var(--ui-card)', color: on ? '#fff' : 'var(--ui-muted)', boxShadow: on ? 'none' : 'var(--ui-shadow)' }}>{c.emoji ? c.emoji + ' ' : ''}{c.label}</button>
          );
        })}
      </div>

      {/* lista */}
      {lista.length === 0 && (
        <div style={{ ...card, padding: 24, textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, marginBottom: 14 }}>
          Nenhum lugar {catFiltro !== 'todos' ? 'nessa categoria' : (aba === 'obrigatorio' ? 'obrigatório' : 'sugerido')} ainda. Adicione um abaixo.
        </div>
      )}

      {lista.map((l) => (
        <div key={l.id} style={{ ...card, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18, marginTop: 1 }}>{catDe(l.categoria).emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>{l.nome}</div>
              <div style={{ marginTop: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: catDe(l.categoria).cor, background: catDe(l.categoria).bg, padding: '2px 8px', borderRadius: 20 }}>{catDe(l.categoria).label}</span>
              </div>
              {l.endereco && <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 4 }}>{l.endereco}</div>}
            </div>
            {l.no_roteiro && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ui-teal)', background: 'rgba(0,199,177,.14)', padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', flex: '0 0 auto' }}>✓ no roteiro</span>}
            <button onClick={() => { if (window.confirm('Remover este lugar?')) removerLugar(l.id); }} aria-label="Remover" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 15, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
          </div>

          {/* comentário / o que fazer */}
          {comentEdit && comentEdit.id === l.id ? (
            <div style={{ marginTop: 12 }}>
              <textarea autoFocus value={comentEdit.txt} onChange={(e) => setComentEdit({ ...comentEdit, txt: e.target.value })} placeholder="O que tem pra fazer aqui? Links, dicas, horários…" style={{ ...inp, height: 70, resize: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={salvarComent} style={{ flex: 1, border: 'none', borderRadius: 11, padding: 10, background: 'var(--ui-teal)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Salvar comentário</button>
                <button onClick={() => setComentEdit(null)} style={{ border: '1px solid var(--ui-line)', borderRadius: 11, padding: '10px 14px', background: 'var(--ui-card)', color: 'var(--ui-muted)', fontSize: 13.5, cursor: 'pointer' }}>cancelar</button>
              </div>
            </div>
          ) : l.comentario ? (
            <div onClick={() => setComentEdit({ id: l.id, txt: l.comentario })} style={{ marginTop: 10, padding: '10px 12px', background: 'var(--ui-bg)', borderRadius: 12, fontSize: 13, color: 'var(--ui-ink)', cursor: 'text', whiteSpace: 'pre-wrap' }}>
              <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ui-faint)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700, marginBottom: 3 }}>Comentário</span>{l.comentario}
            </div>
          ) : (
            <button onClick={() => setComentEdit({ id: l.id, txt: '' })} style={{ marginTop: 8, border: 'none', background: 'none', color: 'var(--ui-teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>+ comentário (o que fazer aqui)</button>
          )}

          {/* adicionar ao roteiro */}
          {rotForm && rotForm.id === l.id ? (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--ui-bg)', borderRadius: 13 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginBottom: 8 }}>Que dia e horário você vai?</div>
              <input type="date" value={rotForm.data} onChange={(e) => setRotForm({ ...rotForm, data: e.target.value })} style={{ ...inp, marginBottom: 8, background: 'var(--ui-card)' }} />
              <input type="time" value={rotForm.hora} onChange={(e) => setRotForm({ ...rotForm, hora: e.target.value })} style={{ ...inp, marginBottom: 10, background: 'var(--ui-card)' }} />
              <button onClick={salvarRoteiro} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 11, background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar ao roteiro</button>
              <button onClick={() => setRotForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 12.5, marginTop: 6, cursor: 'pointer' }}>fechar</button>
            </div>
          ) : (
            <button onClick={() => setRotForm({ id: l.id, data: (viagem && viagem.data_ida) || '', hora: '' })} style={{ marginTop: 12, width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 12, padding: 11, background: 'transparent', color: 'var(--ui-teal)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>📅 Adicionar ao roteiro</button>
          )}
          <button onClick={() => ir('frases', l.categoria)} style={{ marginTop: 8, width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 4 }}>💬 Frases em inglês pra {catDe(l.categoria).label.toLowerCase()}</button>
        </div>
      ))}

      {/* adicionar lugar */}
      {addForm ? (
        <div style={{ ...card, padding: 16, marginTop: 4 }}>
          <input autoFocus value={addForm.nome} onChange={(e) => setAddForm({ ...addForm, nome: e.target.value })} placeholder="Nome do lugar" style={{ ...inp, marginBottom: 9 }} />
          <input value={addForm.endereco} onChange={(e) => setAddForm({ ...addForm, endereco: e.target.value })} placeholder="Endereço" style={{ ...inp, marginBottom: 9 }} />
          <textarea value={addForm.comentario} onChange={(e) => setAddForm({ ...addForm, comentario: e.target.value })} placeholder="Comentário — o que fazer aqui (opcional)" style={{ ...inp, height: 64, resize: 'none', marginBottom: 12 }} />
          <div style={{ fontSize: 12, color: 'var(--ui-muted)', fontWeight: 600, marginBottom: 7 }}>Categoria</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {CATEGORIAS.map((c) => {
              const on = (addForm.categoria || 'outro') === c.id;
              return <button key={c.id} onClick={() => setAddForm({ ...addForm, categoria: c.id })} style={{ border: on ? 'none' : '1px solid var(--ui-line)', borderRadius: 20, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: on ? c.cor : 'var(--ui-card)', color: on ? '#fff' : 'var(--ui-muted)' }}>{c.emoji} {c.label}</button>;
            })}
          </div>
          <button onClick={salvarAdd} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar em {aba === 'obrigatorio' ? 'Obrigatório' : 'Sugerido'}</button>
          <button onClick={() => setAddForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, marginTop: 6, cursor: 'pointer' }}>fechar</button>
        </div>
      ) : (
        <button onClick={() => setAddForm({ nome: '', endereco: '', comentario: '', categoria: 'restaurante' })} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: 14, background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>+ Adicionar lugar</button>
      )}
    </div>
  );
}

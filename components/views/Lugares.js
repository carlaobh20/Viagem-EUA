'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

const ABAS = [['obrigatorio', 'Obrigatório'], ['sugerido', 'Sugerido']];

export default function Lugares({ ir }) {
  const { viagem, lugares, adicionarLugar, editarLugar, removerLugar, lugarParaRoteiro } = useData();
  const [aba, setAba] = useState('obrigatorio');
  const [addForm, setAddForm] = useState(null); // { nome, endereco, comentario }
  const [rotForm, setRotForm] = useState(null); // { id, data, hora }
  const [comentEdit, setComentEdit] = useState(null); // { id, txt }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, background: 'var(--ui-bg)', color: 'var(--ui-ink)' };
  const lista = (lugares || []).filter((l) => (l.prioridade || 'sugerido') === aba);

  function salvarAdd() {
    if (!addForm || !addForm.nome.trim()) { setAddForm(null); return; }
    adicionarLugar({ nome: addForm.nome, endereco: addForm.endereco, comentario: addForm.comentario, prioridade: aba });
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

      {/* lista */}
      {lista.length === 0 && (
        <div style={{ ...card, padding: 24, textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, marginBottom: 14 }}>
          Nenhum lugar {aba === 'obrigatorio' ? 'obrigatório' : 'sugerido'} ainda. Adicione um abaixo.
        </div>
      )}

      {lista.map((l) => (
        <div key={l.id} style={{ ...card, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18, marginTop: 1 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>{l.nome}</div>
              {l.endereco && <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 2 }}>{l.endereco}</div>}
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
        </div>
      ))}

      {/* adicionar lugar */}
      {addForm ? (
        <div style={{ ...card, padding: 16, marginTop: 4 }}>
          <input autoFocus value={addForm.nome} onChange={(e) => setAddForm({ ...addForm, nome: e.target.value })} placeholder="Nome do lugar" style={{ ...inp, marginBottom: 9 }} />
          <input value={addForm.endereco} onChange={(e) => setAddForm({ ...addForm, endereco: e.target.value })} placeholder="Endereço" style={{ ...inp, marginBottom: 9 }} />
          <textarea value={addForm.comentario} onChange={(e) => setAddForm({ ...addForm, comentario: e.target.value })} placeholder="Comentário — o que fazer aqui (opcional)" style={{ ...inp, height: 64, resize: 'none', marginBottom: 10 }} />
          <button onClick={salvarAdd} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar em {aba === 'obrigatorio' ? 'Obrigatório' : 'Sugerido'}</button>
          <button onClick={() => setAddForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, marginTop: 6, cursor: 'pointer' }}>fechar</button>
        </div>
      ) : (
        <button onClick={() => setAddForm({ nome: '', endereco: '', comentario: '' })} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: 14, background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>+ Adicionar lugar</button>
      )}
    </div>
  );
}

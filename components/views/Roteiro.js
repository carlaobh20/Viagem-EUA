'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL } from '../../lib/format';

const TIPOS = [
  { id: 'voo', nome: 'Voo', cor: '#185FA5' },
  { id: 'hospedagem', nome: 'Hospedagem', cor: '#BA7517' },
  { id: 'passeio', nome: 'Passeio', cor: '#1D9E75' },
  { id: 'comida', nome: 'Comida', cor: '#D4537E' },
  { id: 'museu', nome: 'Atração / Museu', cor: '#534AB7' },
  { id: 'transporte', nome: 'Transporte', cor: '#0F6E56' },
  { id: 'outro', nome: 'Outro', cor: '#5F5E5A' },
];
const STATUS = ['Confirmado', 'Reserva', 'A definir'];
const corTipo = (t) => (TIPOS.find((x) => x.id === t) || TIPOS[6]).cor;
const nomeTipo = (t) => (TIPOS.find((x) => x.id === t) || TIPOS[6]).nome;
const hoje = () => new Date().toISOString().slice(0, 10);

function StatusBadge({ st }) {
  if (!st) return null;
  const m = { Confirmado: ['#E1F5EE', '#0F6E56'], Reserva: ['#FAEEDA', '#854F0B'], 'A definir': ['#F1EFE8', '#5F5E5A'] };
  const c = m[st] || ['#F1EFE8', '#5F5E5A'];
  return <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 6, background: c[0], color: c[1], whiteSpace: 'nowrap' }}>{st}</span>;
}

function fmtDiaData(d) {
  if (!d) return 'Sem data';
  const dt = new Date(d + 'T00:00:00');
  const wd = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dt.getDay()];
  const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][dt.getMonth()];
  return `${wd}, ${String(dt.getDate()).padStart(2, '0')} ${m}`;
}

export default function Roteiro({ ir }) {
  const { viagem, pontos, gastos, recarregar } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [form, setForm] = useState(null);
  const [notaEdit, setNotaEdit] = useState(null);
  const [notaTxt, setNotaTxt] = useState('');

  const gastoDoPonto = (id) => gastos.filter((g) => g.ponto_id === id).reduce((s, g) => s + valorEmBRL(g, cambio), 0);

  const ordenados = [...pontos].sort((a, b) => {
    const da = a.data_inicio || '9999-12-31', db = b.data_inicio || '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    return (a.ordem || 0) - (b.ordem || 0);
  });
  const grupos = [];
  ordenados.forEach((p) => {
    const key = p.data_inicio || 'sem-data';
    let g = grupos.find((x) => x.key === key);
    if (!g) { g = { key, data: p.data_inicio || '', stops: [] }; grupos.push(g); }
    g.stops.push(p);
  });
  const ultimaData = () => (grupos.length ? grupos[grupos.length - 1].data : '') || hoje();

  function abrirNovo(dataPadrao, inserirApos) {
    setForm({ id: null, nome: '', data: dataPadrao || ultimaData(), hora: '', tipo: 'passeio', status: '', nota: '', inserirApos: inserirApos || null });
  }
  function abrirEdicao(p) {
    setForm({ id: p.id, nome: p.nome, data: p.data_inicio || '', hora: p.hora || '', tipo: p.tipo || 'outro', status: p.status || '', nota: p.nota || '', inserirApos: null });
  }

  async function salvarForm() {
    const f = form;
    if (!f.nome.trim()) { window.alert('Dê um nome para a parada.'); return; }
    const campos = { nome: f.nome.trim(), data_inicio: f.data || null, hora: f.hora || null, tipo: f.tipo, status: f.status || null, nota: f.nota.trim() || null };
    if (f.id) {
      await supabase.from('pontos_roteiro').update(campos).eq('id', f.id);
    } else {
      const doDia = ordenados.filter((p) => (p.data_inicio || '') === (f.data || ''));
      const maxOrdem = doDia.reduce((m, p) => Math.max(m, p.ordem || 0), -1);
      const { data: novo } = await supabase.from('pontos_roteiro').insert({ viagem_id: viagem.id, ...campos, ordem: maxOrdem + 1 }).select().single();
      if (f.inserirApos && novo) {
        const semNovo = doDia.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        const idx = semNovo.findIndex((s) => s.id === f.inserirApos);
        semNovo.splice(idx + 1, 0, novo);
        await Promise.all(semNovo.map((s, i) => supabase.from('pontos_roteiro').update({ ordem: i }).eq('id', s.id)));
      }
    }
    await recarregar();
    setForm(null);
  }

  async function excluir(p) {
    const ligados = gastos.filter((g) => g.ponto_id === p.id).length;
    const aviso = ligados > 0 ? `\n\n${ligados} gasto(s) estão nessa parada. Eles não serão apagados, só deixam de ficar ligados a ela.` : '';
    if (!window.confirm(`Excluir "${p.nome}"?` + aviso)) return;
    await supabase.from('pontos_roteiro').delete().eq('id', p.id);
    await recarregar();
  }

  async function mover(grupo, i, dir) {
    const arr = grupo.stops.slice();
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    await Promise.all(arr.map((s, idx) => supabase.from('pontos_roteiro').update({ ordem: idx }).eq('id', s.id)));
    await recarregar();
  }

  function abrirNota(p) { setNotaEdit(p.id); setNotaTxt(p.nota || ''); }
  async function salvarNota(p) { await supabase.from('pontos_roteiro').update({ nota: notaTxt.trim() || null }).eq('id', p.id); setNotaEdit(null); await recarregar(); }

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back"><button onClick={() => ir('resumo')} aria-label="Voltar">←</button><span className="ttl">Roteiro</span></div>

        {form ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{form.id ? 'Editar parada' : 'Nova parada'}</div>
            <div className="field"><label>Nome</label><input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Magic Kingdom" /></div>
            <div className="field"><label>Dia (data)</label><input className="input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            <div className="field"><label>Horário</label><input className="input" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
            <div className="field"><label>Tipo</label><select className="select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
            <div className="field"><label>Status</label><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="">—</option>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="field"><label>Comentário (opcional)</label><textarea className="input" style={{ height: 64, padding: 8 }} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Anotações, links, lembretes…" /></div>
            <button className="btn-primary" onClick={salvarForm}>{form.id ? 'Salvar alterações' : 'Adicionar parada'}</button>
            <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setForm(null)}>Cancelar</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Toda a viagem dia a dia, com horários, tipo e status de cada parada.</p>
            {grupos.length === 0 && <div className="card"><div className="empty">Nenhuma parada ainda. Toque em “Adicionar parada”.</div></div>}
            {grupos.map((g, gi) => (
              <div key={g.key}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '18px 0 10px' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{g.data ? `Dia ${gi + 1}` : 'Sem data'}</span>
                  <span style={{ fontSize: 12, color: 'var(--faint)' }}>{fmtDiaData(g.data)}</span>
                </div>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 6, top: 6, bottom: 8, width: 2, background: 'var(--line-strong)' }} />
                  {g.stops.map((p, i) => (
                    <div key={p.id} style={{ position: 'relative', marginBottom: 16 }}>
                      <div style={{ position: 'absolute', left: -24, top: 4, width: 14, height: 14, borderRadius: '50%', background: corTipo(p.tipo), border: '3px solid var(--bg)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{p.nome}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}><StatusBadge st={p.status} />{p.hora && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.hora}</span>}</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{nomeTipo(p.tipo)}{gastoDoPonto(p.id) > 0 ? ` · gasto ${fmtBRL(gastoDoPonto(p.id))}` : ''}</div>

                      {notaEdit === p.id ? (
                        <div style={{ marginTop: 6 }}>
                          <textarea className="input" style={{ height: 60, padding: 8 }} value={notaTxt} onChange={(e) => setNotaTxt(e.target.value)} placeholder="Escreva um comentário…" />
                          <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                            <button className="btn-ghost" style={{ padding: 0, fontSize: 13 }} onClick={() => salvarNota(p)}>Salvar comentário</button>
                            <button className="btn-ghost" style={{ padding: 0, fontSize: 13, color: 'var(--faint)' }} onClick={() => setNotaEdit(null)}>Cancelar</button>
                          </div>
                        </div>
                      ) : p.nota ? (
                        <div onClick={() => abrirNota(p)} style={{ marginTop: 6, background: 'var(--bg)', border: '0.5px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
                          <span style={{ color: 'var(--faint)', fontSize: 11, display: 'block', marginBottom: 2 }}>comentário (toque para editar)</span>{p.nota}
                        </div>
                      ) : null}

                      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                        <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 13 }} onClick={() => abrirEdicao(p)}>Editar</button>
                        {!p.nota && notaEdit !== p.id && <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 13 }} onClick={() => abrirNota(p)}>+ comentário</button>}
                        <button aria-label="Subir" className="btn-ghost" style={{ padding: '2px 6px', fontSize: 15 }} onClick={() => mover(g, i, -1)}>↑</button>
                        <button aria-label="Descer" className="btn-ghost" style={{ padding: '2px 6px', fontSize: 15 }} onClick={() => mover(g, i, 1)}>↓</button>
                        <span style={{ flex: 1 }} />
                        <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 13, color: 'var(--debit)' }} onClick={() => excluir(p)}>Excluir</button>
                      </div>

                      <div onClick={() => abrirNovo(g.data, p.id)} style={{ fontSize: 11, color: 'var(--brand)', cursor: 'pointer', marginTop: 8 }}>+ inserir parada aqui</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-outline" style={{ marginTop: 8 }} onClick={() => abrirNovo(ultimaData(), null)}>+ Adicionar parada</button>
          </>
        )}
      </div>
    </div>
  );
}

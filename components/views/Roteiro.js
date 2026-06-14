'use client';
import { useState, useEffect } from 'react';
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
const CORES_DIA = ['#0F6E56', '#185FA5', '#534AB7', '#BA7517', '#1D9E75', '#D4537E', '#993C1D'];
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
function diffDias(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
function fmtDur(min) { if (min < 60) return `${min} min`; const h = Math.floor(min / 60); const m = min % 60; return m ? `${h} h ${m} min` : `${h} h`; }

export default function Roteiro({ ir }) {
  const { viagem, pontos, gastos, recarregar } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [form, setForm] = useState(null);
  const [notaEdit, setNotaEdit] = useState(null);
  const [notaTxt, setNotaTxt] = useState('');
  const [editDatas, setEditDatas] = useState(false);
  const [dIda, setDIda] = useState('');
  const [dVolta, setDVolta] = useState('');
  const [rotas, setRotas] = useState({});
  const [geoMsg, setGeoMsg] = useState('');

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
    setGeoMsg(''); setForm({ id: null, nome: '', data: dataPadrao || ultimaData(), hora: '', tipo: 'passeio', status: '', nota: '', local: '', lat: null, lng: null, inserirApos: inserirApos || null });
  }
  function abrirEdicao(p) {
    setGeoMsg(p.lat != null ? '📍 local salvo' : ''); setForm({ id: p.id, nome: p.nome, data: p.data_inicio || '', hora: p.hora || '', tipo: p.tipo || 'outro', status: p.status || '', nota: p.nota || '', local: p.local || '', lat: p.lat ?? null, lng: p.lng ?? null, inserirApos: null });
  }

  async function salvarForm() {
    const f = form;
    if (!f.nome.trim()) { window.alert('Dê um nome para a parada.'); return; }
    const campos = { nome: f.nome.trim(), data_inicio: f.data || null, hora: f.hora || null, tipo: f.tipo, status: f.status || null, nota: f.nota.trim() || null, local: f.local ? f.local.trim() : null, lat: f.lat ?? null, lng: f.lng ?? null };
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

  function abrirDatas() { setDIda(viagem.data_ida || ''); setDVolta(viagem.data_volta || ''); setEditDatas(true); }
  async function salvarDatas() {
    if (dIda && dVolta && dVolta < dIda) { window.alert('A volta não pode ser antes da ida.'); return; }
    await supabase.from('viagens').update({ data_ida: dIda || null, data_volta: dVolta || null }).eq('id', viagem.id);
    setEditDatas(false);
    await recarregar();
  }

  async function buscarLocal() {
    const q = (form.local || '').trim();
    if (!q) { setGeoMsg('digite um local primeiro'); return; }
    setGeoMsg('buscando…');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
      const j = await r.json();
      if (j && j[0]) { setForm((f) => ({ ...f, lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) })); setGeoMsg('📍 local encontrado'); }
      else setGeoMsg('não encontrei esse local — tente ser mais específico');
    } catch (e) { setGeoMsg('erro ao buscar (sem internet?)'); }
  }

  useEffect(() => {
    const pares = [];
    for (let i = 0; i < ordenados.length - 1; i++) {
      const a = ordenados[i], b = ordenados[i + 1];
      if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        const key = `${a.id}_${b.id}`;
        if (!(key in rotas)) pares.push({ key, a, b });
      }
    }
    if (pares.length === 0) return;
    let cancel = false;
    (async () => {
      const novos = {};
      for (const pr of pares) {
        try {
          const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${pr.a.lng},${pr.a.lat};${pr.b.lng},${pr.b.lat}?overview=false`);
          const j = await r.json();
          if (j.routes && j.routes[0]) novos[pr.key] = { km: j.routes[0].distance / 1000, min: Math.round(j.routes[0].duration / 60) };
          else novos[pr.key] = 'erro';
        } catch (e) { novos[pr.key] = 'erro'; }
      }
      if (!cancel) setRotas((prev) => ({ ...prev, ...novos }));
    })();
    return () => { cancel = true; };
  }, [pontos]);

  const ida = viagem.data_ida, volta = viagem.data_volta;
  let prog = null;
  if (ida && volta) {
    const total = diffDias(ida, volta) + 1;
    const hojeS = hoje();
    if (hojeS < ida) prog = { estado: 'antes', faltam: diffDias(hojeS, ida), total };
    else if (hojeS > volta) prog = { estado: 'fim', total };
    else { const n = diffDias(ida, hojeS) + 1; prog = { estado: 'durante', n, total, faltam: diffDias(hojeS, volta), pct: Math.max(2, Math.min(100, Math.round((n / total) * 100))) }; }
  }

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back"><button onClick={() => ir('resumo')} aria-label="Voltar">←</button></div>

        {form ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{form.id ? 'Editar parada' : 'Nova parada'}</div>
            <div className="field"><label>Nome</label><input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Magic Kingdom" /></div>
            <div className="field"><label>Dia (data)</label><input className="input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            <div className="field"><label>Horário</label><input className="input" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
            <div className="field"><label>Tipo</label><select className="select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
            <div className="field"><label>Status</label><select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="">—</option>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="field"><label>Comentário (opcional)</label><textarea className="input" style={{ height: 64, padding: 8 }} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Anotações, links, lembretes…" /></div>
            <div className="field"><label>Local (para distância/tempo — opcional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value, lat: null, lng: null })} placeholder="Ex.: Magic Kingdom, Orlando" style={{ flex: 1 }} />
                <button type="button" className="btn-outline" style={{ width: 100, height: 44 }} onClick={buscarLocal}>Buscar</button>
              </div>
              {geoMsg && <div style={{ fontSize: 11, color: form.lat != null ? 'var(--brand)' : 'var(--muted)', marginTop: 4 }}>{geoMsg}{form.lat != null ? ` (${form.lat.toFixed(3)}, ${form.lng.toFixed(3)})` : ''}</div>}
            </div>
            <button className="btn-primary" onClick={salvarForm}>{form.id ? 'Salvar alterações' : 'Adicionar parada'}</button>
            <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setForm(null)}>Cancelar</button>
          </div>
        ) : (
          <>
            {editDatas ? (
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Datas da viagem</div>
                <div className="field"><label>Ida</label><input className="input" type="date" value={dIda} onChange={(e) => setDIda(e.target.value)} /></div>
                <div className="field"><label>Volta</label><input className="input" type="date" value={dVolta} onChange={(e) => setDVolta(e.target.value)} /></div>
                <button className="btn-primary" onClick={salvarDatas}>Salvar datas</button>
                <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setEditDatas(false)}>Cancelar</button>
              </div>
            ) : !prog ? (
              <div className="card" style={{ marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Defina a ida e a volta para ver a contagem dos dias.</div>
                <button className="btn-outline" onClick={abrirDatas}>Definir datas da viagem</button>
              </div>
            ) : (
              <div style={{ marginTop: 2, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.5px' }}>
                    {prog.estado === 'antes' && `Faltam ${prog.faltam} ${prog.faltam === 1 ? 'dia' : 'dias'}`}
                    {prog.estado === 'durante' && `Dia ${prog.n} de ${prog.total}`}
                    {prog.estado === 'fim' && 'Viagem concluída ✅'}
                  </span>
                  <button onClick={abrirDatas} className="btn-ghost" style={{ padding: 0, fontSize: 12 }}>editar datas</button>
                </div>
                <div style={{ height: 9, borderRadius: 8, background: '#E7E4DB', overflow: 'hidden', margin: '12px 0 8px' }}>
                  <div style={{ width: (prog.estado === 'antes' ? 0 : prog.estado === 'fim' ? 100 : prog.pct) + '%', height: '100%', borderRadius: 8, background: 'var(--brand)' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {fmtDiaData(ida)} → {fmtDiaData(volta)} · {prog.total} dias
                  {prog.estado === 'durante' && ` · faltam ${prog.faltam} ${prog.faltam === 1 ? 'dia' : 'dias'}`}
                </div>
              </div>
            )}
            {grupos.length === 0 && <div className="card"><div className="empty">Nenhuma parada ainda. Toque em “Adicionar parada”.</div></div>}

            {grupos.map((g, gi) => {
              const cor = g.data ? CORES_DIA[gi % CORES_DIA.length] : '#5F5E5A';
              return (
                <div key={g.key} style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 18, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 12px rgba(27,42,47,0.06)' }}>
                  <div style={{ background: cor, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{g.data ? `Dia ${gi + 1}` : 'Sem data'} <span style={{ opacity: 0.85, fontWeight: 400 }}>· {fmtDiaData(g.data)}</span></span>
                    <span style={{ fontSize: 11, opacity: 0.85 }}>{g.stops.length} {g.stops.length === 1 ? 'parada' : 'paradas'}</span>
                  </div>
                  <div style={{ padding: '6px 14px 12px' }}>
                    {g.stops.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: i > 0 ? '0.5px solid var(--line)' : 'none', marginTop: i > 0 ? 12 : 0 }}>
                        <div style={{ width: 11, height: 11, borderRadius: '50%', background: corTipo(p.tipo), marginTop: 5, flex: '0 0 auto' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{p.nome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}><StatusBadge st={p.status} />{p.hora && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.hora}</span>}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{nomeTipo(p.tipo)}{gastoDoPonto(p.id) > 0 ? ` · gasto ${fmtBRL(gastoDoPonto(p.id))}` : ''}</div>
                          {(() => {
                            const gx = ordenados.findIndex((s) => s.id === p.id);
                            const nx = ordenados[gx + 1];
                            if (!nx || p.lat == null || p.lng == null || nx.lat == null || nx.lng == null) return null;
                            const rota = rotas[`${p.id}_${nx.id}`];
                            return (
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                                ↘ {rota === undefined ? 'calculando…' : rota === 'erro' ? 'distância indisponível' : `≈ ${rota.km.toFixed(0)} km · ${fmtDur(rota.min)} de carro até ${nx.nome}`}
                              </div>
                            );
                          })()}

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

                          <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 13 }} onClick={() => abrirEdicao(p)}>Editar</button>
                            {!p.nota && notaEdit !== p.id && <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 13 }} onClick={() => abrirNota(p)}>+ comentário</button>}
                            <button aria-label="Subir" className="btn-ghost" style={{ padding: '2px 6px', fontSize: 15 }} onClick={() => mover(g, i, -1)}>↑</button>
                            <button aria-label="Descer" className="btn-ghost" style={{ padding: '2px 6px', fontSize: 15 }} onClick={() => mover(g, i, 1)}>↓</button>
                            <span style={{ flex: 1 }} />
                            <button className="btn-ghost" style={{ padding: '2px 0', fontSize: 13, color: 'var(--debit)' }} onClick={() => excluir(p)}>Excluir</button>
                          </div>
                          <div onClick={() => abrirNovo(g.data, p.id)} style={{ fontSize: 11, color: 'var(--brand)', cursor: 'pointer', marginTop: 8 }}>+ inserir parada aqui</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <button className="btn-outline" style={{ marginTop: 2 }} onClick={() => abrirNovo(ultimaData(), null)}>+ Adicionar parada</button>
          </>
        )}
      </div>
    </div>
  );
}

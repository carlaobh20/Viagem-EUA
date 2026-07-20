'use client';
import { useState, useEffect, useRef } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL } from '../../lib/format';

function iconeClima(code) {
  if (code == null) return '🌥️';
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 95) return '⛈️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 51 && code <= 67) return '🌧️';
  return '🌥️';
}

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
function addDias(d, n) { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); }
function fmtDM(d) { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][dt.getMonth()]; return `${String(dt.getDate()).padStart(2, '0')} ${m}`; }

export default function Roteiro({ ir }) {
  const { viagem, pontos, gastos, perfis, checklist, recarregar } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [form, setForm] = useState(null);
  const [notaEdit, setNotaEdit] = useState(null);
  const [notaTxt, setNotaTxt] = useState('');
  const [editDatas, setEditDatas] = useState(false);
  const [dIda, setDIda] = useState('');
  const [dVolta, setDVolta] = useState('');
  const [rotas, setRotas] = useState({});
  const [geoMsg, setGeoMsg] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);

  const gastoDoDia = (p) => {
    if (!p.data_inicio) return 0;
    const mesmaData = pontos.filter((x) => x.data_inicio === p.data_inicio).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    if (!mesmaData[0] || mesmaData[0].id !== p.id) return 0;
    return gastos.filter((g) => g.data === p.data_inicio).reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  };

  const [clima, setClima] = useState({});
  const climaRef = useRef(new Set());
  useEffect(() => {
    const hoje = new Date(); const lim = new Date(); lim.setDate(hoje.getDate() + 16);
    const hojeISO = hoje.toISOString().slice(0, 10); const limISO = lim.toISOString().slice(0, 10);
    (pontos || []).forEach(async (p) => {
      if (p.lat == null || p.lng == null || !p.data_inicio) return;
      if (p.data_inicio < hojeISO || p.data_inicio > limISO) return;
      const key = p.id + ':' + p.data_inicio;
      if (climaRef.current.has(key)) return;
      climaRef.current.add(key);
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${p.data_inicio}&end_date=${p.data_inicio}`);
        const j = await r.json();
        const d = j && j.daily;
        if (d && d.time && d.time.length) {
          setClima((c) => ({ ...c, [p.id]: { code: d.weathercode[0], max: Math.round(d.temperature_2m_max[0]), min: Math.round(d.temperature_2m_min[0]), chuva: d.precipitation_probability_max ? d.precipitation_probability_max[0] : null } }));
        }
      } catch (e) { /* sem internet ou fora do alcance: ignora */ }
    });
  }, [pontos]);

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

  async function geocodar(termo) {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(termo)}`, { headers: { Accept: 'application/json' } });
    const j = await r.json();
    return j && j[0] ? { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) } : null;
  }

  async function buscarLocal() {
    const q = (form.local || '').trim();
    if (!q) { setGeoMsg('digite um local primeiro'); return; }
    setGeoMsg('buscando…');
    // monta variações: se a busca exata falhar, tenta a cidade e depois só o ponto
    const tentativas = [q];
    if (q.includes(',')) {
      const partes = q.split(',').map((s) => s.trim()).filter(Boolean);
      const cidade = partes[partes.length - 1];
      const ponto = partes[0];
      if (cidade && !tentativas.includes(cidade)) tentativas.push(cidade);
      if (ponto && !tentativas.includes(ponto)) tentativas.push(ponto);
    }
    try {
      for (let i = 0; i < tentativas.length; i++) {
        const termo = tentativas[i];
        const hit = await geocodar(termo);
        if (hit) {
          setForm((f) => ({ ...f, lat: hit.lat, lng: hit.lng }));
          setGeoMsg(i === 0 ? '📍 local encontrado' : `📍 achei por “${termo}”`);
          return;
        }
      }
      setGeoMsg('não encontrei — tente a cidade ou um ponto famoso (ex.: Walt Disney World)');
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

  // ----- Fatia 1: totais para os tiles e a barra de baixo -----
  const totaisRota = Object.values(rotas).reduce((acc, r) => {
    if (r && r !== 'erro' && typeof r === 'object') { acc.km += r.km || 0; acc.min += r.min || 0; }
    return acc;
  }, { km: 0, min: 0 });
  const fmtHHMM = (min) => { const h = Math.floor(min / 60); const m = Math.round(min % 60); return `${h}:${String(m).padStart(2, '0')}`; };
  const nParadas = pontos.length;
  const tarefasPend = (checklist || []).filter((i) => i.tema !== 'Mercado' && !i.feito).length;
  const nPessoas = (perfis || []).length;
  const tileFaltam = prog
    ? (prog.estado === 'antes' ? { v: String(prog.faltam), top: 'Faltam', sub: prog.faltam === 1 ? 'dia' : 'dias' }
      : prog.estado === 'durante' ? { v: String(prog.n), top: 'Dia', sub: `de ${prog.total}` }
        : { v: '✓', top: 'Viagem', sub: 'concluída' })
    : { v: '—', top: 'Datas', sub: 'defina' };

  return (
    <div className="app ui-theme">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back" style={{ alignItems: 'center' }}><span className="ttl" style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Roteiro</span><span style={{ flex: 1 }} /><button onClick={() => ir('mapa')} style={{ width: 'auto', height: 38, padding: '0 14px', borderRadius: 20, border: 'none', background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>🗺 Ver no mapa</button><button onClick={() => setMenuAberto((v) => !v)} aria-label="Mais opções" style={{ width: 38, height: 38, borderRadius: 10, border: '0.5px solid var(--line-strong)', background: 'var(--surface)', fontSize: 18, marginLeft: 8, flex: '0 0 auto' }}>⋮</button></div>

        {menuAberto && (
          <div className="card" style={{ marginBottom: 12, padding: 6 }}>
            <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '11px 12px', fontSize: 14 }} onClick={() => { setMenuAberto(false); abrirDatas(); }}>📅 Editar datas da viagem</button>
            <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '11px 12px', fontSize: 14 }} onClick={() => { setMenuAberto(false); abrirNovo(ultimaData(), null); }}>＋ Adicionar parada</button>
            <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '11px 12px', fontSize: 14 }} onClick={() => { setMenuAberto(false); ir('mapa'); }}>🗺 Ver no mapa</button>
          </div>
        )}

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
                <input className="input" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value, lat: null, lng: null })} placeholder="Ex.: Walt Disney World" style={{ flex: 1 }} />
                <button type="button" className="btn-outline" style={{ width: 100, height: 44 }} onClick={buscarLocal}>Buscar</button>
              </div>
              {geoMsg && <div style={{ fontSize: 11, color: form.lat != null ? 'var(--brand)' : 'var(--muted)', marginTop: 4 }}>{geoMsg}{form.lat != null ? ` (${form.lat.toFixed(3)}, ${form.lng.toFixed(3)})` : ''}</div>}
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>Dica: se não achar, use o nome da cidade ou um ponto famoso (ex.: Walt Disney World).</div>
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
              <div style={{ marginTop: 2, marginBottom: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { ic: '📅', top: tileFaltam.top, v: tileFaltam.v, sub: tileFaltam.sub },
                    { ic: '📍', top: 'Total', v: String(nParadas), sub: nParadas === 1 ? 'parada' : 'paradas' },
                    { ic: '🕐', top: 'Tempo total', v: totaisRota.min > 0 ? fmtHHMM(totaisRota.min) : '—', sub: 'horas' },
                    { ic: '🛣️', top: 'Distância', v: totaisRota.km > 0 ? Math.round(totaisRota.km).toLocaleString('pt-BR') : '—', sub: 'km' },
                  ].map((t, i) => (
                    <div key={i} style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 14, padding: '10px 8px', boxShadow: '0 2px 10px rgba(27,42,47,.05)' }}>
                      <div style={{ fontSize: 15, marginBottom: 4 }}>{t.ic}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.3px', fontWeight: 600, lineHeight: 1.1 }}>{t.top}</div>
                      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>{t.v}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fmtDiaData(ida)} → {fmtDiaData(volta)} · {prog.total} dias</span>
                  <button onClick={abrirDatas} className="btn-ghost" style={{ padding: 0, fontSize: 12.5, color: 'var(--brand)', fontWeight: 600 }}>editar datas</button>
                </div>
              </div>
            )}
            {grupos.length === 0 && <div className="card"><div className="empty">Nenhuma parada ainda. Toque em “Adicionar parada”.</div></div>}

            {grupos.map((g, gi) => {
              const cor = g.data ? CORES_DIA[gi % CORES_DIA.length] : '#5F5E5A';
              const dn = (g.data && ida) ? diffDias(ida, g.data) + 1 : gi + 1;
              // faixa colapsada dos dias vazios entre o grupo anterior (com data) e este
              let gap = null;
              const ant = grupos[gi - 1];
              if (g.data && ida && ant && ant.data && diffDias(ant.data, g.data) > 1) {
                const ini = addDias(ant.data, 1), fim = addDias(g.data, -1);
                gap = { ini, fim, dIni: diffDias(ida, ini) + 1, dFim: diffDias(ida, fim) + 1, n: diffDias(ini, fim) + 1 };
              }
              return (
                <div key={g.key}>
                  {gap && (
                    <div onClick={() => abrirNovo(gap.ini, null)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', border: '0.5px dashed var(--line-strong)', borderRadius: 16, padding: '12px 14px', marginBottom: 14, cursor: 'pointer' }}>
                      <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>📅</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--muted)' }}>{gap.dIni === gap.dFim ? `Dia ${gap.dIni}` : `Dia ${gap.dIni} – ${gap.dFim}`} · {gap.ini === gap.fim ? fmtDM(gap.ini) : `${fmtDM(gap.ini)} → ${fmtDM(gap.fim)}`}</div>
                        <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 1 }}>{gap.n} {gap.n === 1 ? 'dia sem parada' : 'dias sem paradas'}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--brand)', fontWeight: 700, whiteSpace: 'nowrap', flex: '0 0 auto' }}>+ parada</span>
                    </div>
                  )}
                  <div style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 18, overflow: 'hidden', marginBottom: 14, boxShadow: '0 2px 12px rgba(27,42,47,0.06)' }}>
                    <div style={{ background: cor, color: '#fff', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{g.data ? `Dia ${dn}` : 'Sem data'} <span style={{ opacity: 0.85, fontWeight: 400 }}>· {fmtDiaData(g.data)}</span></span>
                      <span style={{ fontSize: 11, opacity: 0.85 }}>{g.stops.length} {g.stops.length === 1 ? 'parada' : 'paradas'}</span>
                    </div>
                  <div style={{ padding: '6px 14px 12px' }}>
                    {g.stops.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: i > 0 ? '0.5px solid var(--line)' : 'none', marginTop: i > 0 ? 12 : 0 }}>
                        <div style={{ width: 11, height: 11, borderRadius: '50%', background: corTipo(p.tipo), marginTop: 5, flex: '0 0 auto' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{p.nome}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}><StatusBadge st={p.status} />{p.hora && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.hora}</span>}{gastoDoDia(p) > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{fmtBRL(gastoDoDia(p))}</span>}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{nomeTipo(p.tipo)}{clima[p.id] ? ` · ${iconeClima(clima[p.id].code)} ${clima[p.id].max}°/${clima[p.id].min}°${clima[p.id].chuva != null ? ` · 🌧 ${clima[p.id].chuva}%` : ''}` : ''}</div>
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
                </div>
              );
            })}

            <button className="btn-outline" style={{ marginTop: 2 }} onClick={() => abrirNovo(ultimaData(), null)}>+ Adicionar parada</button>

            <div className="card" style={{ marginTop: 16, padding: 0, display: 'flex', alignItems: 'stretch', overflow: 'hidden' }}>
              <div onClick={() => ir('resumo')} style={{ flex: 1, padding: '14px 8px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.3px', fontWeight: 600 }}>Orçamento</div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', marginTop: 3 }}>{fmtBRL(Number(viagem.orcamento_brl) || 0)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--brand)', marginTop: 1 }}>ver resumo</div>
              </div>
              <div style={{ width: '0.5px', background: 'var(--line)', flex: '0 0 auto' }} />
              <div onClick={() => ir('checklist')} style={{ flex: 1, padding: '14px 8px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.3px', fontWeight: 600 }}>Tarefas</div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', marginTop: 3 }}>{tarefasPend}</div>
                <div style={{ fontSize: 10.5, color: 'var(--brand)', marginTop: 1 }}>{tarefasPend === 1 ? 'pendente' : 'pendentes'}</div>
              </div>
              <div style={{ width: '0.5px', background: 'var(--line)', flex: '0 0 auto' }} />
              <div onClick={() => ir('pessoas')} style={{ flex: 1, padding: '14px 8px', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.3px', fontWeight: 600 }}>Pessoas</div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', marginTop: 3 }}>{nPessoas}</div>
                <div style={{ fontSize: 10.5, color: 'var(--brand)', marginTop: 1 }}>ver detalhes</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

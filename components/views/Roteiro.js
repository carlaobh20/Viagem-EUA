'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL, dataLocal, hojeLocal } from '../../lib/format';
import { PageHeader, Button, Field, EmptyState, Reveal, Expand } from '../ui';
import { motion as motionTokens } from '../../lib/design-tokens';

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
  { id: 'voo', nome: 'Voo', emoji: '✈️' },
  { id: 'hospedagem', nome: 'Hospedagem', emoji: '🛏️' },
  { id: 'passeio', nome: 'Passeio', emoji: '🎟️' },
  { id: 'comida', nome: 'Comida', emoji: '🍽️' },
  { id: 'museu', nome: 'Atração / Museu', emoji: '🏛️' },
  { id: 'transporte', nome: 'Transporte', emoji: '🚗' },
  { id: 'outro', nome: 'Outro', emoji: '📌' },
];
const STATUS = ['Confirmado', 'Reserva', 'A definir'];
// Cor por dia: a mesma sequência que o Mapa usa nos pinos, pra pessoa ligar
// "Dia 3" daqui com o pino do dia 3 lá. Só aparece num pontinho — o resto da
// tela usa a paleta do app.
const CORES_DIA = ['#0F6E56', '#185FA5', '#534AB7', '#BA7517', '#1D9E75', '#D4537E', '#993C1D'];
const nomeTipo = (t) => (TIPOS.find((x) => x.id === t) || TIPOS[6]).nome;
const emojiTipo = (t) => (TIPOS.find((x) => x.id === t) || TIPOS[6]).emoji;
const hoje = () => hojeLocal();

// Pílula de status: cor só quando comunica estado (confirmado = sucesso,
// reserva = atenção, a definir = neutro).
const TOM_STATUS = { Confirmado: 'ui-pill-success', Reserva: 'ui-pill-warning', 'A definir': 'ui-pill-neutral' };
function StatusBadge({ st }) {
  if (!st) return null;
  return <span className={`ui-pill ${TOM_STATUS[st] || 'ui-pill-neutral'}`}>{st}</span>;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dtDe = (d) => new Date(d + 'T00:00:00');

function fmtDiaData(d) {
  if (!d) return 'Sem data';
  const dt = dtDe(d);
  return `${SEMANA[dt.getDay()]}, ${String(dt.getDate()).padStart(2, '0')} ${MESES[dt.getMonth()]}`;
}
// versão curta pro subtítulo ("12 jan → 24 jan")
function fmtCurta(d) {
  if (!d) return '';
  const dt = dtDe(d);
  return `${dt.getDate()} ${MESES[dt.getMonth()]}`;
}
// pedaços do bloco editorial de data (SET / 12 / sex)
const mesAbrev = (d) => (d ? MESES[dtDe(d).getMonth()].toUpperCase() : '—');
const diaNum = (d) => (d ? String(dtDe(d).getDate()).padStart(2, '0') : '··');
const diaSemana = (d) => (d ? SEMANA[dtDe(d).getDay()] : '');
function diffDias(a, b) { return Math.round((dtDe(b) - dtDe(a)) / 86400000); }
function fmtDur(min) { if (min < 60) return `${min} min`; const h = Math.floor(min / 60); const m = min % 60; return m ? `${h} h ${m} min` : `${h} h`; }
const horaEmMin = (h) => { if (!h) return null; const [a, b] = h.split(':'); return Number(a) * 60 + Number(b || 0); };

// Cidade/lugar do dia: o "onde estarei" do cabeçalho. Vem do que já está
// cadastrado nas paradas (local, ou a cidade escrita no fim do endereço);
// se nenhuma parada disser onde é, cai pro destino da viagem.
function lugarDoDia(stops, viagem) {
  const nomes = [];
  (stops || []).forEach((p) => {
    const local = (p.local || '').trim();
    if (local) { nomes.push(local); return; }
    const end = (p.endereco || '').trim();
    if (end && end.includes(',')) {
      const partes = end.split(',').map((s) => s.trim()).filter(Boolean);
      const cidade = partes[partes.length - 1];
      if (cidade && cidade.length > 2 && !/^\d/.test(cidade)) nomes.push(cidade);
    }
  });
  if (nomes.length === 0) return (viagem?.destino || '').trim() || '';
  const conta = {};
  nomes.forEach((n) => { conta[n] = (conta[n] || 0) + 1; });
  return Object.entries(conta).sort((a, b) => b[1] - a[1])[0][0];
}

// ----- Navegação (Google Maps / Waze) -----
// O GPS recebe TEXTO, na ordem: endereço exato digitado > local > nome + cidade da
// viagem. A coordenada (lat/lng) NÃO é usada pra navegar: ela vem de um buscador
// gratuito (OpenStreetMap) que já errou feio — "Hotel Orlando" caiu na Itália — e
// serve só pra clima e distância. O Google Maps resolve um endereço escrito muito
// melhor do que a gente resolve por aqui. Devolve null se não tem nada pra navegar.
function destinoParada(p, viagem) {
  const endereco = (p.endereco || '').trim();
  if (endereco) return endereco;
  const local = (p.local || '').trim();
  if (local) return local;
  const nome = (p.nome || '').trim();
  if (!nome) return null;
  const cidade = (viagem?.destino || '').trim();
  return cidade ? `${nome}, ${cidade}` : nome;
}
// Só inicia o GPS direto (sem a pessoa conferir o lugar) quando há endereço exato.
const temEnderecoExato = (p) => Boolean((p.endereco || '').trim());
// Link universal do Google Maps (abre o app no celular, o site no computador).
// `navegar` = já inicia o GPS ao abrir (dir_action=navigate), sem origem = "de onde eu estou".
function urlGoogleMaps({ destino, origem, waypoints, navegar }) {
  const u = new URL('https://www.google.com/maps/dir/');
  u.searchParams.set('api', '1');
  if (origem) u.searchParams.set('origin', origem);
  u.searchParams.set('destination', destino);
  if (waypoints && waypoints.length) u.searchParams.set('waypoints', waypoints.join('|'));
  u.searchParams.set('travelmode', 'driving');
  if (navegar) u.searchParams.set('dir_action', 'navigate');
  return u.toString();
}
function urlWaze(p, viagem) {
  const d = destinoParada(p, viagem);
  return d ? `https://waze.com/ul?q=${encodeURIComponent(d)}&navigate=yes` : null;
}

// ----- Pedaços visuais (fora do componente da tela: não remontam a cada render) -----
const LINK_SEM_SUBLINHADO = { textDecoration: 'none' };
// ação secundária em texto (Editar, + comentário, Excluir…) — alvo de 44px mesmo sendo "texto"
const acaoTxt = { background: 'none', border: 'none', minHeight: 44, padding: '0 6px', fontSize: 13.5, fontWeight: 700, color: 'var(--ui-teal-ink)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4 };

// Chip de um dia na tira horizontal: mês (só quando vira o mês), número grande,
// dia da semana e um pontinho quando o dia já tem parada.
function ChipDia({ g, dn, selecionado, ehHoje, temParada, novoMes, onClick, refEl }) {
  return (
    <button
      ref={refEl}
      onClick={onClick}
      aria-label={g.data ? `Dia ${dn}, ${fmtDiaData(g.data)}` : 'Paradas sem data'}
      aria-current={selecionado ? 'true' : undefined}
      className="ui-press"
      style={{
        flex: '0 0 auto', width: 52, padding: '8px 0 7px', borderRadius: 16, border: 'none',
        background: selecionado ? 'var(--ui-dark)' : 'var(--ui-card)',
        color: selecionado ? '#fff' : 'var(--ui-ink)',
        boxShadow: selecionado ? 'var(--ui-shadow-raised)' : 'var(--ui-shadow)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        outline: !selecionado && ehHoje ? '1.5px solid var(--ui-teal)' : 'none', outlineOffset: -1.5,
      }}
    >
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.7px', color: selecionado ? 'rgba(255,255,255,.7)' : 'var(--ui-faint)', height: 12 }}>
        {novoMes ? mesAbrev(g.data) : ''}
      </span>
      <span className="ui-num" style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.05 }}>{diaNum(g.data)}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: selecionado ? 'rgba(255,255,255,.72)' : 'var(--ui-muted)' }}>{g.data ? diaSemana(g.data) : 's/data'}</span>
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 2, background: temParada ? (selecionado ? 'var(--ui-teal)' : 'var(--ui-teal-ink)') : 'transparent' }} />
    </button>
  );
}

export default function Roteiro({ ir }) {
  const { viagem, pontos, gastos, recarregar } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [form, setForm] = useState(null);
  const [formErro, setFormErro] = useState('');
  const [maisDetalhes, setMaisDetalhes] = useState(false);
  const [notaEdit, setNotaEdit] = useState(null);
  const [notaTxt, setNotaTxt] = useState('');
  const [editDatas, setEditDatas] = useState(false);
  const [dIda, setDIda] = useState('');
  const [dVolta, setDVolta] = useState('');
  const [datasErro, setDatasErro] = useState('');
  const [rotas, setRotas] = useState({});
  const [geoMsg, setGeoMsg] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  // Um dia de cada vez: a tira horizontal escolhe o dia, a timeline mostra só ele.
  // null = ainda não escolheu → abre em hoje (durante a viagem), no próximo dia
  // (antes) ou no primeiro dia com parada.
  const [diaSel, setDiaSel] = useState(null);
  const [paradaAberta, setParadaAberta] = useState(null);
  const tiraRef = useRef(null);
  const chipSelRef = useRef(null);

  const [clima, setClima] = useState({});
  const climaRef = useRef(new Set());
  useEffect(() => {
    const hoje = new Date(); const lim = new Date(); lim.setDate(hoje.getDate() + 16);
    const hojeISO = dataLocal(hoje); const limISO = dataLocal(lim);
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

  // Assim que ida e volta estão definidas, o roteiro já tem um dia pra cada data
  // da viagem (mesmo vazio) — não só os dias que já têm parada.
  const diasViagem = [];
  if (viagem.data_ida && viagem.data_volta) {
    let d = dtDe(viagem.data_ida);
    const fim = dtDe(viagem.data_volta);
    while (d <= fim) { diasViagem.push(dataLocal(d)); d.setDate(d.getDate() + 1); }
  }
  const stopsPorData = {};
  ordenados.forEach((p) => { const key = p.data_inicio || ''; (stopsPorData[key] = stopsPorData[key] || []).push(p); });

  let grupos;
  if (diasViagem.length > 0) {
    const cobertos = new Set(diasViagem);
    grupos = diasViagem.map((data) => ({ key: data, data, stops: stopsPorData[data] || [] }));
    // parada com data fora do intervalo ida–volta, ou sem data nenhuma: aparece no fim
    Object.keys(stopsPorData).filter((k) => !cobertos.has(k)).sort().forEach((k) => {
      grupos.push({ key: k || 'sem-data', data: k, stops: stopsPorData[k] });
    });
  } else {
    // sem datas ainda: comportamento de sempre, só os dias que já têm parada
    grupos = [];
    ordenados.forEach((p) => {
      const key = p.data_inicio || 'sem-data';
      let g = grupos.find((x) => x.key === key);
      if (!g) { g = { key, data: p.data_inicio || '', stops: [] }; grupos.push(g); }
      g.stops.push(p);
    });
  }
  const ultimaData = () => (grupos.length ? grupos[grupos.length - 1].data : '') || hoje();

  function abrirNovo(dataPadrao, inserirApos) {
    setGeoMsg(''); setFormErro(''); setMaisDetalhes(false);
    setForm({ id: null, nome: '', data: dataPadrao || ultimaData(), hora: '', tipo: 'passeio', status: '', nota: '', endereco: '', local: '', lat: null, lng: null, inserirApos: inserirApos || null });
  }
  function abrirEdicao(p) {
    setGeoMsg(p.lat != null ? '📍 local salvo (pra clima e distância)' : ''); setFormErro('');
    // se a parada já tem comentário ou local, mostra esses campos de cara
    setMaisDetalhes(Boolean(p.nota || p.local || p.lat != null));
    setForm({ id: p.id, nome: p.nome, data: p.data_inicio || '', hora: p.hora || '', tipo: p.tipo || 'outro', status: p.status || '', nota: p.nota || '', endereco: p.endereco || '', local: p.local || '', lat: p.lat ?? null, lng: p.lng ?? null, inserirApos: null });
  }

  async function salvarForm() {
    const f = form;
    if (!f.nome.trim()) { setFormErro('Dê um nome para a parada.'); return; }
    setFormErro('');
    const campos = { nome: f.nome.trim(), data_inicio: f.data || null, hora: f.hora || null, tipo: f.tipo, status: f.status || null, nota: f.nota.trim() || null, endereco: (f.endereco || '').trim() || null, local: f.local ? f.local.trim() : null, lat: f.lat ?? null, lng: f.lng ?? null };
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
      // a parada nova pode ser de outro dia: leva a tela pro dia dela
      if (f.data) setDiaSel(f.data);
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

  function abrirDatas() { setDIda(viagem.data_ida || ''); setDVolta(viagem.data_volta || ''); setDatasErro(''); setEditDatas(true); }
  async function salvarDatas() {
    if (dIda && dVolta && dVolta < dIda) { setDatasErro('A volta não pode ser antes da ida.'); return; }
    setDatasErro('');
    await supabase.from('viagens').update({ data_ida: dIda || null, data_volta: dVolta || null }).eq('id', viagem.id);
    setEditDatas(false);
    await recarregar();
  }

  async function geocodar(termo) {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(termo)}`, { headers: { Accept: 'application/json' } });
    const j = await r.json();
    return j && j[0] ? { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon), nome: j[0].display_name || '' } : null;
  }
  // resumo curto do que o buscador achou (ex.: "Orlando, Sardegna, Italia") — é isso
  // que deixa a pessoa perceber quando ele errou de lugar
  const resumoLugar = (nome) => (nome || '').split(',').map((s) => s.trim()).filter(Boolean).filter((_, i, a) => i < 2 || i === a.length - 1).join(', ');

  async function buscarLocal() {
    // busca pelo endereço exato quando tem; senão pelo local (cidade / ponto famoso)
    const q = ((form.endereco || '').trim() || (form.local || '').trim());
    if (!q) { setGeoMsg('digite o endereço ou um local primeiro'); return; }
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
          const onde = resumoLugar(hit.nome);
          setGeoMsg((i === 0 ? '📍 achei: ' : `📍 achei só por “${termo}”: `) + onde + ' — confira se é esse mesmo');
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

  const nParadas = pontos.length;

  // Subtítulo do cabeçalho: período + onde a viagem está ("Dia 3 de 12" / "faltam 40 dias").
  let subtitulo;
  if (!prog) subtitulo = nParadas > 0 ? `${nParadas} ${nParadas === 1 ? 'parada' : 'paradas'} · defina as datas da viagem` : 'Defina as datas e monte o dia a dia';
  else {
    const periodo = `${fmtCurta(ida)} → ${fmtCurta(volta)}`;
    // A contagem regressiva vive na Home; aqui o subtítulo só situa o período.
    if (prog.estado === 'durante') subtitulo = `${periodo} · Dia ${prog.n} de ${prog.total}`;
    else if (prog.estado === 'fim') subtitulo = `${periodo} · viagem concluída`;
    else subtitulo = `${periodo} · ${prog.total} dias`;
  }

  // ----- Dia em foco -----
  const hojeS = hoje();
  const grupoHoje = grupos.find((g) => g.data === hojeS) || null;
  // Dia protagonista: hoje (durante a viagem) ou o próximo dia com data.
  let destaque = grupoHoje && ida && volta && hojeS >= ida && hojeS <= volta ? grupoHoje : null;
  if (!destaque && ida && hojeS < ida) destaque = grupos.find((g) => g.data && g.data >= hojeS);
  let padrao = destaque;
  if (!padrao) padrao = grupos.find((g) => g.stops.length > 0) || grupos[0];
  const iSel = Math.max(0, grupos.findIndex((g) => g.key === (diaSel || (padrao && padrao.key))));
  const g = grupos[iSel] || null;

  // Traz o chip do dia escolhido pro centro da tira (inclusive na primeira abertura,
  // quando o dia é o de hoje e a viagem é longa).
  useEffect(() => {
    const el = chipSelRef.current;
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [iSel, grupos.length]);

  const acaoHeader = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button variant="soft" size="sm" onClick={() => ir('mapa')} style={{ minHeight: 40 }}>🗺 Mapa</Button>
      <button onClick={() => setMenuAberto((v) => !v)} aria-label="Mais opções" aria-expanded={menuAberto} className="ui-iconbtn raised ui-press" style={{ width: 40, height: 40 }}>⋮</button>
    </div>
  );

  // ----- Dados do dia em foco -----
  const dn = g ? ((g.data && ida) ? diffDias(ida, g.data) + 1 : iSel + 1) : 0;
  const corDia = g && g.data ? CORES_DIA[iSel % CORES_DIA.length] : 'var(--ui-faint)';
  const stops = g ? g.stops : [];
  const nStops = stops.length;
  const ehHoje = g && g.data === hojeS;
  const passado = g && g.data && g.data < hojeS;
  const lugar = g ? lugarDoDia(stops, viagem) : '';
  const gastoDia = g && g.data ? gastos.filter((x) => x.data === g.data).reduce((t, x) => t + valorEmBRL(x, cambio), 0) : 0;
  // clima do dia: o de qualquer parada do dia que já tenha previsão
  const climaDia = stops.map((p) => clima[p.id]).find(Boolean) || null;
  // Rota do dia inteiro no Google Maps: primeira parada → ... → última
  // (só com 2+ paradas que tenham local; o Maps aceita até ~9 pontos no meio).
  const destinosDia = stops.map((p) => destinoParada(p, viagem)).filter(Boolean);
  const urlRotaDia = destinosDia.length >= 2
    ? urlGoogleMaps({ origem: destinosDia[0], destino: destinosDia[destinosDia.length - 1], waypoints: destinosDia.slice(1, -1).slice(0, 9) })
    : null;
  // Próximo momento: só faz sentido no dia de hoje — a primeira parada cuja hora
  // ainda não passou (paradas sem hora entram como "ainda hoje").
  const agoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const proximaId = ehHoje ? (stops.find((p) => { const m = horaEmMin(p.hora); return m == null || m >= agoraMin; }) || {}).id : null;
  const proxima = proximaId ? stops.find((p) => p.id === proximaId) : null;

  const irParaDia = (i) => { const alvo = grupos[i]; if (alvo) { setDiaSel(alvo.key); setParadaAberta(null); } };

  return (
    <div className="ui-screen">
      <PageHeader titulo="Roteiro" subtitulo={subtitulo} acao={form ? null : acaoHeader} />

      <Expand aberto={menuAberto && !form}>
        <div className="ui-card" style={{ marginBottom: 12, padding: 6 }}>
          <button className="ui-rowbtn" style={{ minHeight: 48, padding: '0 12px', fontSize: 14.5, fontWeight: 600, borderRadius: 12 }} onClick={() => { setMenuAberto(false); abrirDatas(); }}>📅 Editar datas da viagem</button>
          <button className="ui-rowbtn" style={{ minHeight: 48, padding: '0 12px', fontSize: 14.5, fontWeight: 600, borderRadius: 12 }} onClick={() => { setMenuAberto(false); abrirNovo(g ? g.data : ultimaData(), null); }}>＋ Adicionar parada</button>
          <button className="ui-rowbtn" style={{ minHeight: 48, padding: '0 12px', fontSize: 14.5, fontWeight: 600, borderRadius: 12 }} onClick={() => { setMenuAberto(false); ir('mapa'); }}>🗺 Ver no mapa</button>
        </div>
      </Expand>

      {form ? (
        <Reveal>
          <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="ui-h2" style={{ marginBottom: 14 }}>{form.id ? 'Editar parada' : 'Nova parada'}</div>

            <Field label="Nome"><input className="ui-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Magic Kingdom" autoFocus={!form.id} /></Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Dia" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Field>
              <Field label="Hora" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Field>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="Tipo" style={{ flex: 1, minWidth: 0 }}><select className="ui-input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.nome}</option>)}</select></Field>
              <Field label="Status" style={{ flex: 1, minWidth: 0 }}><select className="ui-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="">—</option>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
            </div>
            <Field label="📍 Endereço exato" hint="É pra onde o GPS vai levar. Escreva como no Google Maps: rua, número e cidade — ou o nome exato do lugar (ex.: “Pousada Bela Vista, Morretes”).">
              <input className="ui-input" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Ex.: Rua XV de Novembro, 1000, Curitiba - PR" />
            </Field>

            {!maisDetalhes && (
              <button type="button" onClick={() => setMaisDetalhes(true)} style={{ ...acaoTxt, padding: 0, marginBottom: 12 }}>+ mais detalhes <span style={{ fontWeight: 500, color: 'var(--ui-faint)' }}>(comentário, clima e distância)</span></button>
            )}
            <Expand aberto={maisDetalhes}>
              <Field label="Comentário" opcional><textarea className="ui-input" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Anotações, links, lembretes…" /></Field>
              <Field label="Cidade ou ponto de referência" opcional hint="Só pra previsão do tempo e km/horas entre paradas — não é o que o GPS usa.">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="ui-input" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value, lat: null, lng: null })} placeholder="Ex.: Curitiba" style={{ flex: 1, minWidth: 0 }} />
                  <Button type="button" variant="secondary" onClick={buscarLocal} style={{ flex: '0 0 auto' }}>Buscar</Button>
                </div>
                {geoMsg && <div className="ui-wrap" style={{ fontSize: 12.5, color: form.lat != null ? 'var(--ui-teal-ink)' : 'var(--ui-muted)', marginTop: 6, lineHeight: 1.4 }}>{geoMsg}</div>}
              </Field>
            </Expand>

            {formErro && <div className="ui-error">{formErro}</div>}
            <Button size="lg" full onClick={salvarForm}>{form.id ? 'Salvar alterações' : 'Adicionar parada'}</Button>
            <Button variant="ghost" full style={{ marginTop: 6 }} onClick={() => setForm(null)}>Cancelar</Button>
          </div>
        </Reveal>
      ) : (
        <>
          {editDatas ? (
            <Reveal>
              <div className="ui-card" style={{ padding: 16, marginBottom: 14 }}>
                <div className="ui-h2" style={{ marginBottom: 14 }}>Datas da viagem</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Field label="Ida" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={dIda} onChange={(e) => setDIda(e.target.value)} /></Field>
                  <Field label="Volta" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={dVolta} onChange={(e) => setDVolta(e.target.value)} /></Field>
                </div>
                {datasErro && <div className="ui-error">{datasErro}</div>}
                <Button size="lg" full onClick={salvarDatas}>Salvar datas</Button>
                <Button variant="ghost" full style={{ marginTop: 6 }} onClick={() => setEditDatas(false)}>Cancelar</Button>
              </div>
            </Reveal>
          ) : !prog ? (
            <div className="ui-card-tight" style={{ padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="ui-wrap" style={{ flex: 1, fontSize: 13.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>Com ida e volta, o roteiro mostra um dia de cada vez.</div>
              <Button variant="soft" size="sm" onClick={abrirDatas} style={{ minHeight: 40 }}>Definir datas</Button>
            </div>
          ) : null}

          {grupos.length === 0 && (
            <EmptyState icone="🗺️" titulo="Seu roteiro ainda está vazio." texto="Comece adicionando o primeiro destino." cta="Adicionar parada" onCta={() => abrirNovo(ultimaData(), null)} />
          )}

          {g && (
            <>
              {/* Tira de dias: a viagem inteira numa linha, sem rolar a tela toda */}
              <div className="ui-chips-scroll" ref={tiraRef} style={{ margin: '0 -18px 14px', padding: '4px 18px 10px' }}>
                {grupos.map((gg, i) => {
                  const antes = grupos[i - 1];
                  const novoMes = i === 0 || !antes || !antes.data || !gg.data || dtDe(antes.data).getMonth() !== dtDe(gg.data).getMonth();
                  return (
                    <ChipDia
                      key={gg.key}
                      g={gg}
                      dn={(gg.data && ida) ? diffDias(ida, gg.data) + 1 : i + 1}
                      selecionado={i === iSel}
                      ehHoje={gg.data === hojeS}
                      temParada={gg.stops.length > 0}
                      novoMes={novoMes}
                      refEl={i === iSel ? chipSelRef : null}
                      onClick={() => irParaDia(i)}
                    />
                  );
                })}
              </div>

              {/* O dia: cabeçalho editorial + timeline */}
              <motion.div
                key={g.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: motionTokens.base, ease: motionTokens.easing }}
                className="ui-card"
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: '18px 18px 14px', background: ehHoje ? 'linear-gradient(180deg, var(--ui-teal-soft) 0%, var(--ui-card) 100%)' : 'transparent' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* bloco de data editorial */}
                    <div style={{ flex: '0 0 auto', textAlign: 'center', minWidth: 46 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', color: 'var(--ui-muted)' }}>{mesAbrev(g.data)}</div>
                      <div className="ui-num" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, margin: '1px 0 2px' }}>{diaNum(g.data)}</div>
                      <div style={{ fontSize: 11, color: 'var(--ui-faint)', fontWeight: 600 }}>{g.data ? diaSemana(g.data) : 'sem data'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                        <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: corDia, flex: '0 0 auto' }} />
                        <span className="ui-label" style={{ margin: 0 }}>{g.data ? `Dia ${dn}${prog ? ` de ${prog.total}` : ''}` : 'Sem data'}</span>
                        {ehHoje && <span className="ui-pill" style={{ background: 'var(--ui-teal)', color: '#fff' }}>HOJE</span>}
                        {!ehHoje && destaque && destaque.key === g.key && <span className="ui-pill ui-pill-info">PRÓXIMO DIA</span>}
                      </div>
                      <div className="ui-h2 ui-wrap" style={{ fontSize: 20, letterSpacing: '-0.5px' }}>{nStops ? (lugar || stops[0].nome) : 'Dia livre'}</div>
                      {(nStops > 0 || climaDia || gastoDia > 0) && (
                        <div className="ui-caption ui-wrap" style={{ marginTop: 3 }}>
                          {[
                            nStops ? `${nStops} ${nStops === 1 ? 'parada' : 'paradas'}` : '',
                            climaDia ? `${iconeClima(climaDia.code)} ${climaDia.max}°/${climaDia.min}°` : '',
                            gastoDia > 0 ? `💳 ${fmtBRL(gastoDia)}` : '',
                          ].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* próximo momento do dia de hoje */}
                  {proxima && (
                    <div className="ui-sunken" style={{ marginTop: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)' }}>
                      <span aria-hidden="true" style={{ fontSize: 18, flex: '0 0 auto' }}>{emojiTipo(proxima.tipo)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ui-label" style={{ margin: 0 }}>Agora a seguir</div>
                        <div className="ui-clamp1" style={{ fontSize: 14, fontWeight: 700 }}>{proxima.hora ? `${proxima.hora} · ` : ''}{proxima.nome}</div>
                      </div>
                    </div>
                  )}

                  {urlRotaDia && (
                    <div style={{ marginTop: 12 }}>
                      <a href={urlRotaDia} target="_blank" rel="noopener noreferrer" className="ui-btn ui-btn-soft ui-btn-sm" style={LINK_SEM_SUBLINHADO}>🗺 Ver o dia no mapa</a>
                    </div>
                  )}
                </div>

                {/* Timeline do dia */}
                <div style={{ padding: '4px 16px 14px' }}>
                  {nStops === 0 ? (
                    <div style={{ textAlign: 'center', padding: '18px 8px 12px' }}>
                      <div style={{ fontSize: 30, marginBottom: 6 }} aria-hidden="true">🌤️</div>
                      <div style={{ fontSize: 14.5, fontWeight: 700 }}>{passado ? 'Esse dia ficou sem registro' : 'Dia livre por enquanto'}</div>
                      <div className="ui-caption ui-wrap" style={{ margin: '4px auto 12px', maxWidth: 260 }}>Adicione o primeiro momento do dia — um café, um passeio, um voo.</div>
                      <Button size="sm" onClick={() => abrirNovo(g.data, null)}>Adicionar parada</Button>
                    </div>
                  ) : stops.map((p, i) => {
                    const abertaP = paradaAberta === p.id;
                    const cl = clima[p.id];
                    const m = horaEmMin(p.hora);
                    const jaPassou = ehHoje && m != null && m < agoraMin;
                    const ehProxima = p.id === proximaId;
                    const temLocal = Boolean((p.endereco || '').trim() || (p.local || '').trim());
                    // meta da linha: só o que existe (tipo · lugar curto · clima)
                    const meta = [nomeTipo(p.tipo), (p.endereco || '').trim() ? p.endereco.split(',')[0] : (p.local || '').trim(), cl ? `${iconeClima(cl.code)} ${cl.max}°` : ''].filter(Boolean).join(' · ');
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                        {/* hora */}
                        <div style={{ width: 42, flex: '0 0 auto', textAlign: 'right', paddingTop: 15 }}>
                          <span className="ui-num" style={{ fontSize: 12.5, fontWeight: 800, color: ehProxima ? 'var(--ui-teal-ink)' : jaPassou ? 'var(--ui-faint)' : 'var(--ui-muted)' }}>{p.hora || '·'}</span>
                        </div>
                        {/* trilho */}
                        <div style={{ width: 20, flex: '0 0 auto', position: 'relative' }}>
                          {i > 0 && <span aria-hidden="true" style={{ position: 'absolute', left: 9, top: 0, height: 18, width: 2, background: 'var(--ui-line)' }} />}
                          {i < nStops - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 9, top: 30, bottom: 0, width: 2, background: 'var(--ui-line)' }} />}
                          <span
                            aria-hidden="true"
                            className={ehProxima ? 'v3-pulse-dot' : undefined}
                            style={{
                              position: 'absolute', left: 4, top: 18, width: 12, height: 12, borderRadius: '50%',
                              background: ehProxima ? 'var(--ui-teal)' : jaPassou ? 'var(--ui-line-strong)' : 'var(--ui-card)',
                              border: ehProxima ? 'none' : `2px solid ${jaPassou ? 'var(--ui-line-strong)' : corDia}`,
                            }}
                          />
                        </div>
                        {/* conteúdo */}
                        <div style={{ flex: 1, minWidth: 0, paddingBottom: i === nStops - 1 ? 0 : 2 }}>
                          <button onClick={() => setParadaAberta(abertaP ? null : p.id)} aria-expanded={abertaP} className="ui-rowbtn" style={{ padding: '10px 0', alignItems: 'center', opacity: jaPassou && !abertaP ? 0.66 : 1 }}>
                            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, background: abertaP || ehProxima ? 'var(--ui-teal-soft)' : 'var(--ui-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>{emojiTipo(p.tipo)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className={abertaP ? 'ui-wrap' : 'ui-clamp1'} style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{p.nome}</div>
                              {meta && <div className={abertaP ? 'ui-wrap' : 'ui-clamp1'} style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 2, lineHeight: 1.35 }}>{meta}</div>}
                              {(p.status || temLocal || p.nota) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                                  <StatusBadge st={p.status} />
                                  {temLocal && <span className="ui-caption" title="tem localização" aria-label="tem localização">📍</span>}
                                  {p.nota && <span className="ui-caption" title="tem comentário" aria-label="tem comentário">💬</span>}
                                </div>
                              )}
                            </div>
                            <span aria-hidden="true" style={{ color: 'var(--ui-faint)', fontSize: 18, flex: '0 0 auto', transform: abertaP ? 'rotate(90deg)' : 'none', transition: 'transform .18s var(--ease)' }}>›</span>
                          </button>

                          <Expand aberto={abertaP}>
                            <div style={{ padding: '0 0 14px 50px' }}>
                              {p.endereco && <div className="ui-wrap" style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 6, lineHeight: 1.4 }}>📍 {p.endereco}</div>}
                              {cl && <div className="ui-caption" style={{ marginBottom: 6 }}>{iconeClima(cl.code)} {cl.max}° / {cl.min}°{cl.chuva != null ? ` · 🌧 ${cl.chuva}% de chuva` : ''}</div>}
                              {(() => {
                                const gx = ordenados.findIndex((s) => s.id === p.id);
                                const nx = ordenados[gx + 1];
                                if (!nx || p.lat == null || p.lng == null || nx.lat == null || nx.lng == null) return null;
                                const rota = rotas[`${p.id}_${nx.id}`];
                                // toque no trecho abre o Google Maps já com a rota desta parada até a próxima
                                // (endereço escrito quando tem — a coordenada só entra se não houver texto nenhum)
                                const urlTrecho = urlGoogleMaps({ origem: destinoParada(p, viagem) || `${p.lat},${p.lng}`, destino: destinoParada(nx, viagem) || `${nx.lat},${nx.lng}` });
                                return (
                                  <a href={urlTrecho} target="_blank" rel="noopener noreferrer" className="ui-wrap" style={{ ...LINK_SEM_SUBLINHADO, display: 'block', fontSize: 12.5, color: 'var(--ui-muted)', marginBottom: 6, lineHeight: 1.4 }}>
                                    ↘ {rota === undefined ? 'calculando…' : rota === 'erro' ? 'distância indisponível' : `≈ ${rota.km.toFixed(0)} km · ${fmtDur(rota.min)} de carro até ${nx.nome}`} <span style={{ color: 'var(--ui-teal-ink)', fontWeight: 700 }}>· ver rota</span>
                                  </a>
                                );
                              })()}

                              {(() => {
                                // GPS: "me leva até aqui" a partir de onde a pessoa está.
                                // Google Maps já abre navegando; Waze como alternativa (comum em estrada no Brasil).
                                const dest = destinoParada(p, viagem);
                                if (!dest) return null;
                                const exato = temEnderecoExato(p);
                                const wz = urlWaze(p, viagem);
                                // Com endereço exato: já sai navegando (ação primária). Sem: abre a rota
                                // no Maps mas deixa a pessoa conferir o lugar antes de iniciar.
                                return (
                                  <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <a href={urlGoogleMaps({ destino: dest, navegar: exato })} target="_blank" rel="noopener noreferrer" className={`ui-btn ${exato ? 'ui-btn-primary' : 'ui-btn-soft'}`} style={{ ...LINK_SEM_SUBLINHADO, flex: 1, minWidth: 0 }}>🧭 {exato ? 'Como chegar' : 'Ver no mapa'}</a>
                                      {wz && <a href={wz} target="_blank" rel="noopener noreferrer" className="ui-btn ui-btn-secondary" style={{ ...LINK_SEM_SUBLINHADO, flex: '0 0 auto' }}>Waze</a>}
                                    </div>
                                    {!exato && <button onClick={() => abrirEdicao(p)} style={{ ...acaoTxt, padding: 0, marginTop: 4, minHeight: 40, fontSize: 12.5, color: 'var(--ui-gold)' }}>⚠️ sem endereço exato — toque pra preencher</button>}
                                  </div>
                                );
                              })()}

                              {notaEdit === p.id ? (
                                <div style={{ marginTop: 10 }}>
                                  <textarea className="ui-input" autoFocus value={notaTxt} onChange={(e) => setNotaTxt(e.target.value)} placeholder="Escreva um comentário…" />
                                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    <Button size="sm" onClick={() => salvarNota(p)} style={{ minHeight: 40 }}>Salvar comentário</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setNotaEdit(null)} style={{ minHeight: 40 }}>Cancelar</Button>
                                  </div>
                                </div>
                              ) : p.nota ? (
                                <button onClick={() => abrirNota(p)} className="ui-sunken ui-wrap" style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 10, border: 'none', padding: '9px 12px', fontSize: 13.5, lineHeight: 1.45, color: 'var(--ui-ink)', whiteSpace: 'pre-wrap' }}>
                                  <span className="ui-label" style={{ margin: '0 0 3px' }}>Comentário · toque pra editar</span>{p.nota}
                                </button>
                              ) : null}

                              <div style={{ display: 'flex', gap: 2, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <button style={acaoTxt} onClick={() => abrirEdicao(p)}>✏️ Editar</button>
                                {!p.nota && notaEdit !== p.id && <button style={acaoTxt} onClick={() => abrirNota(p)}>+ comentário</button>}
                                <button aria-label="Mover para cima" className="ui-iconbtn" style={{ width: 40, height: 40, background: 'transparent', fontSize: 16, color: 'var(--ui-muted)', opacity: i === 0 ? 0.35 : 1 }} onClick={() => mover(g, i, -1)} disabled={i === 0}>↑</button>
                                <button aria-label="Mover para baixo" className="ui-iconbtn" style={{ width: 40, height: 40, background: 'transparent', fontSize: 16, color: 'var(--ui-muted)', opacity: i === nStops - 1 ? 0.35 : 1 }} onClick={() => mover(g, i, 1)} disabled={i === nStops - 1}>↓</button>
                                <span style={{ flex: 1 }} />
                                <button style={{ ...acaoTxt, color: 'var(--ui-debit)' }} onClick={() => excluir(p)}>Excluir</button>
                              </div>
                              <button onClick={() => abrirNovo(g.data, p.id)} style={{ ...acaoTxt, padding: 0, minHeight: 40, fontSize: 12.5 }}>+ inserir parada depois desta</button>
                            </div>
                          </Expand>
                        </div>
                      </div>
                    );
                  })}

                  {/* último nó da timeline: adicionar */}
                  {nStops > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 42, flex: '0 0 auto' }} />
                      <div style={{ width: 20, flex: '0 0 auto', position: 'relative', alignSelf: 'stretch' }}>
                        <span aria-hidden="true" style={{ position: 'absolute', left: 9, top: 0, height: 22, width: 2, background: 'var(--ui-line)' }} />
                        <span aria-hidden="true" style={{ position: 'absolute', left: 4, top: 22, width: 12, height: 12, borderRadius: '50%', background: 'var(--ui-card)', border: '2px dashed var(--ui-line-strong)' }} />
                      </div>
                      <button onClick={() => abrirNovo(g.data, null)} className="ui-rowbtn" style={{ minHeight: 48, padding: '8px 0' }}>
                        <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, border: '1.5px dashed var(--ui-line-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--ui-muted)', flex: '0 0 auto' }}>+</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ui-teal-ink)' }}>adicionar parada</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Navegação entre dias */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <Button variant="secondary" size="sm" onClick={() => irParaDia(iSel - 1)} disabled={iSel === 0} style={{ minHeight: 44, flex: 1 }}>‹ Anterior</Button>
                {grupoHoje && grupoHoje.key !== g.key && (
                  <Button variant="soft" size="sm" onClick={() => irParaDia(grupos.findIndex((x) => x.key === grupoHoje.key))} style={{ minHeight: 44, flex: '0 0 auto' }}>Hoje</Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => irParaDia(iSel + 1)} disabled={iSel >= grupos.length - 1} style={{ minHeight: 44, flex: 1 }}>Próximo ›</Button>
              </div>
            </>
          )}

        </>
      )}
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL } from '../../lib/format';
import { PageHeader, EmptyState, Reveal } from '../ui';

// Cor por dia: mesma sequência do Roteiro (o pontinho do "Dia 3" lá é o pino do dia 3 aqui).
const CORES_DIA = ['#0F6E56', '#185FA5', '#534AB7', '#BA7517', '#1D9E75', '#D4537E', '#993C1D'];
const TIPO_NOME = {
  voo: 'Voo', hospedagem: 'Hospedagem', passeio: 'Passeio', comida: 'Comida',
  museu: 'Atração / Museu', transporte: 'Transporte', outro: 'Outro',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ehTrajeto = (s) => /[→>]/.test(s || '');

function fmtDiaData(d) {
  if (!d) return 'Sem data';
  const dt = new Date(d + 'T00:00:00');
  const wd = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dt.getDay()];
  const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][dt.getMonth()];
  return `${wd}, ${String(dt.getDate()).padStart(2, '0')} ${m}`;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Lê uma cor da paleta (--ui-*) já resolvida — o Leaflet desenha em SVG e não entende var().
function corPaleta(nome, fallback) {
  try { return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || fallback; } catch (e) { return fallback; }
}

let leafletPromise = null;
function carregarLeaflet() {
  if (typeof window === 'undefined') return Promise.reject(new Error('sem janela'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.async = true;
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error('falha ao carregar o mapa'));
    document.body.appendChild(s);
  });
  return leafletPromise;
}

async function geocodar(termo) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(termo)}`, { headers: { Accept: 'application/json' } });
  const j = await r.json();
  return j && j[0] ? { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) } : null;
}

// Ajustes finos no Leaflet, só dentro desta tela: controles de zoom com alvo de
// 44px, balão com a tipografia e o raio do app. (globals.css fica intacto.)
const CSS_MAPA = `
.mapa-viagem .leaflet-bar { border: none; border-radius: 12px; box-shadow: var(--ui-shadow-raised); overflow: hidden; }
.mapa-viagem .leaflet-bar a, .mapa-viagem .leaflet-touch .leaflet-bar a { width: 44px; height: 44px; line-height: 44px; font-size: 20px; font-weight: 600; color: var(--ui-ink); background: var(--ui-card); border-bottom: 1px solid var(--ui-line); }
.mapa-viagem .leaflet-bar a:last-child { border-bottom: none; }
.mapa-viagem .leaflet-bar a.leaflet-disabled { color: var(--ui-faint); }
.mapa-viagem .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: var(--ui-shadow-raised); font-family: var(--font); color: var(--ui-ink); }
.mapa-viagem .leaflet-popup-content { margin: 12px 14px; line-height: 1.35; }
.mapa-viagem .leaflet-container { font-family: var(--font); }
`;

export default function Mapa({ ir }) {
  const { viagem, pontos, gastos, recarregar } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const tentados = useRef(new Set());
  const [erro, setErro] = useState('');
  const [geoStatus, setGeoStatus] = useState('');

  const gastoDoPonto = (id) => gastos.filter((g) => g.ponto_id === id).reduce((s, g) => s + valorEmBRL(g, cambio), 0);

  const ordenados = [...pontos].sort((a, b) => {
    const da = a.data_inicio || '9999-12-31', db = b.data_inicio || '9999-12-31';
    if (da !== db) return da < db ? -1 : 1;
    return (a.ordem || 0) - (b.ordem || 0);
  });
  const localizados = ordenados.filter((p) => p.lat != null && p.lng != null);

  const diasDistintos = [];
  ordenados.forEach((p) => { const k = p.data_inicio || ''; if (k && !diasDistintos.includes(k)) diasDistintos.push(k); });
  const corDoPonto = (p) => {
    const idx = diasDistintos.indexOf(p.data_inicio || '');
    return idx >= 0 ? CORES_DIA[idx % CORES_DIA.length] : '#5F5E5A';
  };
  const legenda = diasDistintos
    .map((d, i) => ({ data: d, cor: CORES_DIA[i % CORES_DIA.length], n: i + 1 }))
    .filter((x) => localizados.some((p) => (p.data_inicio || '') === x.data));

  // 1) Geocodificação automática das paradas sem local salvo
  useEffect(() => {
    let cancel = false;
    const faltando = pontos.filter((p) => (p.lat == null || p.lng == null) && !tentados.current.has(p.id));
    if (faltando.length === 0) return;
    (async () => {
      let ok = 0, alvos = 0;
      for (const p of faltando) {
        if (cancel) return;
        tentados.current.add(p.id);
        let termo = (p.local && p.local.trim()) ? p.local.trim() : (ehTrajeto(p.nome) ? '' : (p.nome || '').trim());
        if (!termo) continue;
        alvos++;
        if (alvos === 1) setGeoStatus('localizando paradas no mapa…');
        try {
          const hit = await geocodar(termo);
          if (hit) { await supabase.from('pontos_roteiro').update({ lat: hit.lat, lng: hit.lng }).eq('id', p.id); ok++; }
        } catch (e) { /* ignora e segue */ }
        await sleep(1100); // respeita o limite do OpenStreetMap (~1/seg)
      }
      if (cancel) return;
      if (ok > 0) { setGeoStatus(`📍 ${ok} parada(s) localizada(s) automaticamente`); await recarregar(); }
      else setGeoStatus('');
      setTimeout(() => { if (!cancel) setGeoStatus(''); }, 4000);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos]);

  // 2) Desenha o mapa real + pinos + rota seguindo estradas
  useEffect(() => {
    let cancelado = false;
    if (localizados.length === 0) return;
    carregarLeaflet().then((L) => {
      if (cancelado || !divRef.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = {};

      const map = L.map(divRef.current, { zoomControl: true });
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

      const pts = [];
      localizados.forEach((p, i) => {
        const cor = corDoPonto(p);
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${cor};transform:rotate(-45deg);border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;">${i + 1}</span></div>`,
          iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26],
        });
        const g = gastoDoPonto(p.id);
        const html =
          `<div style="min-width:150px;"><div style="font-weight:700;font-size:14.5px;margin-bottom:2px;">${esc(p.nome)}</div>` +
          `<div style="font-size:12px;color:var(--ui-muted);">${esc(TIPO_NOME[p.tipo] || 'Outro')} · ${esc(fmtDiaData(p.data_inicio))}</div>` +
          (g > 0 ? `<div style="font-size:12px;color:var(--ui-credit);font-weight:700;margin-top:4px;">Gasto: ${esc(fmtBRL(g))}</div>` : '') + `</div>`;
        const mk = L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(html);
        markersRef.current[p.id] = mk;
        pts.push([p.lat, p.lng]);
      });

      if (pts.length > 1) map.fitBounds(pts, { padding: [50, 50] });
      else map.setView(pts[0], 12);
      setTimeout(() => { if (!cancelado && mapRef.current) mapRef.current.invalidateSize(); }, 200);

      // rota: para cada par seguido, tenta estrada (OSRM); se não houver, traço reto (voo)
      const corEstrada = corPaleta('--ui-teal-ink', '#0B8F80');
      const corReta = corPaleta('--ui-blue', '#2F6FE4');
      for (let i = 0; i < localizados.length - 1; i++) {
        const a = localizados[i], b = localizados[i + 1];
        const reta = [[a.lat, a.lng], [b.lat, b.lng]];
        fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`)
          .then((r) => r.json())
          .then((j) => {
            if (cancelado || !mapRef.current) return;
            if (j.routes && j.routes[0] && j.routes[0].geometry) {
              const linha = j.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
              L.polyline(linha, { color: corEstrada, weight: 4, opacity: 0.8, dashArray: '2 9', lineCap: 'round' }).addTo(mapRef.current);
            } else {
              L.polyline(reta, { color: corReta, weight: 2.5, opacity: 0.55, dashArray: '7 7' }).addTo(mapRef.current);
            }
          })
          .catch(() => { if (!cancelado && mapRef.current) L.polyline(reta, { color: corReta, weight: 2.5, opacity: 0.55, dashArray: '7 7' }).addTo(mapRef.current); });
      }
    }).catch(() => { if (!cancelado) setErro('Não consegui carregar o mapa. Verifique a conexão.'); });

    return () => {
      cancelado = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos, cambio]);

  function focar(p) {
    const map = mapRef.current, mk = markersRef.current[p.id];
    if (map && mk) { map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 12), { duration: 0.6 }); mk.openPopup(); }
  }

  const semLocal = ordenados.length - localizados.length;
  const subtitulo = localizados.length === 0
    ? (geoStatus || 'As paradas com local aparecem aqui')
    : `${localizados.length} ${localizados.length === 1 ? 'parada' : 'paradas'} no mapa${semLocal > 0 ? ` · ${semLocal} sem local` : ''}`;

  return (
    <div className="ui-screen mapa-viagem">
      <style>{CSS_MAPA}</style>
      <PageHeader titulo="Mapa da viagem" subtitulo={subtitulo} onVoltar={() => ir('roteiro')} />

      {localizados.length === 0 ? (
        geoStatus ? (
          <div className="ui-card ui-empty ui-in">
            <div className="ico" aria-hidden="true">📡</div>
            <div className="t">{geoStatus}</div>
            <div className="s">Procurando cada parada pelo nome ou local. Leva uns segundos.</div>
          </div>
        ) : (
          <EmptyState icone="📍" titulo="Nenhuma parada no mapa ainda." texto="No Roteiro, abra uma parada, preencha a cidade ou ponto de referência e toque em Buscar pra fixar ela aqui." cta="Ir para o Roteiro" onCta={() => ir('roteiro')} />
        )
      ) : erro ? (
        <EmptyState icone="📡" titulo="Não consegui carregar o mapa." texto="Verifique a conexão e abra de novo." cta="Voltar ao Roteiro" onCta={() => ir('roteiro')} />
      ) : (
        <Reveal>
          <div ref={divRef} style={{ height: '56vh', minHeight: 320, borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--ui-shadow)', background: 'var(--ui-sunken)' }} />

          {/* Legenda discreta: cor de cada dia, rolável se a viagem for longa */}
          {legenda.length > 0 && (
            <div className="ui-chips-scroll" style={{ marginTop: 10, padding: '2px 4px 4px' }}>
              {legenda.map((x) => (
                <span key={x.data} className="ui-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                  <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: '50%', background: x.cor }} />Dia {x.n} · {fmtDiaData(x.data)}
                </span>
              ))}
            </div>
          )}

          {geoStatus && <div className="ui-success" style={{ marginTop: 10, textAlign: 'center' }}>{geoStatus}</div>}

          <div className="ui-section">
            <span>Paradas no mapa</span>
            <span style={{ fontWeight: 600, letterSpacing: 0, textTransform: 'none', color: 'var(--ui-faint)' }}>toque pra focar</span>
          </div>
          <div className="ui-card" style={{ padding: '2px 16px' }}>
            <div className="ui-list">
              {localizados.map((p, i) => {
                const g = gastoDoPonto(p.id);
                return (
                  <button key={p.id} onClick={() => focar(p)} className="ui-rowbtn">
                    <span aria-hidden="true" className="ui-num" style={{ width: 28, height: 28, borderRadius: '50%', background: corDoPonto(p), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, flex: '0 0 auto' }}>{i + 1}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="ui-clamp1" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{p.nome}</div>
                      <div className="ui-caption ui-clamp1" style={{ marginTop: 2 }}>{TIPO_NOME[p.tipo] || 'Outro'} · {fmtDiaData(p.data_inicio)}</div>
                    </div>
                    {g > 0 && <span className="ui-num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ui-teal-ink)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{fmtBRL(g)}</span>}
                    <span aria-hidden="true" style={{ color: 'var(--ui-faint)', fontSize: 18, flex: '0 0 auto' }}>›</span>
                  </button>
                );
              })}
            </div>
          </div>

          {semLocal > 0 && (
            <div className="ui-caption ui-wrap" style={{ marginTop: 12, padding: '0 4px', textAlign: 'center', color: 'var(--ui-faint)' }}>
              {semLocal} {semLocal === 1 ? 'parada ainda sem local' : 'paradas ainda sem local'} (trajetos como “A → B” ou nomes que o mapa não reconhece).
            </div>
          )}
        </Reveal>
      )}
    </div>
  );
}

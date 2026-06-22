'use client';
import { useEffect, useRef, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL } from '../../lib/format';

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
          `<div style="min-width:150px;"><div style="font-weight:600;font-size:14px;margin-bottom:2px;">${esc(p.nome)}</div>` +
          `<div style="font-size:12px;color:#6B7A7E;">${esc(TIPO_NOME[p.tipo] || 'Outro')} · ${esc(fmtDiaData(p.data_inicio))}</div>` +
          (g > 0 ? `<div style="font-size:12px;color:#0F6E56;margin-top:3px;">Gasto: ${esc(fmtBRL(g))}</div>` : '') + `</div>`;
        const mk = L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(html);
        markersRef.current[p.id] = mk;
        pts.push([p.lat, p.lng]);
      });

      if (pts.length > 1) map.fitBounds(pts, { padding: [50, 50] });
      else map.setView(pts[0], 12);
      setTimeout(() => { if (!cancelado && mapRef.current) mapRef.current.invalidateSize(); }, 200);

      // rota: para cada par seguido, tenta estrada (OSRM); se não houver, traço reto (voo)
      for (let i = 0; i < localizados.length - 1; i++) {
        const a = localizados[i], b = localizados[i + 1];
        const reta = [[a.lat, a.lng], [b.lat, b.lng]];
        fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`)
          .then((r) => r.json())
          .then((j) => {
            if (cancelado || !mapRef.current) return;
            if (j.routes && j.routes[0] && j.routes[0].geometry) {
              const linha = j.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
              L.polyline(linha, { color: '#0F6E56', weight: 4, opacity: 0.8, dashArray: '2 9', lineCap: 'round' }).addTo(mapRef.current);
            } else {
              L.polyline(reta, { color: '#185FA5', weight: 2.5, opacity: 0.55, dashArray: '7 7' }).addTo(mapRef.current);
            }
          })
          .catch(() => { if (!cancelado && mapRef.current) L.polyline(reta, { color: '#185FA5', weight: 2.5, opacity: 0.55, dashArray: '7 7' }).addTo(mapRef.current); });
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

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back">
          <button onClick={() => ir('roteiro')} aria-label="Voltar">←</button>
          <span className="ttl">Mapa da viagem</span>
        </div>

        {localizados.length === 0 ? (
          <div className="card">
            <div className="empty">
              {geoStatus ? geoStatus : <>Nenhuma parada com local salvo ainda.<br />No Roteiro, abra uma parada, escreva o local e toque em <b>Buscar</b> para fixá-la no mapa.</>}
            </div>
            {!geoStatus && <button className="btn-outline" onClick={() => ir('roteiro')}>Ir para o Roteiro</button>}
          </div>
        ) : erro ? (
          <div className="card"><div className="empty">{erro}</div></div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              <div ref={divRef} style={{ height: '58vh', minHeight: 340, borderRadius: 18, overflow: 'hidden', border: '0.5px solid var(--line)', boxShadow: '0 4px 16px rgba(27,42,47,0.08)' }} />
              {legenda.length > 0 && (
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,.95)', borderRadius: 11, padding: '8px 10px', boxShadow: '0 2px 10px rgba(0,0,0,.14)', zIndex: 500, fontSize: 11.5 }}>
                  <div style={{ fontSize: 9.5, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 5, fontWeight: 600 }}>Por dia</div>
                  {legenda.map((x) => (
                    <div key={x.data} style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '3px 0' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: x.cor }} />Dia {x.n} · {fmtDiaData(x.data)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {geoStatus && <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 10, textAlign: 'center' }}>{geoStatus}</div>}

            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 18, marginTop: 14, padding: '6px 16px 10px', boxShadow: '0 2px 12px rgba(27,42,47,0.06)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '10px 0 8px' }}>
                {localizados.length} {localizados.length === 1 ? 'parada no mapa' : 'paradas no mapa'} · toque para focar
              </div>
              {localizados.map((p, i) => {
                const g = gastoDoPonto(p.id);
                return (
                  <div key={p.id} onClick={() => focar(p)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderTop: i > 0 ? '0.5px solid var(--line)' : 'none', cursor: 'pointer' }}>
                    <div style={{ width: 23, height: 23, borderRadius: '50%', background: corDoPonto(p), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: '0 0 auto' }}>{i + 1}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 1 }}>{TIPO_NOME[p.tipo] || 'Outro'} · {fmtDiaData(p.data_inicio)}</div>
                    </div>
                    {g > 0 && <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--brand)', whiteSpace: 'nowrap' }}>{fmtBRL(g)}</div>}
                  </div>
                );
              })}
            </div>

            {semLocal > 0 && (
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10, textAlign: 'center' }}>
                {semLocal} parada(s) sem local no mapa (trajetos como "A → B" ou nomes que o mapa não reconhece).
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

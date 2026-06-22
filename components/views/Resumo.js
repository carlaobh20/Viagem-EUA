'use client';

import { useData } from '../DataProvider';
import { calcularSaldos, calcularConsumoPorMoeda, quemDeveParaQuem } from '../../lib/settle';
import { valorEmBRL, fmtBRL, fmtUSD, emojiCategoria, nomeCategoria, CATEGORIAS_MOTORHOME } from '../../lib/format';

const SLICE_CORES = ['#12B8A6', '#2F6FE4', '#9AE6D6', '#CBD5E1'];

export default function Resumo({ ir }) {
  const { perfil, viagem, gastos, perfis, divisoes, acertos, atualizarOrcamento } = useData();
  const cambio = Number(viagem.cotacao_usd);

  const totalBRL = gastos.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const gastoReal = gastos.filter((g) => g.moeda === 'BRL').reduce((s, g) => s + Number(g.valor), 0);
  const gastoDolar = gastos.filter((g) => g.moeda === 'USD').reduce((s, g) => s + Number(g.valor), 0);
  const orcamento = Number(viagem.orcamento_brl) || 0;
  const pct = orcamento > 0 ? Math.min(100, Math.round((totalBRL / orcamento) * 100)) : 0;
  const restante = orcamento - totalBRL;

  const consumoMoeda = calcularConsumoPorMoeda(gastos, divisoes, perfis);
  const cambioOk = cambio > 0;
  const emBRL = (m) => (m.usd * cambio) + m.brl;
  const porPessoa = perfis
    .map((p) => { const m = consumoMoeda[p.id] || { usd: 0, brl: 0 }; return { ...p, totalBRL: emBRL(m) }; })
    .sort((a, b) => b.totalBRL - a.totalBRL);
  const maxPessoa = porPessoa.reduce((m, p) => Math.max(m, p.totalBRL), 0) || 1;
  const totalPessoas = porPessoa.reduce((s, p) => s + p.totalBRL, 0) || 1;

  const mapa = {};
  gastos.forEach((g) => { mapa[g.categoria] = (mapa[g.categoria] || 0) + valorEmBRL(g, cambio); });
  const ordenadas = Object.entries(mapa).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  const fatias = ordenadas.slice(0, 3).map((c) => ({ nome: nomeCategoria(c.id), v: c.v }));
  const restoV = ordenadas.slice(3).reduce((s, c) => s + c.v, 0);
  if (restoV > 0) fatias.push({ nome: 'Outros', v: restoV });
  const totCat = fatias.reduce((s, f) => s + f.v, 0) || 1;
  const R = 30, C = 2 * Math.PI * R;
  let acc = 0;
  const arcos = fatias.map((f, i) => {
    const frac = f.v / totCat;
    const arco = { len: frac * C, off: -acc * C, cor: SLICE_CORES[i % SLICE_CORES.length] };
    acc += frac; return arco;
  });

  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio, acertos);
  const transferencias = quemDeveParaQuem(saldos);
  const nomeP = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };

  const gastosMH = gastos.filter((g) => CATEGORIAS_MOTORHOME.includes(g.categoria));
  const totalMH = gastosMH.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const combustivelMH = gastos.filter((g) => g.categoria === 'combustivel').reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const hojeISO = new Date().toISOString().slice(0, 10);
  const ida = viagem.data_ida;
  let diasViagem = 1;
  if (ida) { const d = Math.floor((new Date((hojeISO < ida ? ida : hojeISO) + 'T00:00:00') - new Date(ida + 'T00:00:00')) / 86400000) + 1; diasViagem = Math.max(1, d); }
  const _ret = viagem.mh_retirada, _ent = viagem.mh_entrega;
  const diasRV_ = (_ret && _ent && _ent >= _ret) ? Math.floor((new Date(_ent + 'T00:00:00') - new Date(_ret + 'T00:00:00')) / 86400000) + 1 : null;
  const custoDiaMH = totalMH / (diasRV_ || diasViagem);

  const ultimos = gastos.slice(0, 3);

  function editarOrcamento() {
    const v = window.prompt('Quanto vocês pretendem gastar nos EUA? (meta total, em reais)', String(orcamento));
    if (v != null) { const n = parseFloat(v.replace(',', '.')); if (!isNaN(n) && n >= 0) atualizarOrcamento(n); }
  }

  const fmtDataCurta = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); const ms = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']; return `${dia} ${ms[Number(m)-1]}`; };
  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const secTitle = { fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', margin: '20px 2px 12px' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '8px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--ui-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>✈</span>
          <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{viagem?.nome || 'Viagem EUA'}</span>
        </div>
        <button onClick={() => ir('acerto')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-teal)', background: '#DCF7EF', padding: '7px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', flex: '0 0 auto' }}>Câmbio R$ {cambio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</button>
      </div>

      {/* hero */}
      <div onClick={editarOrcamento} style={{ position: 'relative', borderRadius: 24, padding: 20, color: '#fff', overflow: 'hidden', backgroundImage: "linear-gradient(105deg, rgba(20,40,90,0.30) 0%, rgba(20,40,90,0) 55%), url('/hero-eua.jpg')", backgroundSize: 'cover', backgroundPosition: 'right center', boxShadow: '0 14px 30px rgba(28,120,150,.28)', cursor: 'pointer' }}>
        <div style={{ fontSize: 13, opacity: 0.92, fontWeight: 500 }}>Total convertido</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', margin: '3px 0 14px' }}>{fmtBRL(totalBRL)}</div>
        <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,.30)', overflow: 'hidden', maxWidth: '72%' }}><div style={{ width: pct + '%', height: '100%', borderRadius: 6, background: '#fff' }} /></div>
        <div style={{ fontSize: 11.5, opacity: 0.92, margin: '8px 0 16px' }}>Meta: {fmtBRL(orcamento)} · {pct}% usado · {restante >= 0 ? `${fmtBRL(restante)} restantes` : `${fmtBRL(-restante)} acima`}</div>
        <div style={{ display: 'flex', gap: 10, maxWidth: '84%' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 15, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 10.5, opacity: 0.85 }}>Em dólar</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtUSD(gastoDolar)}</div></div>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flex: '0 0 auto', marginLeft: 6 }}>$</span>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 15, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 10.5, opacity: 0.85 }}>Em real</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtBRL(gastoReal)}</div></div>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flex: '0 0 auto', marginLeft: 6 }}>R$</span>
          </div>
        </div>
      </div>

      {/* A acertar (slim) */}
      <div onClick={() => ir('acerto')} style={{ ...card, marginTop: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, background: '#DCF7EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ui-teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>A acertar</div>
          {transferencias.length === 0
            ? <div style={{ fontSize: 14, fontWeight: 700 }}>Tudo quite ✅</div>
            : <div style={{ fontSize: 14, fontWeight: 700 }}>{nomeP(transferencias[0].de)} → {nomeP(transferencias[0].para)} · {fmtBRL(transferencias[0].valor)}</div>}
        </div>
        <span style={{ color: 'var(--ui-faint)', fontSize: 18 }}>›</span>
      </div>

      {/* Resumo rápido */}
      <div style={secTitle}>Resumo rápido</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div onClick={() => ir('pessoas')} style={{ ...card, padding: 14, cursor: 'pointer' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Gastos por pessoa</div>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            {porPessoa.slice(0, 5).map((p, i) => (
              <span key={p.id} style={{ width: 30, height: 30, borderRadius: '50%', background: p.cor, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -10 }}>{p.nome.slice(0, 2).toUpperCase()}</span>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ui-teal)', fontWeight: 600 }}>Ver detalhes ›</div>
        </div>
        <div onClick={() => ir('gastos')} style={{ ...card, padding: 14, cursor: 'pointer' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Gastos por categoria</div>
          {arcos.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--ui-faint)', padding: '14px 0', textAlign: 'center' }}>Sem gastos</div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <svg width="74" height="74" viewBox="0 0 92 92" role="img" aria-label="Categorias">
                <circle cx="46" cy="46" r={R} fill="none" stroke="var(--ui-line)" strokeWidth="11" />
                {arcos.map((a, i) => (<circle key={i} cx="46" cy="46" r={R} fill="none" stroke={a.cor} strokeWidth="11" strokeDasharray={`${a.len} ${C}`} strokeDashoffset={a.off} transform="rotate(-90 46 46)" strokeLinecap="round" />))}
              </svg>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: 'var(--ui-teal)', fontWeight: 600, textAlign: 'center' }}>Ver detalhes ›</div>
        </div>
      </div>

      {/* Ranking */}
      <div style={secTitle}>Ranking de gastos</div>
      <div style={{ ...card, padding: '6px 16px' }}>
        {porPessoa.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: p.cor, color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</span>
                <span style={{ fontSize: 14, fontWeight: 800, flex: '0 0 auto' }}>{fmtBRL(p.totalBRL)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--ui-line)', overflow: 'hidden' }}><div style={{ width: Math.max(3, (p.totalBRL / maxPessoa) * 100) + '%', height: '100%', borderRadius: 4, background: p.cor }} /></div>
                <span style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 600, flex: '0 0 auto' }}>{Math.round((p.totalBRL / totalPessoas) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motorhome (mantido para acesso) */}
      {totalMH > 0 && (
        <div onClick={() => ir('motorhome')} style={{ marginTop: 14, borderRadius: 22, padding: 18, color: '#fff', overflow: 'hidden', backgroundImage: "linear-gradient(160deg, rgba(23,49,107,.70) 0%, rgba(16,33,82,.82) 58%, rgba(11,24,64,.90) 100%), url('/motorhome-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 14px 30px rgba(20,34,80,.34)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h11v8H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 800 }}>Motorhome</div><div style={{ fontSize: 11, opacity: 0.78, marginTop: 1 }}>combustível, camping, pedágio…</div></div>
            <span style={{ fontSize: 18, opacity: 0.8 }}>›</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'rgba(8,20,52,.34)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: '11px 12px' }}><div style={{ fontSize: 10.5, opacity: 0.82 }}>Total RV</div><div style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>{fmtBRL(totalMH)}</div></div>
            <div style={{ flex: 1, background: 'rgba(8,20,52,.34)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: '11px 12px' }}><div style={{ fontSize: 10.5, opacity: 0.82 }}>Por dia</div><div style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>{fmtBRL(custoDiaMH)}</div></div>
            <div style={{ flex: 1, background: 'rgba(8,20,52,.34)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 14, padding: '11px 12px' }}><div style={{ fontSize: 10.5, opacity: 0.82 }}>Combust.</div><div style={{ fontSize: 15, fontWeight: 800, marginTop: 3 }}>{fmtBRL(combustivelMH)}</div></div>
          </div>
        </div>
      )}

      {/* Dica de economia */}
      <div style={{ ...card, marginTop: 14, padding: '14px 16px', background: '#EAF8F2', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 36, height: 36, borderRadius: 11, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>💡</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Dica de economia</div>
          <div style={{ fontSize: 11.5, color: '#4b6b60', marginTop: 2, lineHeight: 1.4 }}>Ao pagar no cartão nos EUA, escolha ser cobrado em <b>dólar (USD)</b>. Aceitar em real na maquininha costuma sair mais caro.</div>
        </div>
      </div>

      {/* Últimos gastos */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '20px 2px 12px' }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>Últimos gastos</span>
        <span onClick={() => ir('gastos')} style={{ fontSize: 12, color: 'var(--ui-teal)', fontWeight: 600, cursor: 'pointer' }}>Ver todos</span>
      </div>
      <div style={{ ...card, padding: '4px 16px' }}>
        {ultimos.length === 0 && <div style={{ fontSize: 13, color: 'var(--ui-faint)', textAlign: 'center', padding: '22px 0' }}>Nenhum gasto ainda</div>}
        {ultimos.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</div>
              <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>{nomeP(g.pago_por)} · {fmtDataCurta(g.data)}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, flex: '0 0 auto' }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

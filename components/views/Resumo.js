'use client';

import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { valorEmBRL, fmtBRL, fmtUSD, emojiCategoria, nomeCategoria, CATEGORIAS_MOTORHOME } from '../../lib/format';

const MS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };
const diff = (a, b) => Math.floor((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
const ICON_TIPO = { voo: '✈️', aviao: '✈️', hotel: '🏨', hospedagem: '🏨', passeio: '🎟️', atividade: '🎟️', transporte: '🚗', carro: '🚗', comida: '🍽️', restaurante: '🍽️' };

export default function Resumo({ ir }) {
  const { viagem, gastos, perfis, divisoes, acertos, pontos, checklist, atualizarOrcamento } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const hoje = new Date().toISOString().slice(0, 10);

  const totalBRL = gastos.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const orcamento = Number(viagem.orcamento_brl) || 0;
  const pct = orcamento > 0 ? Math.min(100, Math.round((totalBRL / orcamento) * 100)) : 0;
  const restante = orcamento - totalBRL;

  const ini = viagem.data_ida, fim = viagem.data_volta;
  const totalDias = (ini && fim) ? diff(ini, fim) + 1 : null;
  let contagem = { topo: 'Dias', grande: '—', baixo: '' };
  if (ini && hoje < ini) contagem = { topo: 'Faltam', grande: String(diff(hoje, ini)), baixo: 'dias p/ viagem' };
  else if (fim && hoje > fim) contagem = { topo: 'Viagem', grande: '✓', baixo: 'concluída' };
  else if (ini) contagem = { topo: 'Dia', grande: String(diff(ini, hoje) + 1), baixo: totalDias ? `de ${totalDias}` : 'em viagem' };

  // próximo evento do roteiro
  const ordPontos = (pontos || []).filter((p) => p.data_inicio).sort((a, b) => a.data_inicio === b.data_inicio ? (a.hora || '').localeCompare(b.hora || '') : a.data_inicio.localeCompare(b.data_inicio));
  const prox = ordPontos.find((p) => p.data_inicio >= hoje) || ordPontos[ordPontos.length - 1] || null;
  const iconDe = (t) => ICON_TIPO[(t || '').toLowerCase()] || '📍';

  // rota (por ordem) para o mini-mapa
  const rota = (pontos || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((p) => p.nome).filter(Boolean);
  const rotaShow = rota.slice(0, 5);

  // resumo de gastos por categoria
  const mapa = {};
  gastos.forEach((g) => { mapa[g.categoria] = (mapa[g.categoria] || 0) + valorEmBRL(g, cambio); });
  const cats = Object.entries(mapa).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v).slice(0, 5);
  const maxCat = cats.reduce((m, c) => Math.max(m, c.v), 0) || 1;

  // acerto + motorhome (acesso)
  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio, acertos);
  const transf = quemDeveParaQuem(saldos);
  const nomeP = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };
  const totalMH = gastos.filter((g) => CATEGORIAS_MOTORHOME.includes(g.categoria)).reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const ultimos = gastos.slice(0, 3);

  function editarOrcamento() {
    const v = window.prompt('Meta de gastos da viagem (em reais)', String(orcamento));
    if (v != null) { const n = parseFloat(v.replace(',', '.')); if (!isNaN(n) && n >= 0) atualizarOrcamento(n); }
  }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const sec = { fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ui-ink)' };
  const verTodos = { fontSize: 12.5, color: 'var(--ui-teal)', fontWeight: 600, cursor: 'pointer' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '10px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px 16px' }}>
        <div style={{ minWidth: 0 }}>
          <div onClick={() => ir('viagens')} style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}><span>🇺🇸</span>{viagem?.nome || 'Viagem EUA'}<span style={{ fontSize: 14, color: 'var(--ui-faint)', fontWeight: 600 }}>⌄</span></div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 3 }}>{ini ? `${fmtDia(ini)} → ${fmtDia(fim)}` : 'Defina as datas no roteiro'}{totalDias ? ` · ${totalDias} dias` : ''}</div>
        </div>
        <button onClick={() => ir('acerto')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-teal)', background: 'rgba(0,199,177,.12)', padding: '7px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', flex: '0 0 auto' }}>R$ {cambio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</button>
      </div>

      {/* hero com foto + funções novas */}
      <div style={{ backgroundImage: "linear-gradient(135deg, rgba(0,43,54,.88) 0%, rgba(0,43,54,.60) 52%, rgba(0,43,54,.82) 100%), url('/hero-eua.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 24, padding: 22, color: '#fff', display: 'flex', gap: 18, boxShadow: '0 14px 30px rgba(0,43,54,.30)' }}>
        <div style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>{contagem.topo}</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, margin: '4px 0 2px' }}>{contagem.grande}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>{contagem.baixo}</div>
        </div>
        <div onClick={editarOrcamento} style={{ flex: 1, minWidth: 0, borderLeft: '1px solid rgba(255,255,255,.14)', paddingLeft: 18, cursor: 'pointer' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>Total gasto</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', margin: '3px 0 2px' }}>{fmtBRL(totalBRL)}</div>
          {orcamento > 0 && <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 10 }}>de {fmtBRL(orcamento)}</div>
            <div style={{ height: 7, borderRadius: 5, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', borderRadius: 5, background: 'var(--ui-teal)' }} /></div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>{pct}% · {restante >= 0 ? `${fmtBRL(restante)} restantes` : `${fmtBRL(-restante)} acima`}</div>
          </>}
        </div>
      </div>

      {/* próximo evento */}
      {prox && (
        <div onClick={() => ir('roteiro')} style={{ ...card, marginTop: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(0,199,177,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: '0 0 auto' }}>{iconDe(prox.tipo)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--ui-muted)', marginBottom: 2 }}>Próximo evento</div>
            <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prox.nome}</div>
            <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 2 }}>{fmtDia(prox.data_inicio)}{prox.hora ? ` · ${prox.hora}` : ''}</div>
          </div>
          <span style={{ color: 'var(--ui-faint)', fontSize: 20, flex: '0 0 auto' }}>›</span>
        </div>
      )}

      {/* roteiro (mini rota) */}
      {rotaShow.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 2px 12px' }}>
            <span style={sec}>Roteiro da viagem</span>
            <span onClick={() => ir('mapa')} style={verTodos}>Ver mapa</span>
          </div>
          <div onClick={() => ir('mapa')} style={{ ...card, padding: '18px 16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {rotaShow.map((nome, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < rotaShow.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--ui-teal)', flex: '0 0 auto', boxShadow: '0 0 0 4px rgba(0,199,177,.14)' }} />
                  {i < rotaShow.length - 1 && <span style={{ flex: 1, height: 2, background: 'repeating-linear-gradient(90deg, var(--ui-line) 0 6px, transparent 6px 11px)', margin: '0 3px' }} />}
                </div>
              ))}
              {rota.length > rotaShow.length && <span style={{ fontSize: 11, color: 'var(--ui-muted)', marginLeft: 6, flex: '0 0 auto' }}>+{rota.length - rotaShow.length}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9 }}>
              {rotaShow.map((nome, i) => (
                <span key={i} style={{ fontSize: 10.5, color: 'var(--ui-muted)', flex: 1, textAlign: i === 0 ? 'left' : i === rotaShow.length - 1 ? 'right' : 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>{nome}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* resumo de gastos */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 2px 12px' }}>
        <span style={sec}>Resumo de gastos</span>
        <span onClick={() => ir('gastos')} style={verTodos}>Ver todos</span>
      </div>
      <div style={{ ...card, padding: cats.length ? '8px 16px' : 16 }}>
        {cats.length === 0 && <div style={{ fontSize: 13, color: 'var(--ui-faint)', textAlign: 'center', padding: '16px 0' }}>Nenhum gasto ainda</div>}
        {cats.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{emojiCategoria(c.id)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeCategoria(c.id)}</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, flex: '0 0 auto' }}>{fmtBRL(c.v)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'var(--ui-line)', overflow: 'hidden' }}><div style={{ width: Math.max(4, (c.v / maxCat) * 100) + '%', height: '100%', borderRadius: 4, background: 'var(--ui-teal)' }} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* a acertar */}
      <div onClick={() => ir('acerto')} style={{ ...card, marginTop: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(0,199,177,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ui-teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>A acertar</div>
          {transf.length === 0 ? <div style={{ fontSize: 14, fontWeight: 700 }}>Tudo quite ✅</div>
            : <div style={{ fontSize: 14, fontWeight: 700 }}>{nomeP(transf[0].de)} → {nomeP(transf[0].para)} · {fmtBRL(transf[0].valor)}</div>}
        </div>
        <span style={{ color: 'var(--ui-faint)', fontSize: 18 }}>›</span>
      </div>

      {/* checklist (acesso) */}
      <div onClick={() => ir('checklist')} style={{ ...card, marginTop: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(0,199,177,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>✅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>Checklist</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{(checklist || []).length > 0 ? `${(checklist || []).filter((i) => i.feito).length} de ${(checklist || []).length} prontos` : 'Montar checklist da viagem'}</div>
        </div>
        {(checklist || []).length > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ui-teal)' }}>{Math.round((checklist.filter((i) => i.feito).length / checklist.length) * 100)}%</span>}
        <span style={{ color: 'var(--ui-faint)', fontSize: 18 }}>›</span>
      </div>

      {/* motorhome (acesso) */}
      {totalMH > 0 && (
        <div onClick={() => ir('motorhome')} style={{ marginTop: 14, borderRadius: 20, padding: 16, color: '#fff', overflow: 'hidden', backgroundImage: "linear-gradient(160deg, rgba(0,43,54,.72) 0%, rgba(0,43,54,.86) 100%), url('/motorhome-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'var(--ui-shadow)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h11v8H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Motorhome</div><div style={{ fontSize: 11.5, opacity: 0.82, marginTop: 1 }}>{fmtBRL(totalMH)} no RV · ver detalhes</div></div>
          <span style={{ fontSize: 18, opacity: 0.85, flex: '0 0 auto' }}>›</span>
        </div>
      )}

      {/* últimos gastos */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 2px 12px' }}>
        <span style={sec}>Últimos gastos</span>
        <span onClick={() => ir('gastos')} style={verTodos}>Ver todos</span>
      </div>
      <div style={{ ...card, padding: '4px 16px' }}>
        {ultimos.length === 0 && <div style={{ fontSize: 13, color: 'var(--ui-faint)', textAlign: 'center', padding: '20px 0' }}>Nenhum gasto ainda</div>}
        {ultimos.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</div>
              <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>{nomeP(g.pago_por)} · {fmtDia(g.data)}</div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, flex: '0 0 auto' }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

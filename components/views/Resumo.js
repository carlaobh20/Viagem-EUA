'use client';

import { useData } from '../DataProvider';
import { calcularSaldos, calcularConsumo, quemDeveParaQuem } from '../../lib/settle';
import { valorEmBRL, fmtBRL, fmtUSD, emojiCategoria, nomeCategoria } from '../../lib/format';

const SLICE_CORES = ['#0F6E56', '#1D9E75', '#5DCAA5', '#C9E9DD'];

export default function Resumo({ ir }) {
  const { viagem, gastos, perfis, divisoes, acertos, atualizarOrcamento } = useData();
  const cambio = Number(viagem.cotacao_usd);

  const totalBRL = gastos.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const gastoReal = gastos.filter((g) => g.moeda === 'BRL').reduce((s, g) => s + Number(g.valor), 0);
  const gastoDolar = gastos.filter((g) => g.moeda === 'USD').reduce((s, g) => s + Number(g.valor), 0);
  const orcamento = Number(viagem.orcamento_brl) || 0;
  const pct = orcamento > 0 ? Math.min(100, Math.round((totalBRL / orcamento) * 100)) : 0;
  const restante = orcamento - totalBRL;

  const consumo = calcularConsumo(gastos, divisoes, perfis, cambio);
  const porPessoa = perfis
    .map((p) => ({
      ...p,
      pago: gastos.filter((g) => g.pago_por === p.id).reduce((s, g) => s + valorEmBRL(g, cambio), 0),
      gastou: consumo[p.id] || 0,
    }))
    .sort((a, b) => b.gastou - a.gastou);

  const mapa = {};
  gastos.forEach((g) => { mapa[g.categoria] = (mapa[g.categoria] || 0) + valorEmBRL(g, cambio); });
  const ordenadas = Object.entries(mapa).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  const fatias = ordenadas.slice(0, 3).map((c) => ({ nome: nomeCategoria(c.id), v: c.v }));
  const restoV = ordenadas.slice(3).reduce((s, c) => s + c.v, 0);
  if (restoV > 0) fatias.push({ nome: 'Outros', v: restoV });
  const totCat = fatias.reduce((s, f) => s + f.v, 0) || 1;

  const R = 30;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const arcos = fatias.map((f, i) => {
    const frac = f.v / totCat;
    const arco = { len: frac * C, off: -acc * C, cor: SLICE_CORES[i % SLICE_CORES.length], pct: Math.round(frac * 100), nome: f.nome };
    acc += frac;
    return arco;
  });

  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio, acertos);
  const transferencias = quemDeveParaQuem(saldos);
  const nomeP = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };

  const ultimos = gastos.slice(0, 2);

  function editarOrcamento() {
    const v = window.prompt('Quanto vocês pretendem gastar nos EUA? (meta total, em reais)', String(orcamento));
    if (v != null) { const n = parseFloat(v.replace(',', '.')); if (!isNaN(n) && n >= 0) atualizarOrcamento(n); }
  }

  return (
    <div className="screen" style={{ padding: '4px 18px 20px' }}>
      <div style={{ paddingTop: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#8A938F' }}>Total convertido</div>
          <button onClick={editarOrcamento} aria-label="Editar quanto pretende gastar" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F4F2EC', border: 'none', borderRadius: 20, padding: '5px 11px', fontSize: 11, color: '#0F6E56', cursor: 'pointer' }}>
            <span aria-hidden="true">✏️</span> Editar meta
          </button>
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.5px', margin: '2px 0 12px' }}>{fmtBRL(totalBRL)}</div>
        <div onClick={editarOrcamento} style={{ height: 7, borderRadius: 6, background: '#EFEDE6', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ width: pct + '%', height: '100%', borderRadius: 6, background: '#0F6E56' }} />
        </div>
        <div onClick={editarOrcamento} style={{ fontSize: 11, color: '#8A938F', marginTop: 6, cursor: 'pointer' }}>
          meta de {fmtBRL(orcamento)} · {pct}% usado · {restante >= 0 ? `${fmtBRL(restante)} restante` : `${fmtBRL(-restante)} acima`}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <div style={{ background: '#F4F2EC', borderRadius: 16, padding: '13px 14px' }}>
          <div style={{ fontSize: 11, color: '#8A938F' }}>Em dólar</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{fmtUSD(gastoDolar)}</div>
        </div>
        <div style={{ background: '#F4F2EC', borderRadius: 16, padding: '13px 14px' }}>
          <div style={{ fontSize: 11, color: '#8A938F' }}>Em real</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{fmtBRL(gastoReal)}</div>
        </div>
      </div>

      <div onClick={() => ir('acerto')} style={{ marginTop: 14, background: '#E1F5EE', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, background: '#0F6E56', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⇄</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#0F6E56' }}>A acertar</div>
          {transferencias.length === 0
            ? <div style={{ fontSize: 13, color: '#04342C' }}>Tudo quite por enquanto ✅</div>
            : <div style={{ fontSize: 13, color: '#04342C' }}><span style={{ fontWeight: 500 }}>{nomeP(transferencias[0].de)}</span> → <span style={{ fontWeight: 500 }}>{nomeP(transferencias[0].para)}</span></div>}
        </div>
        {transferencias.length > 0 && <div style={{ fontSize: 15, fontWeight: 500, color: '#0F6E56' }}>{fmtBRL(transferencias[0].valor)}</div>}
      </div>

      {fatias.length > 0 && (
        <div style={{ marginTop: 16, border: '0.5px solid #ECEAE3', borderRadius: 18, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Por categoria</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label="Distribuição por categoria">
              {arcos.map((a, i) => (
                <circle key={i} cx="46" cy="46" r={R} fill="none" stroke={a.cor} strokeWidth="13" strokeDasharray={`${a.len} ${C}`} strokeDashoffset={a.off} transform="rotate(-90 46 46)" />
              ))}
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {arcos.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: a.cor }} />
                  <span style={{ flex: 1, color: '#5C645F' }}>{a.nome}</span>
                  <span style={{ fontWeight: 500 }}>{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Quanto cada um gastou</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {porPessoa.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F4F2EC', borderRadius: 14, padding: '9px 11px' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: p.cor, color: '#fff', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{p.nome.slice(0, 2).toUpperCase()}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{fmtBRL(p.gastou)}</div>
                <div style={{ fontSize: 10, color: '#8A938F' }}>pagou {fmtBRL(p.pago)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => ir('roteiro')} style={{ width: '100%', textAlign: 'left', marginTop: 16, background: '#fff', border: '0.5px solid #ECEAE3', borderRadius: 16, padding: '13px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
        <span>Roteiro da viagem</span><span style={{ color: '#A7AEAA' }}>›</span>
      </button>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Últimos lançamentos</span>
          <span onClick={() => ir('gastos')} style={{ fontSize: 12, color: '#0F6E56', cursor: 'pointer' }}>ver todos ›</span>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid #ECEAE3', borderRadius: 16, padding: '2px 14px' }}>
          {ultimos.length === 0 && <div style={{ textAlign: 'center', color: '#A7AEAA', fontSize: 13, padding: '20px 0' }}>Nenhum gasto ainda. Toque no + para começar.</div>}
          {ultimos.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: i < ultimos.length - 1 ? '0.5px solid #EFEDE6' : 'none' }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: '#F4F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{emojiCategoria(g.categoria)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</div>
                <div style={{ fontSize: 11, color: '#8A938F' }}>{nomeP(g.pago_por)} · {formataData(g.data)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</div>
                {g.moeda === 'USD' && <div style={{ fontSize: 10, color: '#8A938F' }}>{fmtBRL(valorEmBRL(g, cambio))}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formataData(d) {
  if (!d) return '';
  const [, m, dia] = d.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia} ${meses[Number(m) - 1]}`;
}

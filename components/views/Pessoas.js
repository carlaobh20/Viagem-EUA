'use client';

import { useData } from '../DataProvider';
import { calcularSaldos } from '../../lib/settle';
import { paraBRL, fmtBRL } from '../../lib/format';

export default function Pessoas() {
  const { viagem, gastos, divisoes, perfis } = useData();
  const cotacao = Number(viagem.cotacao_usd);
  const saldos = calcularSaldos(gastos, divisoes, perfis, cotacao);

  const dados = perfis.map((p) => ({
    ...p,
    pago: gastos.filter((g) => g.pago_por === p.id).reduce((s, g) => s + paraBRL(g.valor, g.moeda, cotacao), 0),
    saldo: saldos[p.id] || 0,
  }));

  return (
    <div className="screen">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 16px' }}>
        Cada um lança seus gastos. O app calcula automaticamente quanto cada pessoa pagou e o saldo na divisão.
      </p>

      {dados.map((p) => {
        const s = Math.round(p.saldo);
        return (
          <div className="card" key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="avatar" style={{ background: p.cor, width: 36, height: 36, fontSize: 12 }}>
                {p.nome.slice(0, 2).toUpperCase()}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--faint)' }}>Pagou {fmtBRL(p.pago)}</div>
              </div>
              {s > 1 && <span className="badge credit">a receber {fmtBRL(s)}</span>}
              {s < -1 && <span className="badge debit">deve {fmtBRL(-s)}</span>}
              {s >= -1 && s <= 1 && <span className="badge quite">quite</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

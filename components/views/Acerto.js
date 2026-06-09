'use client';

import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { fmtBRL } from '../../lib/format';

export default function Acerto() {
  const { viagem, gastos, divisoes, perfis } = useData();
  const cotacao = Number(viagem.cotacao_usd);
  const saldos = calcularSaldos(gastos, divisoes, perfis, cotacao);
  const transferencias = quemDeveParaQuem(saldos);

  const nome = (id) => {
    const p = perfis.find((x) => x.id === id);
    return p ? p.nome : '—';
  };
  const cor = (id) => {
    const p = perfis.find((x) => x.id === id);
    return p ? p.cor : '#999';
  };

  return (
    <div className="screen">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 16px' }}>
        Quem precisa pagar quem para todo mundo ficar quite — no menor número de transferências.
      </p>

      {transferencias.length === 0 ? (
        <div className="card"><div className="empty">Tudo certo! Ninguém deve nada por enquanto. ✅</div></div>
      ) : (
        <div className="card" style={{ padding: '4px 0' }}>
          {transferencias.map((t, i) => (
            <div className="settle" key={i} style={{ borderBottom: i < transferencias.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
              <span className="avatar" style={{ background: cor(t.de), width: 28, height: 28 }}>{nome(t.de).slice(0, 2).toUpperCase()}</span>
              <span className="who">{nome(t.de)}</span>
              <span className="arrow" aria-hidden="true">→</span>
              <span className="avatar" style={{ background: cor(t.para), width: 28, height: 28 }}>{nome(t.para).slice(0, 2).toUpperCase()}</span>
              <span className="who">{nome(t.para)}</span>
              <span className="v">{fmtBRL(t.valor)}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'center', marginTop: 14 }}>
        Os valores em dólar entram convertidos pela cotação atual (R$ {cotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
      </p>
    </div>
  );
}

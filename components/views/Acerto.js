'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { fmtBRL } from '../../lib/format';
export default function Acerto() {
  const { viagem, gastos, divisoes, perfis, atualizarCotacao } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [cambioStr, setCambioStr] = useState(String(cambio).replace('.', ','));
  const temDolar = gastos.some((g) => g.moeda === 'USD');
  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio);
  const transferencias = quemDeveParaQuem(saldos);
  const nome = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };
  const cor = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.cor : '#999'; };
  function aplicar() { const n = parseFloat((cambioStr || '').replace(',', '.')); if (n > 0 && n !== cambio) atualizarCotacao(n); }
  return (
    <div className="screen">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 14px' }}>Quem precisa pagar quem para todo mundo ficar quite — tudo convertido para real.</p>
      {temDolar && (
        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Câmbio para o acerto (R$ por US$ 1)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" inputMode="decimal" value={cambioStr} onChange={(e) => setCambioStr(e.target.value)} onBlur={aplicar} onKeyDown={(e) => e.key === 'Enter' && aplicar()} placeholder="5,40" style={{ flex: 1 }} />
            <button className="btn-outline" style={{ width: 110, height: 44 }} onClick={aplicar}>Aplicar</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 8 }}>Os gastos em dólar são convertidos por esse câmbio só aqui no acerto.</p>
        </div>
      )}
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
    </div>
  );
}

'use client';

import { useData } from '../DataProvider';
import { paraBRL, fmtBRL, fmtUSD, emojiCategoria, nomeCategoria } from '../../lib/format';

export default function Resumo({ ir }) {
  const { viagem, gastos, perfis, atualizarCotacao, atualizarOrcamento } = useData();
  const cotacao = Number(viagem.cotacao_usd);

  const totalBRL = gastos.reduce((s, g) => s + paraBRL(g.valor, g.moeda, cotacao), 0);
  const gastoReal = gastos.filter((g) => g.moeda === 'BRL').reduce((s, g) => s + Number(g.valor), 0);
  const gastoDolar = gastos.filter((g) => g.moeda === 'USD').reduce((s, g) => s + Number(g.valor), 0);
  const orcamento = Number(viagem.orcamento_brl) || 0;
  const pct = orcamento > 0 ? Math.min(100, Math.round((totalBRL / orcamento) * 100)) : 0;
  const restante = orcamento - totalBRL;

  // Gasto por pessoa (pelo que cada um pagou, convertido)
  const porPessoa = perfis
    .map((p) => ({
      ...p,
      total: gastos.filter((g) => g.pago_por === p.id).reduce((s, g) => s + paraBRL(g.valor, g.moeda, cotacao), 0),
    }))
    .sort((a, b) => b.total - a.total);
  const maior = Math.max(1, ...porPessoa.map((p) => p.total));

  const ultimos = gastos.slice(0, 4);

  function editarCotacao() {
    const v = window.prompt('Quantos reais vale 1 dólar hoje?', String(cotacao));
    if (v != null) {
      const n = parseFloat(v.replace(',', '.'));
      if (!isNaN(n) && n > 0) atualizarCotacao(n);
    }
  }
  function editarOrcamento() {
    const v = window.prompt('Orçamento total da viagem (em reais)?', String(orcamento));
    if (v != null) {
      const n = parseFloat(v.replace(',', '.'));
      if (!isNaN(n) && n >= 0) atualizarOrcamento(n);
    }
  }

  return (
    <div className="screen">
      <div className="pass">
        <div className="label">Total da viagem (convertido)</div>
        <div className="total">{fmtBRL(totalBRL)}</div>
        <div className="sub" onClick={editarOrcamento} style={{ cursor: 'pointer' }}>
          de um orçamento de {fmtBRL(orcamento)} · toque para ajustar
        </div>

        <div className="budget">
          <div className="track"><div className="fill" style={{ width: pct + '%' }} /></div>
          <div className="meta">
            {pct}% usado · {restante >= 0 ? `${fmtBRL(restante)} restante` : `${fmtBRL(-restante)} acima`}
          </div>
        </div>

        <div className="perf" />
        <div className="split">
          <div className="col">
            <div className="k">Gasto em real</div>
            <div className="v">{fmtBRL(gastoReal)}</div>
          </div>
          <div className="col">
            <div className="k">Gasto em dólar</div>
            <div className="v">{fmtUSD(gastoDolar)}</div>
          </div>
          <div className="col" onClick={editarCotacao} style={{ cursor: 'pointer' }}>
            <div className="k">Cotação</div>
            <div className="v">R$ {cotacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      <div className="section-title">Gasto por pessoa</div>
      {porPessoa.map((p) => (
        <div className="person" key={p.id}>
          <span className="avatar" style={{ background: p.cor }}>{iniciais(p.nome)}</span>
          <span className="bar-wrap">
            <span className="bar"><i style={{ width: (p.total / maior) * 100 + '%', background: p.cor }} /></span>
          </span>
          <span className="val">{fmtBRL(p.total)}</span>
        </div>
      ))}

      <button className="card" style={{ width: '100%', textAlign: 'left', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => ir('roteiro')}>
        <span>Roteiro da viagem</span>
        <span style={{ color: 'var(--faint)' }}>→</span>
      </button>

      <div className="section-title">Últimos lançamentos</div>
      <div className="card">
        {ultimos.length === 0 && <div className="empty">Nenhum gasto ainda. Toque no + para começar.</div>}
        {ultimos.map((g) => (
          <div className="row" key={g.id}>
            <span className="ic" aria-hidden="true">{emojiCategoria(g.categoria)}</span>
            <span className="meta">
              <span className="t">{g.descricao || nomeCategoria(g.categoria)}</span>
              <span className="s">{nomePagador(perfis, g.pago_por)} · {formataData(g.data)}</span>
            </span>
            <span className="amt">{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function iniciais(nome = '') {
  return nome.trim().slice(0, 2).toUpperCase();
}
function nomePagador(perfis, id) {
  const p = perfis.find((x) => x.id === id);
  return p ? p.nome : '—';
}
function formataData(d) {
  if (!d) return '';
  const [a, m, dia] = d.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia} ${meses[Number(m) - 1]}`;
}

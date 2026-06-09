'use client';

import { useState } from 'react';
import { useData } from '../DataProvider';
import { valorEmBRL, fmtUSD, fmtBRL, emojiCategoria, nomeCategoria } from '../../lib/format';

export default function Gastos() {
  const { viagem, gastos, perfis, divisoes, removerGasto } = useData();
  const cotacao = Number(viagem.cotacao_usd);
  const [filtro, setFiltro] = useState('todos');
  const lista = gastos.filter((g) => filtro === 'todos' || g.moeda === filtro);

  function nomePagador(id) { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; }
  function qtd(gid) { return divisoes.filter((d) => d.gasto_id === gid).length; }

  return (
    <div className="screen">
      <div className="chips" style={{ marginBottom: 16 }}>
        {['todos', 'USD', 'BRL'].map((f) => (
          <button key={f} className={'chip' + (filtro === f ? ' on' : '')} onClick={() => setFiltro(f)}>
            {f === 'todos' ? 'Todos' : f === 'USD' ? 'Dólar' : 'Real'}
          </button>
        ))}
      </div>
      <div className="card">
        {lista.length === 0 && <div className="empty">Nenhum gasto neste filtro.</div>}
        {lista.map((g) => (
          <div className="row" key={g.id} onDoubleClick={() => confirmarRemover(g, removerGasto)}>
            <span className="ic" aria-hidden="true">{emojiCategoria(g.categoria)}</span>
            <span className="meta">
              <span className="t">{g.descricao || nomeCategoria(g.categoria)}</span>
              <span className="s">{nomePagador(g.pago_por)} · dividido entre {qtd(g.id)} · {formataData(g.data)}</span>
            </span>
            <span className="amt">{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}{g.moeda === 'USD' && <span className="conv">{fmtBRL(valorEmBRL(g, cotacao))}</span>}</span>
          </div>
        ))}
      </div>
      {lista.length > 0 && <p style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'center', marginTop: 12 }}>Toque duas vezes em um gasto para apagar.</p>}
    </div>
  );
}

function confirmarRemover(g, removerGasto) { if (window.confirm(`Apagar o gasto "${g.descricao}"?`)) removerGasto(g.id); }
function formataData(d) {
  if (!d) return '';
  const [, m, dia] = d.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia} ${meses[Number(m) - 1]}`;
}

'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { valorEmBRL, fmtUSD, fmtBRL, emojiCategoria, nomeCategoria, CATEGORIAS } from '../../lib/format';
export default function Gastos({ ir }) {
  const { viagem, gastos, perfis, divisoes, removerGasto, setGastoEditando } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [moeda, setMoeda] = useState('todos');
  const [categoria, setCategoria] = useState('todas');
  const [pessoa, setPessoa] = useState('todas');
  const lista = gastos.filter((g) =>
    (moeda === 'todos' || g.moeda === moeda) &&
    (categoria === 'todas' || g.categoria === categoria) &&
    (pessoa === 'todas' || g.pago_por === pessoa)
  );
  const totalBRL = lista.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  function nomePagador(id) { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; }
  function qtd(gid) { return divisoes.filter((d) => d.gasto_id === gid).length; }
  function apagar(g) { if (window.confirm(`Apagar o gasto "${g.descricao}"?`)) removerGasto(g.id); }
  function editar(g) { setGastoEditando(g); ir('novo'); }
  const usadas = CATEGORIAS.filter((c) => gastos.some((g) => g.categoria === c.id));
  return (
    <div className="screen">
      <div className="card" style={{ marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total {filtrado(moeda, categoria, pessoa) ? 'filtrado' : 'geral'}</div>
        <div style={{ fontSize: 28, fontWeight: 600, margin: '2px 0' }}>{fmtBRL(totalBRL)}</div>
        <div style={{ fontSize: 12, color: 'var(--faint)' }}>{lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'}</div>
      </div>
      <div className="chips" style={{ marginBottom: 10 }}>
        {['todos', 'USD', 'BRL'].map((f) => (
          <button key={f} className={'chip' + (moeda === f ? ' on' : '')} onClick={() => setMoeda(f)}>{f === 'todos' ? 'Todas moedas' : f === 'USD' ? 'Dólar' : 'Real'}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="todas">Todas as categorias</option>
          {usadas.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>))}
        </select>
        <select className="select" value={pessoa} onChange={(e) => setPessoa(e.target.value)}>
          <option value="todas">Todas as pessoas</option>
          {perfis.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
        </select>
      </div>
      <div className="card">
        {lista.length === 0 && <div className="empty">Nenhum gasto com esse filtro.</div>}
        {lista.map((g) => (
          <div className="row" key={g.id}>
            <div onClick={() => editar(g)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <span className="ic" aria-hidden="true">{emojiCategoria(g.categoria)}</span>
              <span className="meta">
                <span className="t">{g.descricao || nomeCategoria(g.categoria)}</span>
                <span className="s">{nomePagador(g.pago_por)} · dividido entre {qtd(g.id)} · {formataData(g.data)}</span>
              </span>
              <span className="amt">{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}{g.moeda === 'USD' && <span className="conv">{fmtBRL(valorEmBRL(g, cambio))}</span>}</span>
            </div>
            {g.recibo_url && <a href={g.recibo_url} target="_blank" rel="noreferrer" className="del" style={{ textDecoration: 'none' }} onClick={(e) => e.stopPropagation()} aria-label="Ver recibo">📎</a>}
            <button className="del" onClick={() => apagar(g)} aria-label="Apagar gasto">✕</button>
          </div>
        ))}
      </div>
      {lista.length > 0 && <p style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'center', marginTop: 12 }}>Toque em um gasto para editar · 📎 ver recibo · ✕ apagar.</p>}
    </div>
  );
}
function filtrado(moeda, categoria, pessoa) { return moeda !== 'todos' || categoria !== 'todas' || pessoa !== 'todas'; }
function formataData(d) { if (!d) return ''; const [, m, dia] = d.split('-'); const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']; return `${dia} ${meses[Number(m) - 1]}`; }

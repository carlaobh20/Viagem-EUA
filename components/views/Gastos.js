'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { valorEmBRL, fmtUSD, fmtBRL, emojiCategoria, nomeCategoria, CATEGORIAS } from '../../lib/format';

export default function Gastos({ ir }) {
  const { viagem, gastos, perfis, divisoes, removerGasto, setGastoEditando, urlRecibo } = useData();
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
  const temFiltro = moeda !== 'todos' || categoria !== 'todas' || pessoa !== 'todas';

  function nomePagador(id) { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; }
  function qtd(gid) { return divisoes.filter((d) => d.gasto_id === gid).length; }
  function apagar(g) { if (window.confirm(`Apagar o gasto "${g.descricao || nomeCategoria(g.categoria)}"?`)) removerGasto(g.id); }
  function editar(g) { setGastoEditando(g); ir('novo'); }
  const usadas = CATEGORIAS.filter((c) => gastos.some((g) => g.categoria === c.id));

  const selStyle = { width: '100%', background: 'var(--ui-card)', border: '1px solid var(--ui-line)', borderRadius: 13, padding: '11px 13px', fontSize: 13.5, color: 'var(--ui-ink)', appearance: 'none', WebkitAppearance: 'none', boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 16px' }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Gastos</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 2 }}>Todos os lançamentos da viagem</div>
        </div>
        <button onClick={() => ir('acerto')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-teal)', background: '#DCF7EF', padding: '7px 12px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>
          Câmbio R$ {cambio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </button>
      </div>

      {/* total */}
      <div style={{ background: 'linear-gradient(135deg,#2F6FE4 0%,#1C9FC4 55%,#12B89A 100%)', borderRadius: 22, padding: '20px', color: '#fff', boxShadow: '0 14px 30px rgba(28,120,150,.26)', marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, opacity: 0.9 }}>Total {temFiltro ? 'filtrado' : 'geral'}</div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', margin: '3px 0 2px' }}>{fmtBRL(totalBRL)}</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'}</div>
      </div>

      {/* filtro moeda */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--ui-line)', borderRadius: 14, padding: 3, marginBottom: 10 }}>
        {[['todos', 'Todas'], ['USD', 'Dólar'], ['BRL', 'Real']].map(([id, lbl]) => (
          <button key={id} onClick={() => setMoeda(id)} style={{ flex: 1, border: 'none', borderRadius: 11, padding: '8px 0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: moeda === id ? 'var(--ui-teal)' : 'transparent', color: moeda === id ? '#fff' : 'var(--ui-muted)' }}>{lbl}</button>
        ))}
      </div>

      {/* filtros categoria/pessoa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <select style={selStyle} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="todas">Todas as categorias</option>
          {usadas.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>))}
        </select>
        <select style={selStyle} value={pessoa} onChange={(e) => setPessoa(e.target.value)}>
          <option value="todas">Todas as pessoas</option>
          {perfis.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
        </select>
      </div>

      {/* lista */}
      <div style={{ background: 'var(--ui-card)', borderRadius: 18, padding: '4px 14px', boxShadow: 'var(--ui-shadow)' }}>
        {lista.length === 0 && <div style={{ fontSize: 13, color: 'var(--ui-faint)', textAlign: 'center', padding: '28px 0' }}>Nenhum gasto com esse filtro.</div>}
        {lista.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <div onClick={() => editar(g)} style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--ui-muted)', marginTop: 1 }}>{nomePagador(g.pago_por)} · entre {qtd(g.id)} · {formataData(g.data)}</span>
              </span>
              <span style={{ textAlign: 'right', flex: '0 0 auto' }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
                {g.moeda === 'USD' && <span style={{ display: 'block', fontSize: 10.5, color: 'var(--ui-faint)' }}>{fmtBRL(valorEmBRL(g, cambio))}</span>}
              </span>
            </div>
            {g.recibo_url && <button onClick={async (e) => { e.stopPropagation(); const u = await urlRecibo(g.recibo_url); if (u) window.open(u, '_blank', 'noreferrer'); else alert('Não consegui abrir o recibo.'); }} aria-label="Ver recibo" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ui-muted)', padding: '2px 4px' }}>📎</button>}
            <button onClick={() => apagar(g)} aria-label="Apagar gasto" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 16, cursor: 'pointer', padding: '2px 4px' }}>✕</button>
          </div>
        ))}
      </div>

      {lista.length > 0 && <p style={{ fontSize: 11, color: 'var(--ui-faint)', textAlign: 'center', marginTop: 12 }}>Toque num gasto para editar · 📎 recibo · ✕ apagar</p>}
    </div>
  );
}

function formataData(d) { if (!d) return ''; const [, m, dia] = d.split('-'); const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']; return `${dia} ${meses[Number(m) - 1]}`; }

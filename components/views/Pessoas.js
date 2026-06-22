'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { calcularConsumoPorMoeda } from '../../lib/settle';
import { valorEmBRL, fmtBRL, fmtUSD, emojiCategoria, nomeCategoria } from '../../lib/format';

const CAT_CORES = ['#12B8A6', '#2F6FE4', '#534AB7', '#E0A22B', '#9AE6D6', '#E84F8D', '#CBD5E1'];

export default function Pessoas() {
  const { viagem, gastos, divisoes, perfis, perfil, adicionarPessoa, atualizarNomePessoa, removerPessoa } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const cambioOk = cambio > 0;
  const [moeda, setMoeda] = useState('brl');
  const [selId, setSelId] = useState(null);

  const consumoMoeda = calcularConsumoPorMoeda(gastos, divisoes, perfis);
  const emBRL = (m) => (m.usd * cambio) + m.brl;
  const emUSD = (m) => (cambioOk ? m.usd + (m.brl / cambio) : 0);
  const pessoas = perfis
    .map((p) => { const m = consumoMoeda[p.id] || { usd: 0, brl: 0 }; return { ...p, totalBRL: emBRL(m), totalUSD: emUSD(m), ehVoce: perfil && p.id === perfil.id }; })
    .sort((a, b) => b.totalBRL - a.totalBRL);
  const grandTotal = pessoas.reduce((s, p) => s + p.totalBRL, 0) || 1;
  const maxP = pessoas.reduce((m, p) => Math.max(m, p.totalBRL), 0) || 1;
  const sel = pessoas.find((p) => p.id === selId) || pessoas.find((p) => p.ehVoce) || pessoas[0];

  // gasto da pessoa selecionada quebrado por categoria (parte dela em cada gasto)
  function catsDe(pid) {
    const m = {};
    gastos.forEach((g) => {
      const divs = divisoes.filter((d) => d.gasto_id === g.id);
      if (divs.length && divs.some((d) => d.perfil_id === pid)) {
        m[g.categoria] = (m[g.categoria] || 0) + valorEmBRL(g, cambio) / divs.length;
      }
    });
    return Object.entries(m).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  }
  const catsAll = sel ? catsDe(sel.id) : [];
  const cats = catsAll.slice(0, 4).map((c) => ({ nome: nomeCategoria(c.id), v: c.v }));
  const _resto = catsAll.slice(4).reduce((s, c) => s + c.v, 0);
  if (_resto > 0) cats.push({ nome: 'Outros', v: _resto });
  const totalSel = cats.reduce((s, c) => s + c.v, 0) || 1;
  const R = 30, C = 2 * Math.PI * R;
  let acc = 0;
  const arcos = cats.map((c, i) => { const frac = c.v / totalSel; const a = { len: frac * C, off: -acc * C, cor: CAT_CORES[i % CAT_CORES.length] }; acc += frac; return a; });
  const fmtVal = (brl) => (moeda === 'usd' && cambioOk) ? fmtUSD(brl / cambio) : fmtBRL(brl);
  const gastosSel = sel ? gastos.filter((g) => divisoes.some((d) => d.gasto_id === g.id && d.perfil_id === sel.id)) : [];
  const fmtData = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); const ms = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']; return `${dia} ${ms[Number(m)-1]}`; };

  function novaPessoa() { const nome = window.prompt('Nome da pessoa (ex.: Sogro)'); if (nome && nome.trim()) adicionarPessoa(nome); }
  function editar(p) { const nome = window.prompt('Editar nome', p.nome); if (nome && nome.trim()) atualizarNomePessoa(p.id, nome); }
  async function remover(p) { if (!window.confirm(`Remover "${p.nome}"?`)) return; const erro = await removerPessoa(p.id); if (erro) window.alert('Não dá pra remover: essa pessoa já tem gastos ligados. Apague os gastos dela primeiro.'); }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 16px' }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Gastos por pessoa</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 2 }}>Quanto cada um consumiu</div>
        </div>
        <button onClick={novaPessoa} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-teal)', background: '#DCF7EF', padding: '8px 12px', borderRadius: 20, border: 'none', cursor: 'pointer' }}>+ pessoa</button>
      </div>

      {/* toggle moeda */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--ui-line)', borderRadius: 14, padding: 3, marginBottom: 14 }}>
        {[['brl', 'R$'], ['usd', 'US$']].map(([id, lbl]) => (
          <button key={id} onClick={() => setMoeda(id)} disabled={id === 'usd' && !cambioOk} style={{ flex: 1, border: 'none', borderRadius: 11, padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: moeda === id ? 'var(--ui-teal)' : 'transparent', color: moeda === id ? '#fff' : 'var(--ui-muted)' }}>{lbl}</button>
        ))}
      </div>

      {/* cards por pessoa */}
      {pessoas.map((p) => {
        const principal = moeda === 'usd' ? fmtUSD(p.totalUSD) : fmtBRL(p.totalBRL);
        const sec = moeda === 'usd' ? fmtBRL(p.totalBRL) : (cambioOk ? fmtUSD(p.totalUSD) : null);
        const pctTot = Math.round((p.totalBRL / grandTotal) * 100);
        const ativo = sel && sel.id === p.id;
        return (
          <div key={p.id} onClick={() => setSelId(p.id)} style={{ ...card, marginBottom: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', outline: ativo ? '2px solid var(--ui-teal)' : 'none' }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: p.cor, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{p.nome.slice(0, 2).toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}{p.ehVoce && <span style={{ fontSize: 11, color: 'var(--ui-faint)', fontWeight: 400 }}> (você)</span>}</span>
                <span style={{ fontSize: 15, fontWeight: 800, flex: '0 0 auto' }}>{principal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--ui-muted)' }}>{pctTot}% do total</span>
                {sec && <span style={{ fontSize: 11, color: 'var(--ui-faint)' }}>{sec}</span>}
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'var(--ui-line)', overflow: 'hidden', marginTop: 6 }}><div style={{ width: Math.max(3, (p.totalBRL / maxP) * 100) + '%', height: '100%', borderRadius: 4, background: p.cor }} /></div>
            </div>
          </div>
        );
      })}

      {/* Detalhamento da pessoa selecionada */}
      {sel && cats.length > 0 && (
        <div style={{ ...card, marginTop: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800 }}>Detalhamento de {sel.nome}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ui-teal)' }}>{moeda === 'usd' ? fmtUSD(sel.totalUSD) : fmtBRL(sel.totalBRL)}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <svg width="92" height="92" viewBox="0 0 92 92" style={{ flex: '0 0 auto' }} role="img" aria-label="Categorias da pessoa">
              <circle cx="46" cy="46" r={R} fill="none" stroke="var(--ui-line)" strokeWidth="11" />
              {arcos.map((a, i) => (<circle key={i} cx="46" cy="46" r={R} fill="none" stroke={a.cor} strokeWidth="11" strokeDasharray={`${a.len} ${C}`} strokeDashoffset={a.off} transform="rotate(-90 46 46)" strokeLinecap="round" />))}
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              {cats.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, margin: '5px 0' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: CAT_CORES[i % CAT_CORES.length], flex: '0 0 auto' }} />
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#5b6473' }}>{c.nome}</span>
                  <span style={{ color: 'var(--ui-muted)', flex: '0 0 auto' }}>{Math.round((c.v / totalSel) * 100)}%</span>
                  <b style={{ flex: '0 0 auto', minWidth: 60, textAlign: 'right' }}>{fmtVal(c.v)}</b>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--ui-line)' }}>
            <button onClick={() => editar(sel)} style={{ border: 'none', background: 'none', color: 'var(--ui-teal)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Editar nome</button>
            {!sel.ehVoce && <button onClick={() => remover(sel)} style={{ border: 'none', background: 'none', color: '#E14B5A', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Remover</button>}
          </div>
        </div>
      )}

      {/* Gastos da pessoa selecionada */}
      {sel && gastosSel.length > 0 && (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', margin: '20px 2px 12px' }}>Gastos de {sel.nome}</div>
          <div style={{ ...card, padding: '4px 16px' }}>
            {gastosSel.slice(0, 12).map((g, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</div>
                  <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>{fmtData(g.data)}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, flex: '0 0 auto' }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{ fontSize: 11, color: 'var(--ui-faint)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>Toque numa pessoa para ver o detalhamento. "Gastos de…" mostra o valor cheio de cada despesa que ela participa.</p>
      <div style={{ textAlign: 'center', marginTop: 12 }}><button onClick={() => supabase.auth.signOut()} style={{ border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, cursor: 'pointer' }}>Sair da conta</button></div>
    </div>
  );
}

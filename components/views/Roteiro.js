'use client';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL } from '../../lib/format';
const CORES = ['#0F6E56', '#534AB7', '#BA7517', '#D4537E', '#185FA5', '#993C1D'];
export default function Roteiro({ ir }) {
  const { viagem, pontos, gastos, recarregar } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const gastoDoPonto = (id) => gastos.filter((g) => g.ponto_id === id).reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  async function adicionarParada() {
    const nome = window.prompt('Nome da parada (ex.: Orlando)'); if (!nome) return;
    const inicio = window.prompt('Data de início (AAAA-MM-DD), ou deixe em branco', '');
    await supabase.from('pontos_roteiro').insert({ viagem_id: viagem.id, nome, data_inicio: inicio || null, ordem: pontos.length });
    await recarregar();
  }
  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back"><button onClick={() => ir('resumo')} aria-label="Voltar">←</button><span className="ttl">Roteiro</span></div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Pontos de parada da viagem com o gasto de cada lugar.</p>
        {pontos.length === 0 ? (<div className="card"><div className="empty">Nenhuma parada ainda.</div></div>) : (
          <div className="timeline">
            {pontos.map((p, i) => (
              <div className="stop" key={p.id}>
                <span className="dot" style={{ background: CORES[i % CORES.length] }} />
                <div><div className="t">{p.nome}</div><div className="d">{periodo(p)}</div><div className="g">Gasto: {fmtBRL(gastoDoPonto(p.id))}</div></div>
              </div>
            ))}
          </div>
        )}
        <button className="btn-outline" style={{ marginTop: 8 }} onClick={adicionarParada}>+ Adicionar parada</button>
      </div>
    </div>
  );
}
function periodo(p) { if (!p.data_inicio) return 'sem data'; const f = (d) => { const [, m, dia] = d.split('-'); const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']; return `${dia} ${meses[Number(m) - 1]}`; }; return p.data_fim ? `${f(p.data_inicio)} – ${f(p.data_fim)}` : f(p.data_inicio); }

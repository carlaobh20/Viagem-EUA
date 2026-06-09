'use client';

import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { calcularSaldos } from '../../lib/settle';
import { valorEmBRL, fmtBRL } from '../../lib/format';

export default function Pessoas() {
  const { viagem, gastos, divisoes, perfis, perfil, adicionarPessoa, atualizarNomePessoa, removerPessoa } = useData();
  const cotacao = Number(viagem.cotacao_usd);
  const saldos = calcularSaldos(gastos, divisoes, perfis, cotacao);

  const dados = perfis.map((p) => ({
    ...p,
    pago: gastos.filter((g) => g.pago_por === p.id).reduce((s, g) => s + valorEmBRL(g, cotacao), 0),
    saldo: saldos[p.id] || 0,
    ehVoce: perfil && p.id === perfil.id,
  }));

  function novaPessoa() {
    const nome = window.prompt('Nome da pessoa (ex.: Sogro)');
    if (nome && nome.trim()) adicionarPessoa(nome);
  }
  function editar(p) {
    const nome = window.prompt('Editar nome', p.nome);
    if (nome && nome.trim()) atualizarNomePessoa(p.id, nome);
  }
  async function remover(p) {
    if (!window.confirm(`Remover "${p.nome}"?`)) return;
    const erro = await removerPessoa(p.id);
    if (erro) window.alert('Não dá pra remover: essa pessoa já tem gastos ligados a ela. Apague os gastos dela primeiro.');
  }

  return (
    <div className="screen">
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 14px' }}>
        Adicione todos que vão participar dos gastos. Cada um pode ter (ou não) login próprio.
      </p>

      <button className="btn-outline" style={{ marginBottom: 16 }} onClick={novaPessoa}>+ Adicionar pessoa</button>

      {dados.map((p) => {
        const s = Math.round(p.saldo);
        return (
          <div className="card" key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="avatar" style={{ background: p.cor, width: 36, height: 36, fontSize: 12 }}>{p.nome.slice(0, 2).toUpperCase()}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}{p.ehVoce && <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 400 }}> (você)</span>}</div>
                <div style={{ fontSize: 11, color: 'var(--faint)' }}>Pagou {fmtBRL(p.pago)}</div>
              </div>
              {s > 1 && <span className="badge credit">a receber {fmtBRL(s)}</span>}
              {s < -1 && <span className="badge debit">deve {fmtBRL(-s)}</span>}
              {s >= -1 && s <= 1 && <span className="badge quite">quite</span>}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8, paddingLeft: 47 }}>
              <button className="btn-ghost" style={{ padding: 0, fontSize: 13 }} onClick={() => editar(p)}>Editar nome</button>
              {!p.ehVoce && <button className="btn-ghost" style={{ padding: 0, fontSize: 13, color: 'var(--debit)' }} onClick={() => remover(p)}>Remover</button>}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sair da conta</button>
      </div>
    </div>
  );
}

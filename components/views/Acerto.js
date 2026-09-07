'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { fmtBRL, fmtUSD, usaDolar } from '../../lib/format';
import { PageHeader, EmptyState, Button, Reveal, SectionHeader } from '../ui';

// Acerto de contas. O que importa: "quem paga quanto pra quem" (1 bloco de destaque).
// Depois, o saldo de cada pessoa em lista; o câmbio fica discreto no fim.
// Viagem sozinha não tem com quem acertar — vira só a tela de câmbio.

const Avatar = ({ nome, cor, tam = 30 }) => (
  <span className="avatar" aria-hidden="true" style={{ background: cor, width: tam, height: tam, fontSize: tam < 30 ? 10 : 11 }}>{nome.slice(0, 2).toUpperCase()}</span>
);

export default function Acerto({ ir }) {
  const { viagem, gastos, divisoes, perfis, acertos, atualizarCotacao, registrarAcerto, removerAcerto } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const comDolar = usaDolar(viagem);
  const cambioOk = comDolar && cambio > 0;
  // Viagem sozinha não tem com quem acertar conta — some a parte de dívida
  // (transferências e histórico), fica só o câmbio (se a viagem usa dólar).
  const sozinho = (perfis || []).length <= 1;
  const [cambioStr, setCambioStr] = useState(String(cambio).replace('.', ','));
  const [buscando, setBuscando] = useState(false);
  const [cotMsg, setCotMsg] = useState('');
  async function buscarCotacao() {
    setBuscando(true); setCotMsg('');
    try {
      const r = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
      const j = await r.json();
      const bid = j && j.USDBRL && parseFloat(j.USDBRL.bid);
      if (bid > 0) { setCambioStr(bid.toFixed(4).replace('.', ',')); setCotMsg(`Dólar comercial de hoje: R$ ${bid.toFixed(4).replace('.', ',')}. Confira e toque em Aplicar.`); }
      else setCotMsg('Não consegui buscar agora. Digite à mão.');
    } catch (e) { setCotMsg('Sem internet para buscar a cotação. Digite à mão.'); }
    finally { setBuscando(false); }
  }
  const [moedaView, setMoedaView] = useState('BRL');
  const temDolar = gastos.some((g) => g.moeda === 'USD');
  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio, acertos);
  const transferencias = quemDeveParaQuem(saldos);
  const nome = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };
  const cor = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.cor : 'var(--ui-faint)'; };
  const emUSD = moedaView === 'USD' && cambioOk;
  const mostra = (valorBRL) => (emUSD ? fmtUSD(valorBRL / cambio) : fmtBRL(valorBRL));
  const totalPendente = transferencias.reduce((s, t) => s + t.valor, 0);
  function aplicar() { const n = parseFloat((cambioStr || '').replace(',', '.')); if (n > 0 && n !== cambio) atualizarCotacao(n); }
  function quitar(t) {
    const valor = emUSD ? Math.round((t.valor / cambio) * 100) / 100 : Math.round(t.valor * 100) / 100;
    const moeda = emUSD ? 'USD' : 'BRL';
    const txt = emUSD ? fmtUSD(valor) : fmtBRL(valor);
    if (window.confirm(`Confirmar que ${nome(t.de)} pagou ${txt} para ${nome(t.para)}?`)) registrarAcerto({ de: t.de, para: t.para, valor, moeda });
  }
  function desfazer(a) { if (window.confirm('Desfazer este acerto? A dívida volta a aparecer.')) removerAcerto(a.id); }

  // saldo de cada pessoa (positivo = tem a receber, negativo = deve)
  const linhasSaldo = perfis.map((p) => ({ ...p, saldo: Math.round((saldos[p.id] || 0) * 100) / 100 })).sort((a, b) => b.saldo - a.saldo);
  const subtitulo = sozinho
    ? 'Câmbio usado pra converter os gastos em dólar.'
    : transferencias.length === 0 ? 'Tudo quite entre vocês.' : `${mostra(totalPendente)} pendente${transferencias.length > 1 ? ` em ${transferencias.length} pagamentos` : ''}.`;
  const mostrarCambio = comDolar && (temDolar || emUSD || sozinho);

  return (
    <div className="ui-screen">
      <PageHeader titulo={sozinho ? 'Câmbio' : 'Acerto de contas'} subtitulo={subtitulo} onVoltar={() => ir('resumo')} />

      {comDolar && !sozinho && (
        <div className="ui-seg" role="tablist" aria-label="Moeda de exibição" style={{ width: 200, marginBottom: 14 }}>
          <button role="tab" aria-selected={moedaView === 'BRL'} className={moedaView === 'BRL' ? 'on' : ''} onClick={() => setMoedaView('BRL')}>Em real</button>
          <button role="tab" aria-selected={moedaView === 'USD'} className={moedaView === 'USD' ? 'on' : ''} onClick={() => setMoedaView('USD')} disabled={!cambioOk}>Em dólar</button>
        </div>
      )}

      {/* O que importa: quem paga quem */}
      {!sozinho && (transferencias.length === 0 ? (
        <EmptyState icone="✅" titulo="Tudo quite!" texto="Ninguém deve nada pra ninguém. Pode seguir aproveitando a viagem." />
      ) : (
        <Reveal>
          <div className="ui-card" style={{ padding: '14px 16px 6px' }}>
            <div className="ui-h2" style={{ marginBottom: 4 }}>Quem paga quem</div>
            <div className="ui-caption" style={{ marginBottom: 6 }}>As dívidas já vêm com tudo abatido — uma compra compensa a outra.</div>
            <div className="ui-list">
              {transferencias.map((t, i) => (
                <div key={i} style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Avatar nome={nome(t.de)} cor={cor(t.de)} />
                    <span className="ui-clamp1" style={{ fontSize: 14.5, fontWeight: 700, minWidth: 0, flex: '1 1 0' }}>{nome(t.de)}</span>
                    <span style={{ color: 'var(--ui-faint)', fontSize: 16, flex: '0 0 auto' }} aria-label="paga para">→</span>
                    <Avatar nome={nome(t.para)} cor={cor(t.para)} />
                    <span className="ui-clamp1" style={{ fontSize: 14.5, fontWeight: 700, minWidth: 0, flex: '1 1 0' }}>{nome(t.para)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="ui-num" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--ui-debit)', whiteSpace: 'nowrap' }}>{mostra(t.valor)}</div>
                      {emUSD && <div className="ui-caption ui-faint ui-num" style={{ whiteSpace: 'nowrap' }}>{fmtBRL(t.valor)} no câmbio atual</div>}
                    </div>
                    <Button variant="soft" onClick={() => quitar(t)} style={{ flex: '0 0 auto' }}>Marcar como pago</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      ))}

      {/* Saldo por pessoa */}
      {!sozinho && (
        <>
          <SectionHeader title="Saldo de cada um" />
          <div className="ui-card" style={{ padding: '2px 16px' }}>
            <div className="ui-list">
              {linhasSaldo.map((p) => {
                const tipo = p.saldo > 0.01 ? 'credit' : p.saldo < -0.01 ? 'debit' : 'quite';
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '8px 0' }}>
                    <Avatar nome={p.nome} cor={p.cor || 'var(--ui-faint)'} tam={34} />
                    <span className="ui-clamp1" style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700 }}>{p.nome}</span>
                    <span className={'badge ' + tipo + ' ui-num'}>
                      {tipo === 'credit' ? `recebe ${mostra(p.saldo)}` : tipo === 'debit' ? `deve ${mostra(-p.saldo)}` : 'quite'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Câmbio — discreto, no fim (é a tela toda quando a viagem é sozinha) */}
      {mostrarCambio && (
        <>
          {!sozinho && <SectionHeader title="Câmbio" />}
          <div className="ui-card-tight" style={{ padding: 14 }}>
            <label className="ui-label" htmlFor="acerto-cambio">Câmbio usado na conversão (R$ por US$ 1)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="acerto-cambio" className="ui-input ui-num" inputMode="decimal" value={cambioStr} onChange={(e) => setCambioStr(e.target.value)} onBlur={aplicar} onKeyDown={(e) => e.key === 'Enter' && aplicar()} placeholder="5,40" style={{ flex: 1, minWidth: 0 }} />
              <Button variant="secondary" onClick={aplicar} style={{ flex: '0 0 auto' }}>Aplicar</Button>
            </div>
            <Button variant="ghost" onClick={buscarCotacao} disabled={buscando} style={{ marginTop: 6, padding: '0 4px' }}>{buscando ? 'Buscando…' : '↻ Buscar cotação de hoje'}</Button>
            {cotMsg && <div className="ui-caption" style={{ marginTop: 2 }}>{cotMsg}</div>}
          </div>
        </>
      )}

      {/* Sozinho e viagem só em real: não tem câmbio nem acerto pra mostrar */}
      {sozinho && !mostrarCambio && (
        <EmptyState icone="🧑‍🤝‍🧑" titulo="Só você na viagem por enquanto." texto="O acerto de contas aparece quando tem mais gente dividindo os gastos." cta="Ver pessoas" onCta={() => ir('pessoas')} />
      )}

      {/* Histórico */}
      {!sozinho && acertos && acertos.length > 0 && (
        <>
          <SectionHeader title="Histórico de acertos" />
          <div className="ui-card" style={{ padding: '2px 16px' }}>
            <div className="ui-list">
              {acertos.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '4px 0' }}>
                  <span className="ui-clamp1" style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>{nome(a.de)} → {nome(a.para)}</span>
                  <span className="ui-num" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{a.moeda === 'USD' ? fmtUSD(a.valor) : fmtBRL(a.valor)}</span>
                  <button className="ui-btn ui-btn-ghost ui-btn-sm" style={{ color: 'var(--ui-debit)', minHeight: 44, padding: '0 6px' }} onClick={() => desfazer(a)}>desfazer</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

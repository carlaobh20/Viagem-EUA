'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { fmtBRL, fmtUSD } from '../../lib/format';
export default function Acerto({ ir }) {
  const { viagem, gastos, divisoes, perfis, acertos, atualizarCotacao, registrarAcerto, removerAcerto } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const cambioOk = cambio > 0;
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
  const cor = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.cor : '#999'; };
  const emUSD = moedaView === 'USD' && cambioOk;
  const mostra = (valorBRL) => (emUSD ? fmtUSD(valorBRL / cambio) : fmtBRL(valorBRL));
  function aplicar() { const n = parseFloat((cambioStr || '').replace(',', '.')); if (n > 0 && n !== cambio) atualizarCotacao(n); }
  function quitar(t) {
    const valor = emUSD ? Math.round((t.valor / cambio) * 100) / 100 : Math.round(t.valor * 100) / 100;
    const moeda = emUSD ? 'USD' : 'BRL';
    const txt = emUSD ? fmtUSD(valor) : fmtBRL(valor);
    if (window.confirm(`Confirmar que ${nome(t.de)} pagou ${txt} para ${nome(t.para)}?`)) registrarAcerto({ de: t.de, para: t.para, valor, moeda });
  }
  function desfazer(a) { if (window.confirm('Desfazer este acerto? A dívida volta a aparecer.')) removerAcerto(a.id); }
  return (
    <div className="screen" style={{ paddingTop: 18 }}>
      <div className="fab-back"><button onClick={() => ir('resumo')} aria-label="Voltar">←</button><span className="ttl">Acerto</span></div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 14px' }}>Quem precisa pagar quem para todo mundo ficar quite. As dívidas já vêm com tudo abatido (uma compra compensa a outra).</p>

      <div className="toggle" style={{ width: 170, marginBottom: 14 }}>
        <button className={moedaView === 'BRL' ? 'on' : ''} onClick={() => setMoedaView('BRL')}>Em real</button>
        <button className={moedaView === 'USD' ? 'on' : ''} onClick={() => setMoedaView('USD')} disabled={!cambioOk}>Em dólar</button>
      </div>

      {(temDolar || emUSD) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Câmbio usado na conversão (R$ por US$ 1)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" inputMode="decimal" value={cambioStr} onChange={(e) => setCambioStr(e.target.value)} onBlur={aplicar} onKeyDown={(e) => e.key === 'Enter' && aplicar()} placeholder="5,40" style={{ flex: 1 }} />
            <button className="btn-outline" style={{ width: 110, height: 44 }} onClick={aplicar}>Aplicar</button>
          </div>
          <button className="btn-ghost" style={{ marginTop: 8, fontSize: 13 }} onClick={buscarCotacao} disabled={buscando}>{buscando ? 'Buscando…' : '↻ Buscar cotação de hoje'}</button>
          {cotMsg && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{cotMsg}</div>}
        </div>
      )}

      {transferencias.length === 0 ? (
        <div className="card"><div className="empty">Tudo quite! Ninguém deve nada. ✅</div></div>
      ) : (
        <div className="card" style={{ padding: '4px 0' }}>
          {transferencias.map((t, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: i < transferencias.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="avatar" style={{ background: cor(t.de), width: 28, height: 28 }}>{nome(t.de).slice(0, 2).toUpperCase()}</span>
                <span style={{ fontSize: 14 }}>{nome(t.de)}</span>
                <span style={{ color: 'var(--faint)', fontSize: 18 }} aria-hidden="true">→</span>
                <span className="avatar" style={{ background: cor(t.para), width: 28, height: 28 }}>{nome(t.para).slice(0, 2).toUpperCase()}</span>
                <span style={{ fontSize: 14 }}>{nome(t.para)}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{mostra(t.valor)}</span>
              </div>
              {emUSD && <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{fmtBRL(t.valor)} no câmbio atual</div>}
              <button className="btn-outline" style={{ height: 38, marginTop: 10 }} onClick={() => quitar(t)}>Marcar como pago {emUSD ? 'em dólar' : 'em real'}</button>
            </div>
          ))}
        </div>
      )}

      {acertos && acertos.length > 0 && (
        <>
          <div className="section-title">Histórico de acertos</div>
          <div className="card" style={{ padding: '4px 0' }}>
            {acertos.map((a, i) => (
              <div className="settle" key={a.id} style={{ borderBottom: i < acertos.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                <span style={{ fontSize: 13 }}>{nome(a.de)} → {nome(a.para)}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600 }}>{a.moeda === 'USD' ? fmtUSD(a.valor) : fmtBRL(a.valor)}</span>
                  <button className="btn-ghost" style={{ padding: 0, fontSize: 12, color: 'var(--debit)' }} onClick={() => desfazer(a)}>desfazer</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

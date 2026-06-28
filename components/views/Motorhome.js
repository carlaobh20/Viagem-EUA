'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL, fmtUSD, nomeCategoria, emojiCategoria, CATEGORIAS_MOTORHOME } from '../../lib/format';

const CORES = ['#BA7517', '#0F6E56', '#534AB7', '#185FA5', '#1D9E75', '#D4537E', '#993C1D', '#5F5E5A'];

// ===== Mercado (lista de suprimentos do motorhome) =====
// Os itens ficam na tabela checklist_itens com tema 'Mercado' (não aparecem na tela Checklist,
// que só mostra os 5 temas de viagem). A categoria do item vai no campo "prazo".
const MERCADO_CATS = [
  ['comida', '🍎', 'Comida'],
  ['bebida', '🥤', 'Bebidas'],
  ['cozinha', '🍳', 'Cozinha'],
  ['limpeza', '🧽', 'Limpeza'],
  ['higiene', '🧴', 'Higiene'],
  ['outros', '📦', 'Outros'],
];
const MERCADO_LABEL = Object.fromEntries(MERCADO_CATS.map(([id, , l]) => [id, l]));
const MERCADO_EMOJI = Object.fromEntries(MERCADO_CATS.map(([id, e]) => [id, e]));
const SUGESTOES = {
  comida: ['Pão', 'Ovos', 'Café', 'Leite', 'Frutas', 'Arroz', 'Macarrão', 'Carne', 'Frango', 'Queijo', 'Manteiga', 'Snacks'],
  bebida: ['Água', 'Refrigerante', 'Cerveja', 'Suco', 'Gelo'],
  cozinha: ['Papel toalha', 'Sacos de lixo', 'Papel alumínio', 'Isqueiro', 'Filtro de café', 'Guardanapo'],
  limpeza: ['Detergente', 'Esponja', 'Desinfetante', 'Pano', 'Álcool'],
  higiene: ['Papel higiênico', 'Sabonete', 'Shampoo', 'Pasta de dente', 'Protetor solar', 'Repelente'],
  outros: ['Pilhas', 'Carvão', 'Toalha', 'Lanterna'],
};

function fmtData(d) {
  if (!d) return '';
  const [, m, dia] = d.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia} ${meses[Number(m) - 1]}`;
}

export default function Motorhome({ ir }) {
  const {
    viagem, gastos, pontos, perfis, recarregar, registrosKm, adicionarKm, removerKm,
    checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist,
  } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const [km, setKm] = useState(null); // null = calculando; 0 = sem trecho de carro
  const [moeda, setMoeda] = useState('brl'); // 'brl' | 'usd'
  const [aba, setAba] = useState('custos'); // 'custos' | 'mercado'
  const cambioOk = cambio > 0;
  const fmtMoeda = (brl) => (moeda === 'usd' && cambioOk) ? fmtUSD(brl / cambio) : fmtBRL(brl);
  const MI = 1.60934;
  const [unKm, setUnKm] = useState('km');
  const [kmForm, setKmForm] = useState(null);
  const kmReal = (registrosKm || []).reduce((s, r) => s + Number(r.km || 0), 0);
  async function salvarKm() {
    const v = parseFloat((kmForm.valor || '').replace(',', '.'));
    if (!(v > 0)) { window.alert('Informe a distância.'); return; }
    const km = kmForm.unidade === 'mi' ? v * MI : v;
    await adicionarKm({ km, valorOrigem: v, unidade: kmForm.unidade, data: kmForm.data, origem: (kmForm.origem || '').trim(), destino: (kmForm.destino || '').trim(), nota: (kmForm.nota || '').trim() });
    setKmForm(null);
  }
  const [editPeriodo, setEditPeriodo] = useState(false);
  const [dRet, setDRet] = useState('');
  const [dEnt, setDEnt] = useState('');

  // ----- estado do Mercado -----
  const [novoMerc, setNovoMerc] = useState(null); // null ou { texto, cat }
  const itensMerc = (checklist || []).filter((i) => i.tema === 'Mercado');
  const mercFeitos = itensMerc.filter((i) => i.feito).length;
  const mercPct = itensMerc.length > 0 ? Math.round((mercFeitos / itensMerc.length) * 100) : 0;
  function addMercado(texto, cat) {
    const t = (texto || '').trim();
    if (!t) return;
    const existe = itensMerc.some((i) => (i.texto || '').toLowerCase() === t.toLowerCase());
    if (existe) return;
    adicionarChecklist({ texto: t, tema: 'Mercado', prazo: cat || 'outros', ordem: itensMerc.length });
  }
  function salvarNovoMerc() {
    if (!novoMerc || !novoMerc.texto.trim()) { setNovoMerc(null); return; }
    addMercado(novoMerc.texto, novoMerc.cat);
    setNovoMerc({ texto: '', cat: novoMerc.cat });
  }
  function limparComprados() {
    if (!window.confirm('Remover todos os itens já comprados da lista?')) return;
    itensMerc.filter((i) => i.feito).forEach((i) => removerChecklist(i.id));
  }

  const nomeP = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };

  const gastosMH = gastos.filter((g) => CATEGORIAS_MOTORHOME.includes(g.categoria));
  const totalMH = gastosMH.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const combustivelMH = gastos.filter((g) => g.categoria === 'combustivel').reduce((s, g) => s + valorEmBRL(g, cambio), 0);

  const hojeISO = new Date().toISOString().slice(0, 10);
  const ida = viagem.data_ida;
  let diasViagem = 1;
  if (ida) {
    const d = Math.floor((new Date((hojeISO < ida ? ida : hojeISO) + 'T00:00:00') - new Date(ida + 'T00:00:00')) / 86400000) + 1;
    diasViagem = Math.max(1, d);
  }
  // Período do motorhome: se retirada e entrega estão definidas, é a base certa do custo/dia
  const ret = viagem.mh_retirada, ent = viagem.mh_entrega;
  const diasRV = (ret && ent && ent >= ret)
    ? Math.floor((new Date(ent + 'T00:00:00') - new Date(ret + 'T00:00:00')) / 86400000) + 1
    : null;
  const diasBase = diasRV || diasViagem;
  const custoDia = totalMH / diasBase;

  function abrirPeriodo() { setDRet(viagem.mh_retirada || ''); setDEnt(viagem.mh_entrega || ''); setEditPeriodo(true); }
  async function salvarPeriodo() {
    if (dRet && dEnt && dEnt < dRet) { window.alert('A entrega não pode ser antes da retirada.'); return; }
    await supabase.from('viagens').update({ mh_retirada: dRet || null, mh_entrega: dEnt || null }).eq('id', viagem.id);
    setEditPeriodo(false);
    await recarregar();
  }
  function fmtDiaCurto(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][dt.getMonth()];
    return `${String(dt.getDate()).padStart(2, '0')} ${m}`;
  }

  // quebra por categoria
  const porCat = {};
  gastosMH.forEach((g) => { porCat[g.categoria] = (porCat[g.categoria] || 0) + valorEmBRL(g, cambio); });
  const quebra = Object.entries(porCat).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v);
  const maxV = quebra.length ? quebra[0].v : 1;

  // custo por km: soma só trechos de CARRO (OSRM) entre paradas localizadas
  useEffect(() => {
    let cancel = false;
    const loc = [...pontos]
      .filter((p) => p.lat != null && p.lng != null)
      .sort((a, b) => {
        const da = a.data_inicio || '9999-12-31', db = b.data_inicio || '9999-12-31';
        if (da !== db) return da < db ? -1 : 1;
        return (a.ordem || 0) - (b.ordem || 0);
      });
    if (loc.length < 2) { setKm(0); return; }
    (async () => {
      let total = 0;
      for (let i = 0; i < loc.length - 1; i++) {
        const a = loc[i], b = loc[i + 1];
        try {
          const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`);
          const j = await r.json();
          if (j.routes && j.routes[0]) total += j.routes[0].distance / 1000; // só soma trecho com estrada (voo falha e é ignorado)
        } catch (e) { /* ignora trecho sem estrada */ }
      }
      if (!cancel) setKm(Math.round(total));
    })();
    return () => { cancel = true; };
  }, [pontos]);

  const kmUsado = kmReal > 0 ? kmReal : (km || 0);
  const kmFonte = kmReal > 0 ? 'diário' : (km && km > 0 ? 'estimativa do roteiro' : null);
  const kmExib = unKm === 'mi' ? kmUsado / MI : kmUsado;
  const custoKm = kmUsado > 0 ? totalMH / kmExib : null;
  const recentes = [...gastosMH].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 8);

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back">
          <button onClick={() => ir('resumo')} aria-label="Voltar">←</button>
          <span className="ttl">🚐 Motorhome</span>
          {aba === 'custos' && totalMH > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#EFEDE6', borderRadius: 20, padding: 3, flex: '0 0 auto' }}>
              {[['brl', 'R$'], ['usd', 'US$']].map(([id, lbl]) => (
                <button key={id} onClick={() => setMoeda(id)} disabled={id === 'usd' && !cambioOk}
                  style={{ border: 'none', borderRadius: 16, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: moeda === id ? 'var(--brand)' : 'transparent', color: moeda === id ? '#fff' : 'var(--muted)' }}>{lbl}</button>
              ))}
            </div>
          )}
        </div>

        {/* abas Custos / Mercado */}
        <div style={{ display: 'flex', gap: 4, background: '#EFEDE6', borderRadius: 16, padding: 3, marginBottom: 14 }}>
          {[['custos', '💵 Custos'], ['mercado', '🛒 Mercado']].map(([id, lbl]) => (
            <button key={id} onClick={() => setAba(id)}
              style={{ flex: 1, border: 'none', borderRadius: 13, padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: aba === id ? 'var(--brand)' : 'transparent', color: aba === id ? '#fff' : 'var(--muted)' }}>{lbl}</button>
          ))}
        </div>

        {aba === 'custos' && (<>
        {editPeriodo ? (
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Período do motorhome</div>
            <div className="field"><label>Retirada</label><input className="input" type="date" value={dRet} onChange={(e) => setDRet(e.target.value)} /></div>
            <div className="field"><label>Entrega</label><input className="input" type="date" value={dEnt} onChange={(e) => setDEnt(e.target.value)} /></div>
            <button className="btn-primary" onClick={salvarPeriodo}>Salvar período</button>
            <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setEditPeriodo(false)}>Cancelar</button>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>📅</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--faint)' }}>Período do motorhome</div>
              {diasRV ? (
                <div style={{ fontSize: 14, fontWeight: 600 }}>{fmtDiaCurto(ret)} → {fmtDiaCurto(ent)} · {diasRV} {diasRV === 1 ? 'dia' : 'dias'}</div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>defina retirada e entrega para o custo/dia exato</div>
              )}
            </div>
            <button className="btn-ghost" style={{ padding: '4px 6px', fontSize: 13 }} onClick={abrirPeriodo}>{diasRV ? 'editar' : 'definir'}</button>
          </div>
        )}

        {totalMH === 0 ? (
          <div className="card">
            <div className="empty">Nenhum gasto de motorhome ainda. Lance um gasto no “+” com uma categoria de RV (combustível, camping, supermercado…) que ele aparece aqui.</div>
            <button className="btn-outline" onClick={() => ir('novo')}>Lançar um gasto</button>
          </div>
        ) : (
          <>
            {/* tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 14, padding: '12px 13px', boxShadow: '0 2px 10px rgba(27,42,47,.05)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>{fmtMoeda(totalMH)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Total motorhome</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 14, padding: '12px 13px', boxShadow: '0 2px 10px rgba(27,42,47,.05)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>{fmtMoeda(custoDia)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Por dia · {diasBase} {diasBase === 1 ? 'dia' : 'dias'}{diasRV ? ' de RV' : ''}</div>
              </div>
              <div style={{ background: 'var(--gold-soft)', borderRadius: 14, padding: '12px 13px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--gold)' }}>{fmtMoeda(combustivelMH)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Combustível</div>
              </div>
              {custoKm != null ? (
                <div style={{ background: 'var(--surface)', border: '0.5px solid var(--line)', borderRadius: 14, padding: '12px 13px', boxShadow: '0 2px 10px rgba(27,42,47,.05)' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>{fmtMoeda(custoKm)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Por {unKm} · {kmExib.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} {unKm} ({kmFonte})</div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg)', border: '0.5px dashed var(--line-strong)', borderRadius: 14, padding: '12px 13px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.4 }}>
                    {km === null ? 'Calculando…' : 'Custo por km aparece quando você registrar KM no diário (ou localizar paradas no Roteiro).'}
                  </div>
                </div>
              )}
            </div>

            {/* quebra por categoria */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600, marginBottom: 4 }}>Por categoria</div>
              {quebra.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? '0.5px solid var(--line)' : 'none' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>{emojiCategoria(c.id)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nomeCategoria(c.id)}</div>
                    <div style={{ height: 6, borderRadius: 5, background: '#EDEAE2', overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: Math.max(4, (c.v / maxV) * 100) + '%', height: '100%', borderRadius: 5, background: CORES[i % CORES.length] }} />
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoeda(c.v)}</div>
                </div>
              ))}
            </div>

            {/* lançamentos de motorhome */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600, marginBottom: 2 }}>Lançamentos de motorhome</div>
              {recentes.map((g, i) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderTop: i > 0 ? '0.5px solid var(--line)' : 'none' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{nomeP(g.pago_por)} · {fmtData(g.data)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</div>
                    {g.moeda === 'USD' && <div style={{ fontSize: 10, color: 'var(--faint)' }}>{fmtBRL(valorEmBRL(g, cambio))}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Diário de KM */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>Diário de KM</span>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg)', borderRadius: 12, padding: 2 }}>
                  {[['km', 'km'], ['mi', 'mi']].map(([id, l]) => (
                    <button key={id} onClick={() => setUnKm(id)} style={{ border: 'none', borderRadius: 10, padding: '3px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: unKm === id ? 'var(--brand)' : 'transparent', color: unKm === id ? '#fff' : 'var(--muted)' }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{kmExib.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{unKm} rodados</span></div>
              {kmReal > 0
                ? <div style={{ fontSize: 11, color: 'var(--brand)', marginTop: 2 }}>o custo por km usa este total (real)</div>
                : <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>sem registros ainda — o custo por km usa a estimativa do roteiro</div>}

              {registrosKm.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '0.5px solid var(--line)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{Number(r.valor_origem ?? r.km).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {r.unidade || 'km'}{(r.origem || r.destino) ? ` · ${r.origem || '?'} → ${r.destino || '?'}` : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmtData(r.data)}{r.nota ? ` · ${r.nota}` : ''}</div>
                  </div>
                  <button onClick={() => { if (window.confirm('Apagar este registro de KM?')) removerKm(r.id); }} aria-label="Apagar" style={{ border: 'none', background: 'none', color: 'var(--faint)', fontSize: 15, cursor: 'pointer' }}>✕</button>
                </div>
              ))}

              {kmForm ? (
                <div style={{ borderTop: '0.5px solid var(--line)', marginTop: 8, paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="input" inputMode="decimal" value={kmForm.valor} onChange={(e) => setKmForm({ ...kmForm, valor: e.target.value })} placeholder="Distância" style={{ flex: 1 }} />
                    <select className="select" value={kmForm.unidade} onChange={(e) => setKmForm({ ...kmForm, unidade: e.target.value })} style={{ width: 84 }}><option value="km">km</option><option value="mi">mi</option></select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="input" value={kmForm.origem} onChange={(e) => setKmForm({ ...kmForm, origem: e.target.value })} placeholder="De" style={{ flex: 1 }} />
                    <input className="input" value={kmForm.destino} onChange={(e) => setKmForm({ ...kmForm, destino: e.target.value })} placeholder="Para" style={{ flex: 1 }} />
                  </div>
                  <input className="input" type="date" value={kmForm.data} onChange={(e) => setKmForm({ ...kmForm, data: e.target.value })} style={{ marginBottom: 8 }} />
                  <input className="input" value={kmForm.nota} onChange={(e) => setKmForm({ ...kmForm, nota: e.target.value })} placeholder="Nota (ex.: desvio Grand Canyon)" style={{ marginBottom: 8 }} />
                  <button className="btn-primary" onClick={salvarKm}>Adicionar trecho</button>
                  <button className="btn-ghost" style={{ width: '100%', marginTop: 6 }} onClick={() => setKmForm(null)}>Cancelar</button>
                </div>
              ) : (
                <button className="btn-outline" style={{ marginTop: 10 }} onClick={() => setKmForm({ valor: '', unidade: unKm, origem: '', destino: '', data: new Date().toISOString().slice(0, 10), nota: '' })}>+ registrar KM</button>
              )}
            </div>

            <p style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.5, padding: '0 4px' }}>
              Estes são os mesmos gastos da viagem, filtrados pelas categorias de RV. Lance e racha no “+” de sempre — aqui é só a visão de quanto o motorhome está custando.
            </p>
          </>
        )}
        </>)}

        {aba === 'mercado' && (<>
          {/* progresso do carrinho */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{mercFeitos} de {itensMerc.length} no carrinho</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>{mercPct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: mercPct + '%', height: '100%', borderRadius: 5, background: 'var(--brand)', transition: 'width .3s' }} />
            </div>
            {mercFeitos > 0 && (
              <button className="btn-ghost" style={{ width: '100%', marginTop: 8, fontSize: 12.5 }} onClick={limparComprados}>Remover {mercFeitos} comprado{mercFeitos === 1 ? '' : 's'}</button>
            )}
          </div>

          {/* seções por categoria */}
          {MERCADO_CATS.map(([catId]) => {
            const lista = itensMerc.filter((i) => (i.prazo || 'outros') === catId);
            if (lista.length === 0) return null;
            return (
              <div key={catId} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 8px' }}>
                  <span style={{ fontSize: 15 }}>{MERCADO_EMOJI[catId]}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{MERCADO_LABEL[catId]}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>{lista.filter((i) => i.feito).length}/{lista.length}</span>
                </div>
                <div className="card" style={{ padding: '2px 14px' }}>
                  {lista.map((it, idx) => (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: idx > 0 ? '0.5px solid var(--line)' : 'none' }}>
                      <button onClick={() => alternarChecklist(it.id, !it.feito)} aria-label="Marcar" style={{ width: 24, height: 24, borderRadius: '50%', flex: '0 0 auto', cursor: 'pointer', border: it.feito ? 'none' : '2px solid var(--line-strong)', background: it.feito ? 'var(--brand)' : 'transparent', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.feito ? '✓' : ''}</button>
                      <span onClick={() => { const t = window.prompt('Editar item', it.texto); if (t && t.trim()) editarChecklist(it.id, t.trim()); }} style={{ flex: 1, minWidth: 0, fontSize: 14, cursor: 'text', textDecoration: it.feito ? 'line-through' : 'none', color: it.feito ? 'var(--faint)' : 'inherit' }}>{it.texto}</span>
                      <button onClick={() => removerChecklist(it.id)} aria-label="Apagar" style={{ border: 'none', background: 'none', color: 'var(--faint)', fontSize: 14, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {itensMerc.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 13, marginBottom: 14 }}>
              Lista vazia. Toque nas sugestões abaixo ou adicione um item.
            </div>
          )}

          {/* adicionar item manual */}
          {novoMerc ? (
            <div className="card" style={{ marginBottom: 14 }}>
              <input autoFocus className="input" value={novoMerc.texto} onChange={(e) => setNovoMerc({ ...novoMerc, texto: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarNovoMerc()} placeholder="O que comprar?" style={{ marginBottom: 9 }} />
              <select className="select" value={novoMerc.cat} onChange={(e) => setNovoMerc({ ...novoMerc, cat: e.target.value })} style={{ width: '100%', marginBottom: 10 }}>
                {MERCADO_CATS.map(([id, e, l]) => <option key={id} value={id}>{e} {l}</option>)}
              </select>
              <button className="btn-primary" onClick={salvarNovoMerc}>Adicionar</button>
              <button className="btn-ghost" style={{ width: '100%', marginTop: 6 }} onClick={() => setNovoMerc(null)}>Fechar</button>
            </div>
          ) : (
            <button className="btn-outline" style={{ marginBottom: 14 }} onClick={() => setNovoMerc({ texto: '', cat: 'comida' })}>+ Adicionar item</button>
          )}

          {/* sugestões rápidas */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600, margin: '0 2px 8px' }}>Sugestões — toque para adicionar</div>
            {MERCADO_CATS.map(([catId, emoji, label]) => {
              const naLista = new Set(itensMerc.map((i) => (i.texto || '').toLowerCase()));
              const chips = (SUGESTOES[catId] || []).filter((s) => !naLista.has(s.toLowerCase()));
              if (chips.length === 0) return null;
              return (
                <div key={catId} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', margin: '0 2px 6px' }}>{emoji} {label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {chips.map((s) => (
                      <button key={s} onClick={() => addMercado(s, catId)} style={{ border: '0.5px solid var(--line-strong)', background: 'var(--surface)', borderRadius: 16, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>+ {s}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.5, padding: '0 4px' }}>
            A lista é compartilhada com todo mundo da viagem e sincroniza em tempo real. Marque o item quando colocar no carrinho.
          </p>
        </>)}
      </div>
    </div>
  );
}

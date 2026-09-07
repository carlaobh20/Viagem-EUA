'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import ReservasRV from './ReservasRV';
import { supabase } from '../../lib/supabaseClient';
import { valorEmBRL, fmtBRL, fmtUSD, nomeCategoria, emojiCategoria, CATEGORIAS_MOTORHOME, hojeLocal, usaDolar } from '../../lib/format';
import { PageHeader, Segmented, EmptyState, Button, Field, Reveal, Expand, SectionHeader, ProgressBar } from '../ui';

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

const ABAS = [
  { id: 'custos', label: '💵 Custos' },
  { id: 'rvparks', label: '🏕️ RV Parks' },
  { id: 'mercado', label: '🛒 Mercado' },
];
const MI = 1.60934;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function fmtData(d) {
  if (!d) return '';
  const [, m, dia] = d.split('-');
  return `${dia} ${MESES[Number(m) - 1]}`;
}
function fmtDiaCurto(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return `${String(dt.getDate()).padStart(2, '0')} ${MESES[dt.getMonth()]}`;
}
const fmtNum = (n, dec = 0) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: dec });

// Pedaços visuais fora do componente da tela: definidos lá dentro, o React
// trataria como componente novo a cada render e os campos perderiam o foco.

// Segmentado pequeno (R$/US$, km/mi) — mesmo desenho do .ui-seg, só que compacto.
function MiniSeg({ opcoes, valor, onChange }) {
  return (
    <div className="ui-seg" style={{ padding: 2, gap: 2, borderRadius: 10 }}>
      {opcoes.map(([id, lbl, desabilitado]) => (
        <button key={id} onClick={() => onChange(id)} disabled={!!desabilitado} className={valor === id ? 'on' : ''}
          style={{ minHeight: 32, padding: '0 11px', fontSize: 12, borderRadius: 8, opacity: desabilitado ? 0.4 : 1 }}>{lbl}</button>
      ))}
    </div>
  );
}

// Célula de estatística do resumo (rótulo em cima, número embaixo).
function Stat({ label, valor, tom }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ui-caption ui-clamp1" style={{ fontSize: 11, fontWeight: 600 }}>{label}</div>
      <div className="ui-num ui-clamp1" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', marginTop: 2, color: tom || 'var(--ui-ink)' }}>{valor}</div>
    </div>
  );
}

export default function Motorhome({ ir, abaInicial }) {
  const {
    viagem, gastos, pontos, perfis, recarregar, registrosKm, adicionarKm, removerKm,
    checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist,
  } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const comDolar = usaDolar(viagem);
  const [km, setKm] = useState(null); // null = calculando; 0 = sem trecho de carro
  const [moeda, setMoeda] = useState('brl'); // 'brl' | 'usd'
  const [aba, setAba] = useState(abaInicial || 'custos'); // 'custos' | 'rvparks' | 'mercado' (abaInicial vem do Menu → Reservas RV Park)
  const cambioOk = comDolar && cambio > 0;
  const fmtMoeda = (brl) => (moeda === 'usd' && cambioOk) ? fmtUSD(brl / cambio) : fmtBRL(brl);
  const [unKm, setUnKm] = useState('km');
  const [kmForm, setKmForm] = useState(null);
  const [kmErro, setKmErro] = useState('');
  const kmReal = (registrosKm || []).reduce((s, r) => s + Number(r.km || 0), 0);
  async function salvarKm() {
    const v = parseFloat((kmForm.valor || '').replace(',', '.'));
    if (!(v > 0)) { setKmErro('Informe a distância rodada.'); return; }
    setKmErro('');
    const kmV = kmForm.unidade === 'mi' ? v * MI : v;
    await adicionarKm({ km: kmV, valorOrigem: v, unidade: kmForm.unidade, data: kmForm.data, origem: (kmForm.origem || '').trim(), destino: (kmForm.destino || '').trim(), nota: (kmForm.nota || '').trim() });
    setKmForm(null);
  }
  const [editPeriodo, setEditPeriodo] = useState(false);
  const [dRet, setDRet] = useState('');
  const [dEnt, setDEnt] = useState('');
  const [periodoErro, setPeriodoErro] = useState('');

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

  const hojeISO = hojeLocal();
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

  function abrirPeriodo() { setDRet(viagem.mh_retirada || ''); setDEnt(viagem.mh_entrega || ''); setPeriodoErro(''); setEditPeriodo(true); }
  async function salvarPeriodo() {
    if (dRet && dEnt && dEnt < dRet) { setPeriodoErro('A entrega não pode ser antes da retirada.'); return; }
    setPeriodoErro('');
    await supabase.from('viagens').update({ mh_retirada: dRet || null, mh_entrega: dEnt || null }).eq('id', viagem.id);
    setEditPeriodo(false);
    await recarregar();
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

  // Subtítulo do cabeçalho: período + km — o contexto que vale pra qualquer aba.
  const txtPeriodo = diasRV ? `${fmtDiaCurto(ret)} → ${fmtDiaCurto(ent)} · ${diasRV} ${diasRV === 1 ? 'dia' : 'dias'}` : 'Período ainda não definido';
  const txtKm = km === null && kmReal === 0 ? 'calculando km…' : kmUsado > 0 ? `${fmtNum(kmExib)} ${unKm} rodados` : 'sem km ainda';

  // Linha do período do motorhome (aparece no resumo e no estado vazio).
  const linhaPeriodo = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '8px 0' }}>
        <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--ui-teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>📅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ui-caption">Período do motorhome</div>
          {diasRV
            ? <div style={{ fontSize: 14.5, fontWeight: 700 }}>{fmtDiaCurto(ret)} → {fmtDiaCurto(ent)} <span className="ui-muted" style={{ fontWeight: 500 }}>· {diasRV} {diasRV === 1 ? 'dia' : 'dias'}</span></div>
            : <div style={{ fontSize: 13.5, color: 'var(--ui-muted)' }}>Defina retirada e entrega pro custo por dia certo</div>}
        </div>
        {!editPeriodo && <Button variant={diasRV ? 'ghost' : 'soft'} size="sm" onClick={abrirPeriodo}>{diasRV ? 'Editar' : 'Definir'}</Button>}
      </div>
      <Expand aberto={editPeriodo}>
        <div style={{ padding: '6px 0 4px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Retirada" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={dRet} onChange={(e) => setDRet(e.target.value)} /></Field>
            <Field label="Entrega" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={dEnt} onChange={(e) => setDEnt(e.target.value)} /></Field>
          </div>
          {periodoErro && <div className="ui-error">{periodoErro}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setEditPeriodo(false)} style={{ flex: 1 }}>Cancelar</Button>
            <Button onClick={salvarPeriodo} style={{ flex: 2 }}>Salvar período</Button>
          </div>
        </div>
      </Expand>
    </div>
  );

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="🚐 Motorhome"
        subtitulo={`${txtPeriodo} · ${txtKm}`}
        onVoltar={() => ir('resumo')}
        acao={comDolar && aba === 'custos' && totalMH > 0 ? <MiniSeg opcoes={[['brl', 'R$'], ['usd', 'US$', !cambioOk]]} valor={moeda} onChange={setMoeda} /> : null}
      />

      {/* abas Custos / RV Parks / Mercado */}
      <Segmented opcoes={ABAS} valor={aba} onChange={setAba} style={{ marginBottom: 16 }} />

      {aba === 'custos' && (
        <Reveal key="custos">
          {totalMH === 0 ? (
            <>
              <EmptyState icone="🚐" titulo="Nenhum gasto de motorhome ainda." texto="Lance um gasto no “+” com uma categoria de RV (combustível, camping, supermercado…) e ele aparece aqui." cta="Lançar um gasto" onCta={() => ir('novo')} />
              <div className="ui-card" style={{ padding: '4px 16px', marginTop: 12 }}>{linhaPeriodo}</div>
            </>
          ) : (
            <>
              {/* resumo: 1 destaque (total) + 3 números de apoio + período */}
              <div className="ui-card" style={{ padding: '18px 16px 4px' }}>
                <div className="ui-section" style={{ margin: '0 0 4px' }}><span>Total motorhome</span></div>
                <div className="ui-num" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 }}>{fmtMoeda(totalMH)}</div>
                <div className="ui-caption" style={{ marginTop: 3 }}>em {diasBase} {diasBase === 1 ? 'dia' : 'dias'}{diasRV ? ' de motorhome' : ' de viagem'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ui-line)' }}>
                  <Stat label="Por dia" valor={fmtMoeda(custoDia)} />
                  <Stat label="Combustível" valor={fmtMoeda(combustivelMH)} tom="var(--ui-gold)" />
                  <Stat label={`Por ${unKm}`} valor={custoKm != null ? fmtMoeda(custoKm) : (km === null && kmReal === 0 ? '…' : '—')} />
                </div>
                {custoKm == null && km !== null && (
                  <div className="ui-hint" style={{ marginTop: 6 }}>O custo por km aparece quando você registrar km no diário ou localizar paradas no Roteiro.</div>
                )}
                <div style={{ borderTop: '1px solid var(--ui-line)', marginTop: 12 }}>{linhaPeriodo}</div>
              </div>

              {/* quebra por categoria */}
              <SectionHeader title="Por categoria" />
              <div className="ui-card" style={{ padding: '4px 16px' }}>
                {quebra.map((c) => (
                  <div key={c.id} className="row" style={{ minHeight: 52 }}>
                    <span className="ic" style={{ width: 34, height: 34, fontSize: 16 }}>{emojiCategoria(c.id)}</span>
                    <div className="meta">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700 }}>{nomeCategoria(c.id)}</span>
                        <span className="ui-num" style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtMoeda(c.v)}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 5, background: 'var(--ui-line)', overflow: 'hidden', marginTop: 6 }}>
                        <div className="v3-bar-fill" style={{ width: Math.max(4, (c.v / maxV) * 100) + '%', height: '100%', borderRadius: 5, background: 'var(--ui-teal)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* lançamentos de motorhome */}
              <SectionHeader title="Últimos lançamentos" />
              <div className="ui-card" style={{ padding: '2px 16px' }}>
                {recentes.map((g) => (
                  <div key={g.id} className="row" style={{ minHeight: 52, padding: '9px 0' }}>
                    <span className="ic" style={{ width: 34, height: 34, fontSize: 16 }}>{emojiCategoria(g.categoria)}</span>
                    <div className="meta">
                      <div className="t ui-clamp1">{g.descricao || nomeCategoria(g.categoria)}</div>
                      <div className="s">{nomeP(g.pago_por)} · {fmtData(g.data)}</div>
                    </div>
                    <div className="amt">
                      {g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}
                      {g.moeda === 'USD' && <span className="conv">{fmtBRL(valorEmBRL(g, cambio))}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Diário de KM */}
              <SectionHeader title="Diário de km" />
              <div className="ui-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="ui-num" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px' }}>{fmtNum(kmExib)} <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ui-muted)', letterSpacing: 0 }}>{unKm} rodados</span></div>
                    <div className="ui-caption" style={{ marginTop: 2, color: kmReal > 0 ? 'var(--ui-teal-ink)' : 'var(--ui-faint)' }}>
                      {kmReal > 0 ? 'Total real — é o que vale pro custo por km' : 'Sem registros — usando a estimativa do roteiro'}
                    </div>
                  </div>
                  <MiniSeg opcoes={[['km', 'km'], ['mi', 'mi']]} valor={unKm} onChange={setUnKm} />
                </div>

                {registrosKm.length > 0 && (
                  <div className="ui-list" style={{ marginTop: 10, borderTop: '1px solid var(--ui-line)' }}>
                    {registrosKm.map((r) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '6px 0' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ui-wrap" style={{ fontSize: 14.5, fontWeight: 700 }}><span className="ui-num">{fmtNum(r.valor_origem ?? r.km, 1)} {r.unidade || 'km'}</span>{(r.origem || r.destino) ? <span style={{ fontWeight: 500, color: 'var(--ui-muted)' }}> · {r.origem || '?'} → {r.destino || '?'}</span> : null}</div>
                          <div className="ui-caption">{fmtData(r.data)}{r.nota ? ` · ${r.nota}` : ''}</div>
                        </div>
                        <button className="ui-iconbtn" onClick={() => { if (window.confirm('Apagar este registro de KM?')) removerKm(r.id); }} aria-label="Apagar" style={{ width: 40, height: 40, background: 'transparent', color: 'var(--ui-faint)', fontSize: 15 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <Expand aberto={!!kmForm}>
                  {kmForm && (
                    <div style={{ borderTop: '1px solid var(--ui-line)', marginTop: 10, paddingTop: 14 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Field label="Distância" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" inputMode="decimal" autoFocus value={kmForm.valor} onChange={(e) => setKmForm({ ...kmForm, valor: e.target.value })} placeholder="Ex.: 320" /></Field>
                        <Field label="Unidade" style={{ width: 96 }}><select className="ui-input" value={kmForm.unidade} onChange={(e) => setKmForm({ ...kmForm, unidade: e.target.value })}><option value="km">km</option><option value="mi">mi</option></select></Field>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Field label="De" opcional style={{ flex: 1, minWidth: 0 }}><input className="ui-input" value={kmForm.origem} onChange={(e) => setKmForm({ ...kmForm, origem: e.target.value })} placeholder="Orlando" /></Field>
                        <Field label="Para" opcional style={{ flex: 1, minWidth: 0 }}><input className="ui-input" value={kmForm.destino} onChange={(e) => setKmForm({ ...kmForm, destino: e.target.value })} placeholder="Miami" /></Field>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Field label="Data" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={kmForm.data} onChange={(e) => setKmForm({ ...kmForm, data: e.target.value })} /></Field>
                        <Field label="Nota" opcional style={{ flex: 1.4, minWidth: 0 }}><input className="ui-input" value={kmForm.nota} onChange={(e) => setKmForm({ ...kmForm, nota: e.target.value })} placeholder="desvio Grand Canyon" /></Field>
                      </div>
                      {kmErro && <div className="ui-error">{kmErro}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" onClick={() => { setKmForm(null); setKmErro(''); }} style={{ flex: 1 }}>Cancelar</Button>
                        <Button onClick={salvarKm} style={{ flex: 2 }}>Adicionar trecho</Button>
                      </div>
                    </div>
                  )}
                </Expand>
                {!kmForm && (
                  <Button variant="soft" full style={{ marginTop: 12 }} onClick={() => { setKmErro(''); setKmForm({ valor: '', unidade: unKm, origem: '', destino: '', data: hojeLocal(), nota: '' }); }}>+ Registrar km</Button>
                )}
              </div>

              <p className="ui-caption" style={{ color: 'var(--ui-faint)', marginTop: 16, padding: '0 4px', lineHeight: 1.5 }}>
                Estes são os mesmos gastos da viagem, filtrados pelas categorias de RV. Lance e racha no “+” de sempre — aqui é só a visão de quanto o motorhome está custando.
              </p>
            </>
          )}
        </Reveal>
      )}

      {aba === 'rvparks' && <Reveal key="rvparks"><ReservasRV /></Reveal>}

      {aba === 'mercado' && (
        <Reveal key="mercado">
          {itensMerc.length === 0 ? (
            <EmptyState icone="🛒" titulo="Sua lista de mercado está vazia." texto="Toque nas sugestões abaixo ou adicione o primeiro item — todo mundo da viagem vê a lista." cta="Adicionar item" onCta={() => setNovoMerc({ texto: '', cat: 'comida' })} />
          ) : (
            /* progresso do carrinho: o único destaque da aba */
            <div className="ui-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span className="ui-h2">{mercFeitos} de {itensMerc.length} no carrinho</span>
                <span className="ui-num" style={{ fontSize: 18, fontWeight: 800, color: mercPct === 100 ? 'var(--ui-credit)' : 'var(--ui-teal-ink)' }}>{mercPct}%</span>
              </div>
              <ProgressBar pct={mercPct} fillColor={mercPct === 100 ? 'var(--ui-credit)' : 'var(--ui-teal)'} height={8} />
              {mercFeitos > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <Button variant="ghost" size="sm" onClick={limparComprados} style={{ color: 'var(--ui-muted)' }}>Remover {mercFeitos} comprado{mercFeitos === 1 ? '' : 's'}</Button>
                </div>
              )}
            </div>
          )}

          {/* seções por categoria */}
          {MERCADO_CATS.map(([catId]) => {
            const lista = itensMerc.filter((i) => (i.prazo || 'outros') === catId);
            if (lista.length === 0) return null;
            const feitos = lista.filter((i) => i.feito).length;
            return (
              <div key={catId}>
                <div className="ui-section" style={{ margin: '20px 4px 8px' }}>
                  <span>{MERCADO_EMOJI[catId]} {MERCADO_LABEL[catId]}</span>
                  <span className="ui-num" style={{ fontWeight: 600, color: feitos === lista.length ? 'var(--ui-credit)' : 'var(--ui-faint)', letterSpacing: 0 }}>{feitos}/{lista.length}</span>
                </div>
                <div className="ui-card ui-list" style={{ padding: '2px 16px' }}>
                  {lista.map((it) => (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50 }}>
                      <button onClick={() => alternarChecklist(it.id, !it.feito)} aria-label={it.feito ? 'Desmarcar' : 'Marcar como no carrinho'} className="ui-press" style={{ width: 44, height: 44, marginLeft: -10, flex: '0 0 auto', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', border: it.feito ? 'none' : '2px solid var(--ui-line-strong)', background: it.feito ? 'var(--ui-teal)' : 'transparent', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s ease' }}>{it.feito ? '✓' : ''}</span>
                      </button>
                      <span onClick={() => { const t = window.prompt('Editar item', it.texto); if (t && t.trim()) editarChecklist(it.id, t.trim()); }} className="ui-wrap" style={{ flex: 1, fontSize: 14.5, fontWeight: it.feito ? 500 : 600, cursor: 'text', textDecoration: it.feito ? 'line-through' : 'none', color: it.feito ? 'var(--ui-faint)' : 'inherit' }}>{it.texto}</span>
                      <button onClick={() => removerChecklist(it.id)} aria-label="Apagar" style={{ width: 40, height: 40, marginRight: -8, border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 14, flex: '0 0 auto', borderRadius: 10 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* adicionar item manual */}
          <div style={{ marginTop: 16 }}>
            <Expand aberto={!!novoMerc}>
              {novoMerc && (
                <div className="ui-card" style={{ padding: 16, marginBottom: 12 }}>
                  <Field label="O que comprar?"><input autoFocus className="ui-input" value={novoMerc.texto} onChange={(e) => setNovoMerc({ ...novoMerc, texto: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarNovoMerc()} placeholder="Ex.: Leite" /></Field>
                  <Field label="Categoria">
                    <select className="ui-input" value={novoMerc.cat} onChange={(e) => setNovoMerc({ ...novoMerc, cat: e.target.value })}>
                      {MERCADO_CATS.map(([id, e, l]) => <option key={id} value={id}>{e} {l}</option>)}
                    </select>
                  </Field>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" onClick={() => setNovoMerc(null)} style={{ flex: 1 }}>Fechar</Button>
                    <Button onClick={salvarNovoMerc} style={{ flex: 2 }}>Adicionar</Button>
                  </div>
                </div>
              )}
            </Expand>
            {!novoMerc && itensMerc.length > 0 && (
              <Button variant="soft" full onClick={() => setNovoMerc({ texto: '', cat: 'comida' })}>+ Adicionar item</Button>
            )}
          </div>

          {/* sugestões rápidas */}
          <SectionHeader title="Sugestões · toque pra adicionar" />
          {MERCADO_CATS.map(([catId, emoji, label]) => {
            const naLista = new Set(itensMerc.map((i) => (i.texto || '').toLowerCase()));
            const chips = (SUGESTOES[catId] || []).filter((s) => !naLista.has(s.toLowerCase()));
            if (chips.length === 0) return null;
            return (
              <div key={catId} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ui-muted)', margin: '0 2px 6px' }}>{emoji} {label}</div>
                <div className="chips">
                  {chips.map((s) => (
                    <button key={s} className="chip ui-press" onClick={() => addMercado(s, catId)}>+ {s}</button>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="ui-caption" style={{ color: 'var(--ui-faint)', marginTop: 8, padding: '0 4px', lineHeight: 1.5 }}>
            A lista é compartilhada com todo mundo da viagem e sincroniza em tempo real. Marque o item quando colocar no carrinho.
          </p>
        </Reveal>
      )}
    </div>
  );
}

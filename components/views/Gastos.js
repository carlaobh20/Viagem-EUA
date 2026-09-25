'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { valorEmBRL, fmtUSD, fmtBRL, emojiCategoria, nomeCategoria, CATEGORIAS, usaDolar, hojeLocal } from '../../lib/format';
import { PageHeader, EmptyState, Segmented, Reveal, Expand } from '../ui';

// Lista de gastos da viagem. Hierarquia: total do período/filtro em destaque,
// filtros em chips, uma linha limpa por gasto (emoji · descrição · quem pagou · data · valor).
// Toque na linha edita; 📎 abre o comprovante; ✕ apaga.

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function formataData(d) { if (!d) return ''; const [, m, dia] = String(d).split('-'); return `${dia} ${MESES[Number(m) - 1]}`; }

// filtro por moeda do LANÇAMENTO (não confundir com a moeda em que a tela mostra)
const MOEDAS = [{ id: 'todos', label: 'Todas' }, { id: 'USD', label: 'Pagas em US$' }, { id: 'BRL', label: 'Pagas em R$' }];

// Roxo fixo dos nomes de quem racha — cartão cheio, igual pro grupo todo, pra
// bater o olho e ver na hora que a compra foi dividida (e com quem).
const ROXO_RACHA = '#534AB7';

// Nome da pessoa num cartãozinho pintado: "pago" usa a cor da pessoa (a mesma de
// Pessoas e do Acerto); "racha" usa o roxo do grupo.
function PessoaPill({ nome, cor, solido }) {
  const c = cor || 'var(--ui-faint)';
  if (solido) {
    return <span className="ui-clamp1" style={{ display: 'inline-block', maxWidth: 120, background: c, color: '#fff', fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, verticalAlign: 'middle' }}>{nome}</span>;
  }
  return (
    <span className="ui-clamp1" style={{ display: 'inline-block', maxWidth: 120, background: ROXO_RACHA, color: '#fff', fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, verticalAlign: 'middle' }}>{nome}</span>
  );
}

// Bloco de destaque (fica fora do componente pra não remontar a cada render)
const HERO = {
  backgroundImage: "linear-gradient(135deg, rgba(0,43,54,.90) 0%, rgba(0,43,54,.66) 52%, rgba(0,43,54,.86) 100%), url('/hero-eua.jpg')",
  backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 24, padding: '20px 20px 18px', color: '#fff',
  boxShadow: 'var(--ui-shadow-raised)', marginBottom: 14, overflow: 'hidden',
};

export default function Gastos({ ir }) {
  const { viagem, gastos, perfis, divisoes, removerGasto, setGastoEditando, urlRecibo } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const comDolar = usaDolar(viagem);
  const [moeda, setMoeda] = useState('todos');
  // Moeda em que os valores aparecem. Viagem em dólar abre SEMPRE em dólar — é a
  // moeda do bolso na estrada; quem quiser ver em real troca no botão do topo.
  const podeUSD = comDolar && cambio > 0;
  const [ver, setVer] = useState('USD');
  const verUSD = ver === 'USD' && podeUSD;
  const mostra = (vBRL) => (verUSD ? fmtUSD(vBRL / cambio) : fmtBRL(vBRL));
  const [categoria, setCategoria] = useState('todas');
  const [pessoa, setPessoa] = useState('todas');
  const [aviso, setAviso] = useState('');   // mensagem inline (ex.: comprovante que não abriu)
  const [fechados, setFechados] = useState(null); // grupos recolhidos (null = ainda não mexeu, usa o padrão)

  const lista = gastos
    .filter((g) =>
      (moeda === 'todos' || g.moeda === moeda) &&
      (categoria === 'todas' || g.categoria === categoria) &&
      (pessoa === 'todas' || g.pago_por === pessoa)
    )
    // Compra mais recente primeiro. No mesmo dia, o último lançamento fica em cima.
    .sort((a, b) => {
      const porData = String(b.data || '').localeCompare(String(a.data || ''));
      if (porData) return porData;
      return String(b.criado_em || '').localeCompare(String(a.criado_em || ''));
    });
  const totalBRL = lista.reduce((s, g) => s + valorEmBRL(g, cambio), 0);

  // ----- Antes / Durante / Depois da viagem -----
  // A preparação (passagem, visto, seguro) é uma conversa; o dinheiro do dia a dia
  // na estrada é outra. Separa em blocos, e o bloco do momento abre sozinho.
  const ida = viagem.data_ida, volta = viagem.data_volta;
  const temDatas = Boolean(ida && volta);
  const hojeS = hojeLocal();
  const faseDe = (g) => {
    if (!temDatas || !g.data) return 'durante';
    if (g.data < ida) return 'antes';
    if (g.data > volta) return 'depois';
    return 'durante';
  };
  const emViagem = temDatas && hojeS >= ida;
  const DEFS = [
    { id: 'antes', titulo: 'Antes da viagem', dica: 'preparação' },
    { id: 'durante', titulo: 'Durante a viagem', dica: 'na estrada' },
    { id: 'depois', titulo: 'Depois da viagem', dica: 'ficou pra trás' },
  ];
  // ordem fixa: o dinheiro da estrada em cima, a preparação embaixo
  const ordem = ['durante', 'antes', 'depois'];
  const grupos = ordem
    .map((id) => {
      const def = DEFS.find((d) => d.id === id);
      const itens = lista.filter((g) => faseDe(g) === id);
      return { ...def, itens, total: itens.reduce((acc, g) => acc + valorEmBRL(g, cambio), 0) };
    })
    .filter((gr) => gr.itens.length > 0);
  const agrupar = temDatas && grupos.length > 1;
  // padrão: começa aberto o bloco do momento (durante, se a viagem já começou;
  // antes, se ainda não) — e se esse bloco não existir, o primeiro da lista.
  const doMomento = emViagem ? 'durante' : 'antes';
  const abreSozinho = grupos.some((gr) => gr.id === doMomento) ? doMomento : (grupos[0] ? grupos[0].id : null);
  const fechadoPadrao = (id) => id !== abreSozinho;
  const estaFechado = (id, i) => (fechados ? fechados.has(id) : fechadoPadrao(id, i));
  const alternarGrupo = (id, i) => setFechados((prev) => {
    const base = prev || new Set(grupos.filter((gr) => fechadoPadrao(gr.id)).map((gr) => gr.id));
    const n = new Set(base);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const temFiltro = moeda !== 'todos' || categoria !== 'todas' || pessoa !== 'todas';
  const nenhumGasto = gastos.length === 0;

  function nomePagador(id) { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; }
  // Quem LANÇOU o gasto no app (o login usado), que pode ser diferente de quem pagou:
  // a Elza pode registrar uma compra do Wilson. Só mostramos quando são pessoas
  // diferentes — no caso normal (cada um lança o próprio) não polui a linha.
  function nomeQuemLancou(g) {
    if (!g.user_id) return '';
    const dono = perfis.find((x) => x.user_id === g.user_id);
    if (!dono || dono.id === g.pago_por) return '';
    return dono.nome;
  }
  function corPessoa(id) { const p = perfis.find((x) => x.id === id); return p ? p.cor : null; }
  // quem racha o gasto, na ordem em que as pessoas aparecem na viagem
  function quemRacha(gid) {
    const ids = divisoes.filter((d) => d.gasto_id === gid).map((d) => d.perfil_id);
    return perfis.filter((p) => ids.includes(p.id));
  }
  function apagar(g) { if (window.confirm(`Apagar o gasto "${g.descricao || nomeCategoria(g.categoria)}"?`)) removerGasto(g.id); }
  function editar(g) { setGastoEditando(g); ir('novo'); }
  function limparFiltros() { setMoeda('todos'); setCategoria('todas'); setPessoa('todas'); }
  async function abrirRecibo(e, g) {
    e.stopPropagation();
    setAviso('');
    const u = await urlRecibo(g.recibo_url);
    if (u) window.open(u, '_blank', 'noreferrer'); else setAviso('Não consegui abrir o comprovante agora. Tenta de novo daqui a pouco.');
  }
  // A linha de um gasto (usada pelos blocos Antes/Durante e pela lista sem datas).
  function linhaGasto(g) {
                    const racha = quemRacha(g.id);
                    const vBRL = valorEmBRL(g, cambio);
                    const moedaIgual = (verUSD && g.moeda === 'USD') || (!verUSD && g.moeda !== 'USD');
                    const original = g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor);
                    return (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => editar(g)} className="ui-rowbtn" style={{ flex: 1, minWidth: 0, gap: 11 }} aria-label={`Editar ${g.descricao || nomeCategoria(g.categoria)}`}>
                          <span className="ui-sunken" aria-hidden="true" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span className="ui-clamp1" style={{ display: 'block', fontSize: 14.5, fontWeight: 700 }}>{g.privado ? '🔒 ' : ''}{g.descricao || nomeCategoria(g.categoria)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              <PessoaPill nome={nomePagador(g.pago_por)} cor={corPessoa(g.pago_por)} solido />
                              <span className="ui-caption" style={{ whiteSpace: 'nowrap' }}>pagou · {formataData(g.data)}</span>
                            </span>
                            {racha.length > 0 ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                                <span className="ui-caption" style={{ whiteSpace: 'nowrap' }}>{racha.length > 1 ? 'racha:' : 'para:'}</span>
                                {racha.map((p) => <PessoaPill key={p.id} nome={p.nome} cor={p.cor} />)}
                              </span>
                            ) : (
                              <span className="ui-caption ui-faint" style={{ display: 'block', marginTop: 3 }}>divisão não informada</span>
                            )}
                            {nomeQuemLancou(g) ? (
                              <span className="ui-caption ui-clamp1" style={{ display: 'block', color: 'var(--ui-faint)', marginTop: 2 }}>✎ lançado por {nomeQuemLancou(g)}</span>
                            ) : null}
                          </span>
                          <span style={{ textAlign: 'right', flex: '0 0 auto', paddingLeft: 6 }}>
                            <span className="ui-num" style={{ display: 'block', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{mostra(vBRL)}</span>
                            {podeUSD && (
                              <span className="ui-num ui-faint" style={{ display: 'block', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap' }}>
                                {moedaIgual ? (verUSD ? fmtBRL(vBRL) : fmtUSD(vBRL / cambio)) : `pago ${original}`}
                              </span>
                            )}
                          </span>
                        </button>
                        {g.recibo_url && (
                          <button onClick={(e) => abrirRecibo(e, g)} aria-label="Ver comprovante" title="Ver comprovante" className="ui-press" style={{ border: 'none', background: 'var(--ui-teal-soft)', color: 'var(--ui-teal-ink)', borderRadius: 10, width: 36, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>📎</button>
                        )}
                        <button onClick={() => apagar(g)} aria-label="Apagar gasto" title="Apagar" className="ui-press" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', borderRadius: 10, width: 34, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>✕</button>
                      </div>
    );
  }

  const usadas = CATEGORIAS.filter((c) => gastos.some((g) => g.categoria === c.id));
  const nLanc = `${lista.length} ${lista.length === 1 ? 'lançamento' : 'lançamentos'}`;

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="Gastos"
        subtitulo={nenhumGasto ? 'Todos os lançamentos da viagem' : `${gastos.length} ${gastos.length === 1 ? 'lançamento' : 'lançamentos'} · ${viagem?.nome || 'viagem'}`}
        onVoltar={() => ir('menu')}
        acao={
          <button onClick={() => ir('pessoas')} aria-label="Pessoas da viagem" title="Pessoas" className="ui-iconbtn raised ui-press">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </button>
        }
      />

      {nenhumGasto ? (
        <EmptyState
          icone="🧾"
          titulo="Nenhum gasto ainda."
          texto="Lança o primeiro e a divisão entre a família já começa a ser calculada."
          cta="Lançar gasto"
          onCta={() => ir('novo')}
        />
      ) : (
        <>
          {/* O que importa agora: total (geral ou do filtro) */}
          <Reveal>
            <div style={HERO}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,.62)' }}>
                {temFiltro ? 'Total do filtro' : 'Total da viagem'}
              </div>
              <div className="ui-num ui-wrap" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1, margin: '4px 0 6px' }}>{mostra(totalBRL)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.66)' }}>
                  {nLanc}{podeUSD ? ` · ≈ ${verUSD ? fmtBRL(totalBRL) : fmtUSD(totalBRL / cambio)}` : ''}
                </span>
                {podeUSD && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
                    {/* moeda em que a tela mostra os valores — começa em US$ */}
                    <div role="group" aria-label="Moeda mostrada" style={{ display: 'flex', background: 'rgba(255,255,255,.14)', borderRadius: 999, padding: 2 }}>
                      {[{ id: 'USD', t: 'US$' }, { id: 'BRL', t: 'R$' }].map((m) => (
                        <button key={m.id} onClick={() => setVer(m.id)} aria-pressed={ver === m.id} className="ui-press" style={{
                          border: 'none', borderRadius: 999, minHeight: 28, padding: '0 11px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
                          background: ver === m.id ? '#fff' : 'transparent', color: ver === m.id ? 'var(--ui-dark)' : 'rgba(255,255,255,.8)',
                        }}>{m.t}</button>
                      ))}
                    </div>
                    <button onClick={() => ir('acerto')} className="ui-press" style={{ border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.12)', color: '#fff', borderRadius: 999, minHeight: 32, padding: '0 11px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Câmbio {cambio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Filtros */}
          {comDolar && <Segmented opcoes={MOEDAS} valor={moeda} onChange={setMoeda} style={{ marginBottom: 8 }} />}
          {usadas.length > 1 && (
            <div className="ui-chips-scroll" role="tablist" aria-label="Filtrar por categoria">
              <button role="tab" aria-selected={categoria === 'todas'} className={'ui-chipbtn' + (categoria === 'todas' ? ' on' : '')} onClick={() => setCategoria('todas')}>Todas</button>
              {usadas.map((c) => (
                <button key={c.id} role="tab" aria-selected={categoria === c.id} className={'ui-chipbtn' + (categoria === c.id ? ' on' : '')} onClick={() => setCategoria(c.id)}>{c.emoji} {c.nome}</button>
              ))}
            </div>
          )}
          {perfis.length > 1 && (
            <div className="ui-chips-scroll" role="tablist" aria-label="Filtrar por quem pagou">
              <button role="tab" aria-selected={pessoa === 'todas'} className={'ui-chipbtn' + (pessoa === 'todas' ? ' on' : '')} onClick={() => setPessoa('todas')}>Todo mundo</button>
              {perfis.map((p) => (
                <button key={p.id} role="tab" aria-selected={pessoa === p.id} className={'ui-chipbtn' + (pessoa === p.id ? ' on' : '')} onClick={() => setPessoa(p.id)}>{p.nome}</button>
              ))}
            </div>
          )}
          {temFiltro && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '0 0 6px' }}>
              <button className="ui-btn ui-btn-ghost ui-btn-sm" onClick={limparFiltros}>Limpar filtros</button>
            </div>
          )}

          {aviso && <div className="ui-error" role="alert">{aviso}</div>}

          {/* Lista: uma linha por gasto */}
          {lista.length === 0 ? (
            <EmptyState compacto icone="🔎" titulo="Nada com esse filtro." texto="Tenta outra categoria, pessoa ou moeda." cta="Limpar filtros" onCta={limparFiltros} />
          ) : (
            <Reveal delay={0.05}>
              {agrupar ? grupos.map((gr, i) => {
                const fechado = estaFechado(gr.id, i);
                return (
                  <div key={gr.id} style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => alternarGrupo(gr.id, i)}
                      aria-expanded={!fechado}
                      className="ui-press"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 'none', background: 'transparent', padding: '8px 4px', textAlign: 'left', minHeight: 48 }}
                    >
                      <span className="ui-section" style={{ margin: 0, display: 'block', flex: '0 0 auto' }}>{gr.titulo}</span>
                      <span className="ui-caption ui-faint" style={{ flex: 1, minWidth: 0 }}>{gr.itens.length}</span>
                      <span className="ui-num" style={{ fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{mostra(gr.total)}</span>
                      <span aria-hidden="true" style={{ color: 'var(--ui-faint)', fontSize: 13, width: 16, textAlign: 'center', transform: fechado ? 'none' : 'rotate(180deg)', transition: 'transform .18s ease' }}>▾</span>
                    </button>
                    <Expand aberto={!fechado}>
                      <div className="ui-card" style={{ padding: '2px 8px 2px 14px' }}>
                        <div className="ui-list">{gr.itens.map(linhaGasto)}</div>
                      </div>
                    </Expand>
                  </div>
                );
              }) : (
                <div className="ui-card" style={{ padding: '2px 8px 2px 14px' }}>
                  <div className="ui-list">{lista.map(linhaGasto)}</div>
                </div>
              )}
              <p className="ui-caption ui-faint" style={{ textAlign: 'center', marginTop: 12 }}>Toque num gasto pra editar · 📎 abre o comprovante · ✕ apaga</p>
            </Reveal>
          )}
        </>
      )}
    </div>
  );
}

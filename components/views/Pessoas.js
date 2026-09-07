'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { calcularConsumoPorMoeda } from '../../lib/settle';
import { valorEmBRL, fmtBRL, fmtUSD, emojiCategoria, nomeCategoria, usaDolar } from '../../lib/format';
import { PageHeader, EmptyState, Button, Field, Reveal, Expand, SectionHeader } from '../ui';

// Pessoas da viagem: quem está junto e quanto cada um consumiu. Lista limpa,
// adicionar pessoa com campo inline (sem prompt), detalhamento de quem foi tocado.

// Cores das fatias do gráfico (só da paleta; no máximo 5 fatias: 4 categorias + "Outros")
const CAT_CORES = ['var(--ui-teal)', 'var(--ui-blue)', 'var(--ui-gold)', 'var(--ui-dark)', 'var(--ui-faint)'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtData = (d) => { if (!d) return ''; const [, m, dia] = String(d).split('-'); return `${dia} ${MESES[Number(m) - 1]}`; };

const Avatar = ({ nome, cor, tam = 40 }) => (
  <span aria-hidden="true" style={{ width: tam, height: tam, borderRadius: '50%', background: cor || 'var(--ui-faint)', color: '#fff', fontSize: Math.round(tam / 3), fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{nome.slice(0, 2).toUpperCase()}</span>
);

export default function Pessoas({ ir }) {
  const { viagem, gastos, divisoes, perfis, perfil, adicionarPessoa, atualizarNomePessoa, removerPessoa } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const comDolar = usaDolar(viagem);
  const cambioOk = comDolar && cambio > 0;
  const [moeda, setMoeda] = useState('brl');
  const [selId, setSelId] = useState(null);
  // adicionar / editar nome inline (no lugar do window.prompt)
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [editando, setEditando] = useState(false);
  const [nomeEdit, setNomeEdit] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState('');   // aviso inline (ex.: não deu pra remover)

  const consumoMoeda = calcularConsumoPorMoeda(gastos, divisoes, perfis);
  const emBRL = (m) => (m.usd * cambio) + m.brl;
  const emUSD = (m) => (cambioOk ? m.usd + (m.brl / cambio) : 0);
  const pessoas = perfis
    .map((p) => { const m = consumoMoeda[p.id] || { usd: 0, brl: 0 }; return { ...p, totalBRL: emBRL(m), totalUSD: emUSD(m), ehVoce: perfil && p.id === perfil.id }; })
    .sort((a, b) => b.totalBRL - a.totalBRL);
  const grandTotal = pessoas.reduce((s, p) => s + p.totalBRL, 0) || 1;
  const maxP = pessoas.reduce((m, p) => Math.max(m, p.totalBRL), 0) || 1;
  const sel = pessoas.find((p) => p.id === selId) || pessoas.find((p) => p.ehVoce) || pessoas[0];
  const sozinho = perfis.length <= 1;

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

  function abrirNovo() { setMsg(''); setNovoNome(''); setNovoAberto(true); }
  async function confirmarNovo() {
    const n = novoNome.trim();
    if (!n) { setMsg('Escreve o nome da pessoa.'); return; }
    setOcupado(true); setMsg('');
    try { await adicionarPessoa(n); setNovoAberto(false); setNovoNome(''); }
    catch (e) { setMsg('Não consegui adicionar agora. Tenta de novo.'); }
    finally { setOcupado(false); }
  }
  function abrirEdicao(p) { setMsg(''); setNomeEdit(p.nome); setEditando(true); }
  async function confirmarEdicao() {
    if (!sel) return;
    const n = nomeEdit.trim();
    if (!n) { setMsg('O nome não pode ficar vazio.'); return; }
    setOcupado(true); setMsg('');
    try { if (n !== sel.nome) await atualizarNomePessoa(sel.id, n); setEditando(false); }
    catch (e) { setMsg('Não consegui salvar o nome. Tenta de novo.'); }
    finally { setOcupado(false); }
  }
  async function remover(p) {
    if (!window.confirm(`Remover "${p.nome}"?`)) return;
    setMsg('');
    const erro = await removerPessoa(p.id);
    if (erro) setMsg(`Não dá pra remover ${p.nome}: já tem gastos ligados a essa pessoa. Apaga os gastos dela primeiro.`);
    else setSelId(null);
  }
  function selecionar(id) { setSelId(id); setEditando(false); setMsg(''); }

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="Pessoas"
        subtitulo={sozinho ? 'Só você na viagem por enquanto.' : `${perfis.length} na viagem · quanto cada um consumiu`}
        onVoltar={ir ? () => ir('menu') : undefined}
        acao={<Button variant="soft" onClick={novoAberto ? () => setNovoAberto(false) : abrirNovo} aria-expanded={novoAberto}>{novoAberto ? 'Fechar' : '+ Pessoa'}</Button>}
      />

      {/* Adicionar pessoa (inline) */}
      <Expand aberto={novoAberto}>
        <div className="ui-card-tight" style={{ padding: 14, marginBottom: 14 }}>
          <Field label="Nome da pessoa" hint="Pra quem não usa o app — os gastos dela entram na divisão do mesmo jeito.">
            <input className="ui-input" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Sogro" autoFocus={novoAberto} onKeyDown={(e) => e.key === 'Enter' && confirmarNovo()} />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={confirmarNovo} disabled={ocupado || !novoNome.trim()} style={{ flex: 1 }}>{ocupado ? 'Adicionando…' : 'Adicionar'}</Button>
            <Button variant="secondary" onClick={() => setNovoAberto(false)}>Cancelar</Button>
          </div>
          {ir && (
            <div className="ui-caption" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span>Quem já usa o app entra pelo link de convite.</span>
              <button className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => ir('viagens')}>Ver convite →</button>
            </div>
          )}
        </div>
      </Expand>

      {msg && <div className="ui-error" role="alert">{msg}</div>}

      {comDolar && (
        <div className="ui-seg" role="tablist" aria-label="Moeda" style={{ width: 160, marginBottom: 14 }}>
          <button role="tab" aria-selected={moeda === 'brl'} className={moeda === 'brl' ? 'on' : ''} onClick={() => setMoeda('brl')}>R$</button>
          <button role="tab" aria-selected={moeda === 'usd'} className={moeda === 'usd' ? 'on' : ''} onClick={() => setMoeda('usd')} disabled={!cambioOk}>US$</button>
        </div>
      )}

      {/* Lista de pessoas */}
      <Reveal>
        <div className="ui-card" style={{ padding: '4px 6px' }}>
          <div className="ui-list">
            {pessoas.map((p) => {
              const principal = moeda === 'usd' ? fmtUSD(p.totalUSD) : fmtBRL(p.totalBRL);
              const sec = moeda === 'usd' ? fmtBRL(p.totalBRL) : (cambioOk ? fmtUSD(p.totalUSD) : null);
              const pctTot = Math.round((p.totalBRL / grandTotal) * 100);
              const ativo = sel && sel.id === p.id;
              return (
                <button key={p.id} onClick={() => selecionar(p.id)} aria-pressed={ativo} className="ui-rowbtn ui-press" style={{ padding: '10px 10px', borderRadius: 14, background: ativo ? 'var(--ui-sunken)' : 'transparent' }}>
                  <Avatar nome={p.nome} cor={p.cor} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span className="ui-clamp1" style={{ fontSize: 14.5, fontWeight: 700, minWidth: 0 }}>{p.nome}</span>
                      {p.ehVoce && <span className="ui-pill ui-pill-neutral" style={{ flex: '0 0 auto' }}>você</span>}
                    </span>
                    <span className="ui-caption" style={{ display: 'block', marginTop: 2 }}>{pctTot}% do total</span>
                    <span aria-hidden="true" style={{ display: 'block', height: 4, borderRadius: 4, background: 'var(--ui-line)', overflow: 'hidden', marginTop: 6 }}>
                      <span style={{ display: 'block', width: Math.max(3, (p.totalBRL / maxP) * 100) + '%', height: '100%', borderRadius: 4, background: p.cor || 'var(--ui-teal)', transition: 'width .6s var(--ease)' }} />
                    </span>
                  </span>
                  <span style={{ textAlign: 'right', flex: '0 0 auto', paddingLeft: 4 }}>
                    <span className="ui-num" style={{ display: 'block', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{principal}</span>
                    {sec && <span className="ui-num ui-faint" style={{ display: 'block', fontSize: 11, marginTop: 1, whiteSpace: 'nowrap' }}>{sec}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {sozinho && !novoAberto && (
        <div style={{ marginTop: 12 }}>
          <EmptyState compacto icone="🧑‍🤝‍🧑" titulo="Ninguém mais por aqui ainda." texto="Adiciona quem viaja junto pra dividir os gastos e acertar as contas." cta="Adicionar pessoa" onCta={abrirNovo} />
        </div>
      )}

      {/* Detalhamento + ações da pessoa selecionada */}
      {sel && (
        <Reveal delay={0.05}>
          <div className="ui-card" style={{ marginTop: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: cats.length > 0 ? 12 : 4 }}>
              <span className="ui-h2 ui-clamp1" style={{ minWidth: 0 }}>{sel.nome}</span>
              <span className="ui-num" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ui-teal-ink)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{moeda === 'usd' ? fmtUSD(sel.totalUSD) : fmtBRL(sel.totalBRL)}</span>
            </div>
            {cats.length > 0 ? (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <svg width="92" height="92" viewBox="0 0 92 92" style={{ flex: '0 0 auto' }} role="img" aria-label={`Categorias de ${sel.nome}`}>
                  <circle cx="46" cy="46" r={R} fill="none" stroke="var(--ui-line)" strokeWidth="11" />
                  {arcos.map((a, i) => (<circle key={i} cx="46" cy="46" r={R} fill="none" stroke={a.cor} strokeWidth="11" strokeDasharray={`${a.len} ${C}`} strokeDashoffset={a.off} transform="rotate(-90 46 46)" strokeLinecap="round" />))}
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {cats.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, margin: '5px 0' }}>
                      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: CAT_CORES[i % CAT_CORES.length], flex: '0 0 auto' }} />
                      <span className="ui-clamp1 ui-muted" style={{ flex: 1, minWidth: 0 }}>{c.nome}</span>
                      <span className="ui-faint ui-num" style={{ flex: '0 0 auto' }}>{Math.round((c.v / totalSel) * 100)}%</span>
                      <b className="ui-num" style={{ flex: '0 0 auto', minWidth: 60, textAlign: 'right' }}>{fmtVal(c.v)}</b>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ui-caption">Ainda não entrou em nenhum gasto.</div>
            )}

            {/* Editar nome (inline) / remover */}
            <Expand aberto={editando}>
              <div style={{ paddingTop: 14 }}>
                <Field label="Novo nome">
                  <input className="ui-input" value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} autoFocus={editando} onKeyDown={(e) => e.key === 'Enter' && confirmarEdicao()} />
                </Field>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button onClick={confirmarEdicao} disabled={ocupado || !nomeEdit.trim()} style={{ flex: 1 }}>{ocupado ? 'Salvando…' : 'Salvar nome'}</Button>
                  <Button variant="secondary" onClick={() => setEditando(false)}>Cancelar</Button>
                </div>
              </div>
            </Expand>
            {!editando && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid var(--ui-line)', paddingTop: 6 }}>
                <button className="ui-btn ui-btn-ghost" style={{ padding: '0 8px' }} onClick={() => abrirEdicao(sel)}>✏️ Editar nome</button>
                {!sel.ehVoce && <button className="ui-btn ui-btn-ghost" style={{ padding: '0 8px', color: 'var(--ui-debit)', marginLeft: 'auto' }} onClick={() => remover(sel)}>Remover</button>}
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* Gastos da pessoa selecionada */}
      {sel && gastosSel.length > 0 && (
        <>
          <SectionHeader title={`Gastos de ${sel.nome}`} />
          <div className="ui-card" style={{ padding: '2px 16px' }}>
            <div className="ui-list">
              {gastosSel.slice(0, 12).map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, minHeight: 56, padding: '8px 0' }}>
                  <span className="ui-sunken" aria-hidden="true" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ui-clamp1" style={{ fontSize: 14.5, fontWeight: 700 }}>{g.descricao || nomeCategoria(g.categoria)}</div>
                    <div className="ui-caption">{fmtData(g.data)}</div>
                  </div>
                  <span className="ui-num" style={{ fontSize: 14.5, fontWeight: 800, flex: '0 0 auto', whiteSpace: 'nowrap' }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="ui-caption ui-faint" style={{ textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>Valor cheio de cada gasto que {sel.nome} participa{gastosSel.length > 12 ? ` · mostrando 12 de ${gastosSel.length}` : ''}.</p>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={() => supabase.auth.signOut()} className="ui-btn ui-btn-ghost" style={{ color: 'var(--ui-muted)', fontWeight: 600 }}>Sair da conta</button>
      </div>
    </div>
  );
}

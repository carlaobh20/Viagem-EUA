'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { fmtBRL, hojeLocal } from '../../lib/format';
import NovaViagemWizard from '../viagens/NovaViagemWizard';
import { Button, EmptyState, Expand, SectionHeader, ProgressBar } from '../ui';

const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };
// Capas das viagens sem foto: são ilustração (não cor de interface), por isso ficam literais.
const GRADS = [
  { bg: 'linear-gradient(135deg,#1FBFA6 0%,#0E8C86 100%)', ink: '#0B7C73' },
  { bg: 'linear-gradient(135deg,#8B6CF0 0%,#6D3BE0 100%)', ink: '#6D3BE0' },
  { bg: 'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)', ink: '#C2410C' },
  { bg: 'linear-gradient(135deg,#0EA5E9 0%,#2563EB 100%)', ink: '#1D4ED8' },
  { bg: 'linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%)', ink: '#BE2D6E' },
];

export default function Viagens({ ir }) {
  const { perfil, viagem, viagens, trocarViagem, criarViagem, gerarConvite, entrarPorConvite, apagarViagem, definirFotoViagem, guardados, definirMeta, adicionarGuardado, removerGuardado } = useData();
  const [totais, setTotais] = useState({});
  const [msg, setMsg] = useState(null); // { tipo: 'ok'|'erro', texto }
  const [metaForm, setMetaForm] = useState(null); // string do valor da meta em edição
  const [guardForm, setGuardForm] = useState(null); // { banco, valor }
  const [emailUser, setEmailUser] = useState('');
  const [wizardAberto, setWizardAberto] = useState(false);
  const [conviteAberto, setConviteAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [conviteErro, setConviteErro] = useState('');
  const hoje = hojeLocal();

  // pega o e-mail como fallback para o nome
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setEmailUser(data?.user?.email || ''); });
  }, []);

  // primeiro nome: tenta perfil.nome -> primeiro pedaco do e-mail -> "Viajante"
  const primeiroNome = (() => {
    const n = (perfil && (perfil.nome || perfil.name)) ? String(perfil.nome || perfil.name).trim() : '';
    if (n) return n.split(' ')[0];
    if (emailUser) {
      const base = emailUser.split('@')[0].replace(/[._\-]+/g, ' ').trim();
      if (base) return base.charAt(0).toUpperCase() + base.slice(1).split(' ')[0].slice(1);
    }
    return 'Viajante';
  })();

  useEffect(() => {
    const ids = (viagens || []).map((v) => v.id);
    if (!ids.length) { setTotais({}); return; }
    (async () => {
      const { data } = await supabase.from('gastos').select('viagem_id, valor, moeda').in('viagem_id', ids);
      const cot = {}; (viagens || []).forEach((v) => { cot[v.id] = Number(v.cotacao_usd) || 0; });
      const m = {};
      (data || []).forEach((g) => { const brl = g.moeda === 'USD' ? Number(g.valor) * (cot[g.viagem_id] || 0) : Number(g.valor); m[g.viagem_id] = (m[g.viagem_id] || 0) + brl; });
      setTotais(m);
    })();
  }, [viagens]);

  // pre-carrega as fotos das viagens no cache do navegador, pra que
  // quando o card re-renderizar (ao chegar o total) a imagem ja esteja
  // pronta e nao pisque
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (viagens || []).forEach((v) => {
      if (v.foto) { const img = new window.Image(); img.src = v.foto; }
    });
  }, [viagens]);

  function info(v) {
    if (v.data_volta && v.data_volta < hoje) return { tag: 'Concluída', passada: true };
    if (v.data_ida && v.data_ida > hoje) { const d = Math.ceil((new Date(v.data_ida + 'T00:00:00') - new Date(hoje + 'T00:00:00')) / 86400000); return { tag: `Faltam ${d} dias`, passada: false }; }
    if (v.data_ida) return { tag: 'Em viagem', passada: false };
    return { tag: 'Sem datas', passada: false };
  }
  const ehDono = (v) => perfil && v.owner_id === perfil.user_id;
  const lista = (viagens || []).slice();
  const proximas = lista.filter((v) => !info(v).passada);
  const passadas = lista.filter((v) => info(v).passada);

  function abrir(v) { trocarViagem(v.id); ir('resumo'); }
  async function criarComPerfil(dados) { await criarViagem(dados); setWizardAberto(false); setMsg({ tipo: 'ok', texto: 'Viagem criada!' }); }
  async function apagar(v, e) { e.stopPropagation(); if (!window.confirm(`Apagar "${v.nome}"? Remove a viagem e todos os dados dela para todos. Não dá pra desfazer.`)) return; const r = await apagarViagem(v.id); setMsg(r.ok ? { tipo: 'ok', texto: 'Viagem apagada.' } : { tipo: 'erro', texto: r.erro || 'Falhou.' }); }
  async function trocarFoto(v, e) { e.stopPropagation(); const url = window.prompt('Cole o link de uma foto (URL de imagem) para a capa da viagem. Deixe em branco para remover.', v.foto || ''); if (url === null) return; await definirFotoViagem(v.id, url.trim()); }
  async function convidarCard(v, e) {
    e.stopPropagation(); setMsg(null);
    const cod = await gerarConvite(v.id);
    if (!cod) { setMsg({ tipo: 'erro', texto: 'Não consegui gerar o convite.' }); return; }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/?convite=${cod}`;
    if (navigator.clipboard) { try { await navigator.clipboard.writeText(url); setMsg({ tipo: 'ok', texto: `Link de "${v.nome}" copiado! Cole no WhatsApp pra convidar.` }); return; } catch (er) {} }
    window.prompt('Copie o link de convite:', url);
  }
  // Entrar numa viagem pelo código do convite (o mesmo que vem no link ?convite=)
  async function entrarComCodigo() {
    const cod = codigo.trim();
    if (!cod) { setConviteErro('Cole o código ou o link do convite.'); return; }
    // aceita o link inteiro também: pega só o código depois de "convite="
    const m = cod.match(/convite=([A-Za-z0-9]+)/);
    setEntrando(true); setConviteErro('');
    const r = await entrarPorConvite(m ? m[1] : cod);
    setEntrando(false);
    if (!r || r.erro) { setConviteErro((r && r.erro) || 'Não consegui entrar com esse convite.'); return; }
    setCodigo(''); setConviteAberto(false);
    ir('resumo');
  }

  // ----- Minha meta (viagem ativa) -----
  const parseValor = (s) => { if (s == null) return null; let t = String(s).trim().replace(/[^\d.,]/g, ''); if (!t) return null; if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isNaN(n) ? null : n; };
  const meta = perfil && perfil.meta_valor != null ? Number(perfil.meta_valor) : null;
  const guardado = (guardados || []).reduce((s, g) => s + Number(g.valor || 0), 0);
  const metaPct = meta > 0 ? Math.min(100, Math.round((guardado / meta) * 100)) : 0;
  const metaFalta = Math.max(0, (meta || 0) - guardado);
  const hojeM = hojeLocal();
  const diasMeta = viagem && viagem.data_ida && viagem.data_ida > hojeM ? Math.ceil((new Date(viagem.data_ida + 'T00:00:00') - new Date(hojeM + 'T00:00:00')) / 86400000) : 0;
  const mesesMeta = Math.max(1, Math.ceil(diasMeta / 30));
  const mensalMeta = meta > 0 && diasMeta > 0 ? metaFalta / mesesMeta : 0;
  function salvarMeta() { definirMeta(parseValor(metaForm)); setMetaForm(null); }
  function salvarGuardado() { if (!guardForm) return; const v = parseValor(guardForm.valor); if (!guardForm.banco.trim() || !(v > 0)) { setGuardForm(null); return; } adicionarGuardado(guardForm.banco, v); setGuardForm({ banco: '', valor: '' }); }

  const subtituloHero = lista.length === 0
    ? 'Tudo organizado para você aproveitar cada destino ao máximo.'
    : `${lista.length} ${lista.length === 1 ? 'viagem' : 'viagens'}${passadas.length ? ` · ${passadas.length} ${passadas.length === 1 ? 'realizada' : 'realizadas'}` : ''}${proximas.length ? ` · ${proximas.length} por vir` : ''}`;

  // Bloco "entrar com convite" (aparece no vazio e no rodapé da lista)
  const blocoConvite = (
    <Expand aberto={conviteAberto}>
      <div className="ui-card" style={{ padding: 16, marginTop: 12 }}>
        <div className="ui-h2" style={{ marginBottom: 4 }}>Entrar com convite</div>
        <div className="ui-caption" style={{ marginBottom: 12 }}>Cole o código ou o link que te mandaram no WhatsApp.</div>
        <input className="ui-input ui-mono" value={codigo} onChange={(e) => setCodigo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && entrarComCodigo()} placeholder="Ex.: 7KQ2ZD" autoCapitalize="characters" style={{ marginBottom: 10, fontWeight: 700 }} />
        {conviteErro && <div className="ui-error">{conviteErro}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setConviteAberto(false); setConviteErro(''); }}>Cancelar</Button>
          <Button style={{ flex: 2 }} onClick={entrarComCodigo} disabled={entrando}>{entrando ? 'Entrando…' : 'Entrar na viagem'}</Button>
        </div>
      </div>
    </Expand>
  );

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', fontFamily: 'var(--font)', color: 'var(--ui-ink)', paddingBottom: 28 }}>
      {/* HEADER com foto ao fundo + degradê dissolvendo no fundo do app */}
      <div style={{ position: 'relative', minHeight: 248, backgroundImage: "url('/header-home.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,24,44,.72) 0%,rgba(0,26,48,.50) 30%,rgba(0,28,50,.20) 50%,rgba(247,248,250,.30) 74%,rgba(247,248,250,.88) 90%,var(--ui-bg) 100%)' }} />
        <button onClick={() => setWizardAberto(true)} aria-label="Criar nova viagem" className="ui-press" style={{ position: 'absolute', top: 22, right: 20, width: 54, height: 54, borderRadius: '50%', background: 'var(--ui-teal)', color: '#fff', fontSize: 30, fontWeight: 300, lineHeight: 1, border: '2px solid rgba(255,255,255,.35)', cursor: 'pointer', boxShadow: '0 10px 24px rgba(0,90,80,.45), 0 2px 6px rgba(0,0,0,.15)', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 3 }}>+</button>
        <div className="ui-in" style={{ position: 'relative', zIndex: 2, padding: '28px 22px 18px', color: '#fff' }}>
          <div style={{ fontSize: 15, fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,.55)' }}>Olá, {primeiroNome}!</div>
          <div style={{ fontSize: 33, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.04, marginTop: 6, maxWidth: 250, textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>Suas <span style={{ color: 'var(--ui-teal)' }}>próximas viagens</span></div>
          <div style={{ fontSize: 12.5, marginTop: 10, maxWidth: 240, lineHeight: 1.4, textShadow: '0 2px 8px rgba(0,0,0,.6)', opacity: 0.98 }}>{subtituloHero}</div>
        </div>
      </div>

      <div style={{ padding: '0 18px', marginTop: -6 }}>
        {msg && <div className={msg.tipo === 'ok' ? 'ui-success' : 'ui-error'} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ flex: 1 }}>{msg.texto}</span><button onClick={() => setMsg(null)} aria-label="Fechar" style={{ border: 'none', background: 'transparent', color: 'inherit', width: 32, height: 32, marginRight: -8, borderRadius: 8 }}>✕</button></div>}

        {lista.length === 0 && (
          <div style={{ marginTop: 16 }}>
            <EmptyState icone="🧳" titulo="Nenhuma viagem ainda." texto="Crie a primeira e convide a família — ou entre numa viagem que já existe com o convite que te mandaram." cta="Criar minha primeira viagem" onCta={() => setWizardAberto(true)}
              secundario={<Button variant="ghost" onClick={() => setConviteAberto((v) => !v)}>Tenho um convite</Button>} />
            {blocoConvite}
          </div>
        )}

        {proximas.length > 0 && <SectionHeader title="Próximas viagens" style={{ margin: '16px 4px 12px' }} />}
        {proximas.map((v, i) => <Card key={v.id} v={v} idx={i} info={info(v)} ativa={!!(viagem && v.id === viagem.id)} dono={ehDono(v)} total={totais[v.id]} onAbrir={() => abrir(v)} onConvidar={(e) => convidarCard(v, e)} onFoto={(e) => trocarFoto(v, e)} onApagar={(e) => apagar(v, e)} />)}

        {passadas.length > 0 && <SectionHeader title="Viagens realizadas" style={{ margin: '24px 4px 12px' }} />}
        {passadas.map((v, i) => <Card key={v.id} v={v} idx={i + proximas.length} info={info(v)} ativa={!!(viagem && v.id === viagem.id)} dono={ehDono(v)} total={totais[v.id]} onAbrir={() => abrir(v)} onConvidar={(e) => convidarCard(v, e)} onFoto={(e) => trocarFoto(v, e)} onApagar={(e) => apagar(v, e)} />)}

        {lista.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="lg" style={{ flex: 1.4 }} onClick={() => setWizardAberto(true)}>+ Nova viagem</Button>
              <Button size="lg" variant="secondary" style={{ flex: 1 }} onClick={() => setConviteAberto((v) => !v)}>Tenho um convite</Button>
            </div>
            {blocoConvite}
          </div>
        )}

        {viagem && (
          <div style={{ margin: '22px 0 4px' }}>
            <SectionHeader title={`Minha meta · ${viagem.nome}`} style={{ margin: '0 4px 12px' }} />
            {meta == null ? (
              <div className="ui-card ui-in" style={{ padding: 18 }}>
                {metaForm == null ? (
                  <>
                    <div className="ui-h2" style={{ marginBottom: 4 }}>Quanto você quer guardar pra essa viagem?</div>
                    <div className="ui-caption" style={{ marginBottom: 14 }}>Defina sua meta e acompanhe quanto já separou, em cada banco.</div>
                    <Button full onClick={() => setMetaForm(viagem.orcamento_brl ? String(viagem.orcamento_brl) : '')}>Definir minha meta</Button>
                  </>
                ) : (
                  <>
                    <label className="ui-label">Meta em R$</label>
                    <input autoFocus className="ui-input ui-num" inputMode="decimal" value={metaForm} onChange={(e) => setMetaForm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarMeta()} placeholder="Ex.: 30000" style={{ marginBottom: 10, fontSize: 16 }} />
                    <Button full onClick={salvarMeta}>Salvar meta</Button>
                    <Button variant="ghost" full style={{ color: 'var(--ui-muted)', marginTop: 4 }} onClick={() => setMetaForm(null)}>Cancelar</Button>
                  </>
                )}
              </div>
            ) : (
              <div className="ui-card ui-in" style={{ overflow: 'hidden' }}>
                {/* destaque escuro: quanto já guardou */}
                <div style={{ background: 'var(--ui-dark)', color: '#fff', padding: '18px 20px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 12.5, opacity: 0.8 }}>Guardado de {fmtBRL(meta)}</span>
                    <button onClick={() => setMetaForm(String(meta))} style={{ border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 999, padding: '6px 11px', minHeight: 32 }}>editar meta</button>
                  </div>
                  <div className="ui-num" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', margin: '4px 0 1px' }}>{fmtBRL(guardado)}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ui-teal)', fontWeight: 700 }}>{metaPct}% da meta</div>
                  <div style={{ margin: '13px 0 8px' }}><ProgressBar pct={metaPct} trackColor="rgba(255,255,255,.18)" fillColor="var(--ui-teal)" height={9} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.88 }}><span>Faltam {fmtBRL(metaFalta)}</span>{diasMeta > 0 && <span>até {fmtDia(viagem.data_ida)}</span>}</div>
                </div>
                <Expand aberto={metaForm != null}>
                  <div style={{ padding: 16, borderTop: '1px solid var(--ui-line)', background: 'var(--ui-sunken)' }}>
                    <label className="ui-label">Nova meta em R$</label>
                    <input autoFocus className="ui-input ui-num" inputMode="decimal" value={metaForm || ''} onChange={(e) => setMetaForm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarMeta()} placeholder="Nova meta" style={{ marginBottom: 10 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button style={{ flex: 1 }} onClick={salvarMeta}>Salvar</Button>
                      <Button variant="secondary" onClick={() => setMetaForm(null)}>Cancelar</Button>
                      <Button variant="ghost" style={{ color: 'var(--ui-debit)' }} onClick={() => { definirMeta(null); setMetaForm(null); }}>Remover</Button>
                    </div>
                  </div>
                </Expand>
                {mensalMeta > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--ui-line)' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--ui-teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: '0 0 auto' }}>📆</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700 }}>Guarde {fmtBRL(mensalMeta)}/mês</div><div className="ui-caption" style={{ marginTop: 1 }}>pra bater a meta {mesesMeta === 1 ? 'no mês que falta' : `nos ${mesesMeta} meses que faltam`}</div></div>
                  </div>
                )}
                {guardados.map((g) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px 10px 18px', borderTop: '1px solid var(--ui-line)', minHeight: 56 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--ui-dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flex: '0 0 auto' }}>{(g.banco || '?').slice(0, 1).toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div className="ui-clamp1" style={{ fontSize: 14.5, fontWeight: 700 }}>{g.banco}</div></div>
                    <span className="ui-num" style={{ fontSize: 14.5, fontWeight: 700 }}>{fmtBRL(Number(g.valor))}</span>
                    <button onClick={() => { if (window.confirm('Remover este guardado?')) removerGuardado(g.id); }} aria-label="Remover" style={{ border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 15, cursor: 'pointer', flex: '0 0 auto', width: 40, height: 40, borderRadius: 10 }}>✕</button>
                  </div>
                ))}
                <Expand aberto={!!guardForm}>
                  {guardForm && (
                    <div style={{ padding: 16, borderTop: '1px solid var(--ui-line)', background: 'var(--ui-sunken)' }}>
                      <input autoFocus className="ui-input" value={guardForm.banco} onChange={(e) => setGuardForm({ ...guardForm, banco: e.target.value })} placeholder="Banco (ex.: Nubank)" style={{ marginBottom: 8 }} />
                      <input className="ui-input ui-num" inputMode="decimal" value={guardForm.valor} onChange={(e) => setGuardForm({ ...guardForm, valor: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarGuardado()} placeholder="Valor guardado" style={{ marginBottom: 10 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" style={{ flex: 1 }} onClick={() => setGuardForm(null)}>Fechar</Button>
                        <Button style={{ flex: 2 }} onClick={salvarGuardado}>Adicionar</Button>
                      </div>
                    </div>
                  )}
                </Expand>
                {!guardForm && (
                  <button onClick={() => setGuardForm({ banco: '', valor: '' })} className="ui-btn ui-btn-ghost" style={{ width: '100%', minHeight: 50, borderRadius: 0, borderTop: '1px solid var(--ui-line)' }}>+ Adicionar guardado</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {wizardAberto && <NovaViagemWizard onCancelar={() => setWizardAberto(false)} onCriar={criarComPerfil} />}
    </div>
  );
}
const rb = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.24)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, border: 'none', color: '#fff', cursor: 'pointer' };

// Sky e Card ficam no nível do módulo (fora do componente Viagens) de propósito:
// se fossem definidos dentro, o React os recriaria a cada render e remontaria o
// card inteiro — a imagem de fundo reiniciava a animação de opacidade e o card
// "piscava". Fora, a identidade é estável e o card só atualiza, sem remontar.
function Sky() {
  return (
    <svg style={{ position: 'absolute', right: 0, bottom: 0, width: '72%', height: '60%', opacity: 0.16, zIndex: 1 }} viewBox="0 0 200 100" preserveAspectRatio="xMaxYMax meet">
      <g fill="#fff"><rect x="6" y="42" width="15" height="58" /><rect x="26" y="26" width="13" height="74" /><rect x="44" y="52" width="11" height="48" /><rect x="118" y="16" width="9" height="84" /><rect x="132" y="46" width="15" height="54" /><rect x="153" y="30" width="13" height="70" /><rect x="172" y="56" width="11" height="44" /></g>
    </svg>
  );
}

function Card({ v, idx, info, ativa, dono, total, onAbrir, onConvidar, onFoto, onApagar }) {
  const g = GRADS[idx % GRADS.length];
  const inkTotal = v.foto ? 'var(--ui-dark)' : g.ink;
  return (
    <div onClick={onAbrir} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(); } }} className="ui-press ui-in" style={{ position: 'relative', margin: '0 0 16px', borderRadius: 24, overflow: 'hidden', padding: 18, minHeight: 172, color: '#fff', cursor: 'pointer', background: v.foto ? 'var(--ui-dark)' : g.bg, boxShadow: 'var(--ui-shadow-raised)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', filter: info.passada ? 'saturate(.75)' : 'none', outline: ativa ? '3px solid #fff' : 'none', outlineOffset: -3, animationDelay: `${Math.min(idx, 4) * 0.06}s` }}>
      {v.foto && <img src={v.foto} alt="" loading="eager" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} ref={(el) => { if (el && el.complete) el.style.opacity = 1; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0, transition: 'opacity .45s ease' }} />}
      {v.foto && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, rgba(8,28,38,.32) 0%, rgba(8,28,38,.62) 100%)', zIndex: 1 }} />}
      {!v.foto && <Sky />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2, gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(0,0,0,.22)', backdropFilter: 'blur(3px)', padding: '6px 13px', borderRadius: 20, whiteSpace: 'nowrap', alignSelf: 'center' }}>{ativa ? '● ' : ''}{info.tag}</span>
        {dono && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onConvidar} aria-label="Convidar" title="Copiar link de convite" style={rb}>🔗</button>
            <button onClick={onFoto} aria-label="Trocar foto" title="Trocar foto de capa" style={rb}>📷</button>
            <button onClick={onApagar} aria-label="Apagar" title="Apagar viagem" style={{ ...rb, opacity: 0.75 }}>🗑</button>
          </div>
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 2, paddingRight: 96 }}>
        <div className="ui-wrap" style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.5px', textShadow: '0 1px 8px rgba(0,0,0,.25)', lineHeight: 1.1 }}>{v.nome}</div>
        <div style={{ fontSize: 13, marginTop: 7, opacity: 0.96, display: 'flex', alignItems: 'center', gap: 7 }}>📅 {v.data_ida ? `${fmtDia(v.data_ida)}${v.data_volta ? ' → ' + fmtDia(v.data_volta) : ''}` : 'Sem datas definidas'}</div>
      </div>
      <div className="ui-num" style={{ position: 'absolute', right: 18, bottom: 18, background: '#fff', color: inkTotal, fontSize: 14, fontWeight: 800, padding: '9px 15px', borderRadius: 14, zIndex: 3 }}>{total ? fmtBRL(total) : 'R$ 0'}</div>
    </div>
  );
}

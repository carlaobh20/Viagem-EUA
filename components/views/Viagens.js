'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { fmtBRL } from '../../lib/format';

const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };
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
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [metaForm, setMetaForm] = useState(null); // string do valor da meta em edição
  const [guardForm, setGuardForm] = useState(null); // { banco, valor }
  const [emailUser, setEmailUser] = useState('');
  const hoje = new Date().toISOString().slice(0, 10);

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
  async function criar() { const nome = window.prompt('Nome da nova viagem (ex.: Europa 2027)'); if (!nome || !nome.trim()) return; setBusy(true); try { await criarViagem(nome); setMsg('Viagem criada!'); } catch (e) { setMsg('Não consegui criar.'); } setBusy(false); }
  async function apagar(v, e) { e.stopPropagation(); if (!window.confirm(`Apagar "${v.nome}"? Remove a viagem e todos os dados dela para todos. Não dá pra desfazer.`)) return; const r = await apagarViagem(v.id); setMsg(r.ok ? 'Viagem apagada.' : (r.erro || 'Falhou.')); }
  async function trocarFoto(v, e) { e.stopPropagation(); const url = window.prompt('Cole o link de uma foto (URL de imagem) para a capa da viagem. Deixe em branco para remover.', v.foto || ''); if (url === null) return; await definirFotoViagem(v.id, url.trim()); }
  async function convidarCard(v, e) {
    e.stopPropagation(); setMsg('');
    const cod = await gerarConvite(v.id);
    if (!cod) { setMsg('Não consegui gerar o convite.'); return; }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/?convite=${cod}`;
    if (navigator.clipboard) { try { await navigator.clipboard.writeText(url); setMsg(`Link de "${v.nome}" copiado! Cole no WhatsApp pra convidar.`); return; } catch (er) {} }
    window.prompt('Copie o link de convite:', url);
  }

  function Sky() {
    return (
      <svg style={{ position: 'absolute', right: 0, bottom: 0, width: '72%', height: '60%', opacity: 0.16, zIndex: 1 }} viewBox="0 0 200 100" preserveAspectRatio="xMaxYMax meet">
        <g fill="#fff"><rect x="6" y="42" width="15" height="58" /><rect x="26" y="26" width="13" height="74" /><rect x="44" y="52" width="11" height="48" /><rect x="118" y="16" width="9" height="84" /><rect x="132" y="46" width="15" height="54" /><rect x="153" y="30" width="13" height="70" /><rect x="172" y="56" width="11" height="44" /></g>
      </svg>
    );
  }

  function Card({ v, idx }) {
    const i = info(v);
    const g = GRADS[idx % GRADS.length];
    const ativa = viagem && v.id === viagem.id;
    const inkTotal = v.foto ? '#0B5563' : g.ink;
    return (
      <div onClick={() => abrir(v)} style={{ position: 'relative', margin: '0 0 16px', borderRadius: 24, overflow: 'hidden', padding: 18, minHeight: 172, color: '#fff', cursor: 'pointer', background: v.foto ? '#0B3A47' : g.bg, boxShadow: '0 12px 26px rgba(20,40,50,.18)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', filter: i.passada ? 'saturate(.75)' : 'none', outline: ativa ? '3px solid #fff' : 'none', outlineOffset: -3 }}>
        {v.foto && <img src={v.foto} alt="" loading="eager" onLoad={(e) => { e.currentTarget.style.opacity = 1; }} ref={(el) => { if (el && el.complete) el.style.opacity = 1; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0, transition: 'opacity .45s ease' }} />}
        {v.foto && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, rgba(8,28,38,.32) 0%, rgba(8,28,38,.62) 100%)', zIndex: 1 }} />}
        {!v.foto && <Sky />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(0,0,0,.22)', backdropFilter: 'blur(3px)', padding: '6px 13px', borderRadius: 20 }}>{i.tag}</span>
          {ehDono(v) && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={(e) => convidarCard(v, e)} aria-label="Convidar" style={rb}>🔗</button>
              <button onClick={(e) => trocarFoto(v, e)} aria-label="Trocar foto" style={rb}>📷</button>
              <button onClick={(e) => apagar(v, e)} aria-label="Apagar" style={rb}>🗑</button>
            </div>
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-0.5px', textShadow: '0 1px 8px rgba(0,0,0,.25)' }}>{v.nome}</div>
          <div style={{ fontSize: 13, marginTop: 7, opacity: 0.96, display: 'flex', alignItems: 'center', gap: 7 }}>📅 {v.data_ida ? `${fmtDia(v.data_ida)}${v.data_volta ? ' → ' + fmtDia(v.data_volta) : ''}` : 'Sem datas definidas'}</div>
        </div>
        <div style={{ position: 'absolute', right: 18, bottom: 18, background: '#fff', color: inkTotal, fontSize: 14, fontWeight: 800, padding: '9px 15px', borderRadius: 14, zIndex: 3 }}>{totais[v.id] ? fmtBRL(totais[v.id]) : 'R$ 0'}</div>
      </div>
    );
  }

  // ----- Minha meta (viagem ativa) -----
  const parseValor = (s) => { if (s == null) return null; let t = String(s).trim().replace(/[^\d.,]/g, ''); if (!t) return null; if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isNaN(n) ? null : n; };
  const meta = perfil && perfil.meta_valor != null ? Number(perfil.meta_valor) : null;
  const guardado = (guardados || []).reduce((s, g) => s + Number(g.valor || 0), 0);
  const metaPct = meta > 0 ? Math.min(100, Math.round((guardado / meta) * 100)) : 0;
  const metaFalta = Math.max(0, (meta || 0) - guardado);
  const hojeM = new Date().toISOString().slice(0, 10);
  const diasMeta = viagem && viagem.data_ida && viagem.data_ida > hojeM ? Math.ceil((new Date(viagem.data_ida + 'T00:00:00') - new Date(hojeM + 'T00:00:00')) / 86400000) : 0;
  const mesesMeta = Math.max(1, Math.ceil(diasMeta / 30));
  const mensalMeta = meta > 0 && diasMeta > 0 ? metaFalta / mesesMeta : 0;
  function salvarMeta() { definirMeta(parseValor(metaForm)); setMetaForm(null); }
  function salvarGuardado() { if (!guardForm) return; const v = parseValor(guardForm.valor); if (!guardForm.banco.trim() || !(v > 0)) { setGuardForm(null); return; } adicionarGuardado(guardForm.banco, v); setGuardForm({ banco: '', valor: '' }); }

  return (
    <div style={{ background: '#F4F8FB', minHeight: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: '#16242C', paddingBottom: 28 }}>
      {/* HEADER com foto ao fundo + degradê dissolvendo no app */}
      <div style={{ position: 'relative', minHeight: 248, backgroundImage: "url('/header-home.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,24,44,.72) 0%,rgba(0,26,48,.50) 30%,rgba(0,28,50,.20) 50%,rgba(244,248,251,.30) 74%,rgba(244,248,251,.88) 90%,#F4F8FB 100%)' }} />
        <button onClick={criar} aria-label="Criar nova viagem" style={{ position: 'absolute', top: 22, right: 20, width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,#00D4BC,#0E9F97)', color: '#fff', fontSize: 30, fontWeight: 300, lineHeight: 1, border: '2px solid rgba(255,255,255,.35)', cursor: 'pointer', boxShadow: '0 10px 24px rgba(0,90,80,.55), 0 2px 6px rgba(0,0,0,.15)', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 3 }}>+</button>
        <div style={{ position: 'relative', zIndex: 2, padding: '28px 22px 18px', color: '#fff' }}>
          <div style={{ fontSize: 15, fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,.55)' }}>Olá, {primeiroNome}!</div>
          <div style={{ fontSize: 33, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.04, marginTop: 6, maxWidth: 250, textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>Suas <span style={{ color: '#5EEAD9' }}>próximas viagens</span></div>
          <div style={{ fontSize: 12.5, marginTop: 10, maxWidth: 230, lineHeight: 1.4, textShadow: '0 2px 8px rgba(0,0,0,.6)', opacity: 0.98 }}>Tudo organizado para você aproveitar cada destino ao máximo.</div>
        </div>
      </div>

      <div style={{ padding: '0 18px', marginTop: -6 }}>
        {proximas.length > 0 && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: '#00A99B', margin: '16px 4px 12px' }}>PRÓXIMAS VIAGENS</div>}
        {proximas.map((v, i) => <Card key={v.id} v={v} idx={i} />)}

        {passadas.length > 0 && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: '#7B8794', margin: '24px 4px 12px' }}>VIAGENS REALIZADAS</div>}
        {passadas.map((v, i) => <Card key={v.id} v={v} idx={i + proximas.length} />)}

        {viagem && (
          <div style={{ margin: '22px 0 4px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: '#00A99B', margin: '0 4px 12px' }}>MINHA META · {viagem.nome}</div>
            {meta == null ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 8px 24px rgba(20,40,50,.07)' }}>
                {metaForm == null ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Quanto você quer guardar pra essa viagem?</div>
                    <div style={{ fontSize: 12.5, color: '#7B8794', marginBottom: 12 }}>Defina sua meta e acompanhe quanto já separou, em cada banco.</div>
                    <button onClick={() => setMetaForm(viagem.orcamento_brl ? String(viagem.orcamento_brl) : '')} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: '#13A98E', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Definir minha meta</button>
                  </>
                ) : (
                  <>
                    <input autoFocus inputMode="decimal" value={metaForm} onChange={(e) => setMetaForm(e.target.value)} placeholder="Ex.: 30000" style={{ width: '100%', border: '1px solid #E6E9E6', borderRadius: 12, padding: '12px 14px', fontSize: 16, marginBottom: 10 }} />
                    <button onClick={salvarMeta} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 13, background: '#13A98E', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Salvar meta</button>
                    <button onClick={() => setMetaForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: '#7B8794', fontSize: 13, marginTop: 6, cursor: 'pointer' }}>cancelar</button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 8px 26px rgba(20,40,50,.08)' }}>
                <div style={{ background: 'linear-gradient(135deg,#0E7C68 0%,#13A98E 60%,#1FB6A6 100%)', color: '#fff', padding: '18px 20px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12.5, opacity: 0.85 }}>Guardado de {fmtBRL(meta)}</span>
                    <button onClick={() => setMetaForm(String(meta))} style={{ border: 'none', background: 'none', color: '#fff', opacity: 0.85, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>editar meta</button>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', margin: '2px 0 1px' }}>{fmtBRL(guardado)}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.85 }}>{metaPct}% da meta</div>
                  <div style={{ height: 10, borderRadius: 7, background: 'rgba(255,255,255,.25)', overflow: 'hidden', margin: '13px 0 8px' }}><div style={{ width: metaPct + '%', height: '100%', borderRadius: 7, background: '#fff', transition: 'width .3s' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.92 }}><span>Faltam {fmtBRL(metaFalta)}</span>{diasMeta > 0 && <span>até {fmtDia(viagem.data_ida)}</span>}</div>
                </div>
                {metaForm != null && (
                  <div style={{ padding: 16, borderTop: '1px solid #EDEFEC', background: '#F7F9F7' }}>
                    <input autoFocus inputMode="decimal" value={metaForm} onChange={(e) => setMetaForm(e.target.value)} placeholder="Nova meta" style={{ width: '100%', border: '1px solid #E6E9E6', borderRadius: 12, padding: '11px 13px', fontSize: 15, marginBottom: 9 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={salvarMeta} style={{ flex: 1, border: 'none', borderRadius: 11, padding: 11, background: '#13A98E', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                      <button onClick={() => { definirMeta(null); setMetaForm(null); }} style={{ border: '1px solid #E6E9E6', borderRadius: 11, padding: '11px 14px', background: '#fff', color: '#B53D2E', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Remover</button>
                    </div>
                  </div>
                )}
                {mensalMeta > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid #EDEFEC' }}>
                    <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(19,169,142,.12)', color: '#13A98E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: '0 0 auto' }}>📆</span>
                    <div><div style={{ fontSize: 14, fontWeight: 700 }}>Guarde {fmtBRL(mensalMeta)}/mês</div><div style={{ fontSize: 12, color: '#7B8794', marginTop: 1 }}>pra bater a meta {mesesMeta === 1 ? 'no mês que falta' : `nos ${mesesMeta} meses que faltam`}</div></div>
                  </div>
                )}
                {guardados.map((g) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: '1px solid #EDEFEC' }}>
                    <span style={{ width: 36, height: 36, borderRadius: 11, background: '#0E3A44', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flex: '0 0 auto' }}>{(g.banco || '?').slice(0, 1).toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.banco}</div></div>
                    <span style={{ fontSize: 14.5, fontWeight: 700 }}>{fmtBRL(Number(g.valor))}</span>
                    <button onClick={() => { if (window.confirm('Remover este guardado?')) removerGuardado(g.id); }} aria-label="Remover" style={{ border: 'none', background: 'none', color: '#A6ADA8', fontSize: 15, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
                  </div>
                ))}
                {guardForm ? (
                  <div style={{ padding: 16, borderTop: '1px solid #EDEFEC', background: '#F7F9F7' }}>
                    <input autoFocus value={guardForm.banco} onChange={(e) => setGuardForm({ ...guardForm, banco: e.target.value })} placeholder="Banco (ex.: Nubank)" style={{ width: '100%', border: '1px solid #E6E9E6', borderRadius: 12, padding: '11px 13px', fontSize: 14, marginBottom: 9 }} />
                    <input inputMode="decimal" value={guardForm.valor} onChange={(e) => setGuardForm({ ...guardForm, valor: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarGuardado()} placeholder="Valor guardado" style={{ width: '100%', border: '1px solid #E6E9E6', borderRadius: 12, padding: '11px 13px', fontSize: 14, marginBottom: 10 }} />
                    <button onClick={salvarGuardado} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: '#13A98E', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
                    <button onClick={() => setGuardForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: '#7B8794', fontSize: 12.5, marginTop: 6, cursor: 'pointer' }}>fechar</button>
                  </div>
                ) : (
                  <button onClick={() => setGuardForm({ banco: '', valor: '' })} style={{ width: '100%', textAlign: 'center', padding: 15, color: '#13A98E', fontWeight: 700, fontSize: 14, border: 'none', background: 'none', borderTop: '1px solid #EDEFEC', cursor: 'pointer' }}>+ Adicionar guardado</button>
                )}
              </div>
            )}
          </div>
        )}

        {msg && <div style={{ fontSize: 12.5, color: '#00A99B', textAlign: 'center', marginTop: 14 }}>{msg}</div>}
      </div>
    </div>
  );
}
const rb = { width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.22)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: 'none', color: '#fff', cursor: 'pointer' };

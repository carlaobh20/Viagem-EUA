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
  const { perfil, viagem, viagens, trocarViagem, criarViagem, gerarConvite, entrarPorConvite, apagarViagem, definirFotoViagem } = useData();
  const [totais, setTotais] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
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
    const bg = v.foto
      ? `linear-gradient(150deg, rgba(8,28,38,.32) 0%, rgba(8,28,38,.62) 100%), url('${v.foto}')`
      : g.bg;
    const inkTotal = v.foto ? '#0B5563' : g.ink;
    return (
      <div onClick={() => abrir(v)} style={{ position: 'relative', margin: '0 0 16px', borderRadius: 24, overflow: 'hidden', padding: 18, minHeight: 172, color: '#fff', cursor: 'pointer', backgroundImage: bg, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 12px 26px rgba(20,40,50,.18)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', filter: i.passada ? 'saturate(.75)' : 'none', outline: ativa ? '3px solid #fff' : 'none', outlineOffset: -3 }}>
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

        {msg && <div style={{ fontSize: 12.5, color: '#00A99B', textAlign: 'center', marginTop: 14 }}>{msg}</div>}
      </div>
    </div>
  );
}
const rb = { width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.22)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: 'none', color: '#fff', cursor: 'pointer' };

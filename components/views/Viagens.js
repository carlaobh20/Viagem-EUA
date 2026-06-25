'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { fmtBRL } from '../../lib/format';

const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };
const GRADS = [
  'linear-gradient(135deg,#00C7B1 0%,#0E7490 100%)',
  'linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)',
  'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)',
  'linear-gradient(135deg,#0EA5E9 0%,#2563EB 100%)',
  'linear-gradient(135deg,#EC4899 0%,#8B5CF6 100%)',
];

export default function Viagens({ ir }) {
  const { perfil, viagem, viagens, trocarViagem, criarViagem, gerarConvite, entrarPorConvite, apagarViagem, definirFotoViagem } = useData();
  const [totais, setTotais] = useState({});
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);

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
  async function convidar() { setBusy(true); setLink(''); setMsg(''); const cod = await gerarConvite(); setBusy(false); if (!cod) { setMsg('Não consegui gerar o convite.'); return; } const base = typeof window !== 'undefined' ? window.location.origin : ''; setLink(`${base}/?convite=${cod}`); }
  function copiar() { if (link && navigator.clipboard) { navigator.clipboard.writeText(link); setMsg('Link copiado!'); } }
  async function entrar() { const cod = window.prompt('Cole o código ou o link do convite'); if (!cod) return; const codigo = cod.includes('convite=') ? cod.split('convite=')[1] : cod; setBusy(true); const r = await entrarPorConvite(codigo); setBusy(false); setMsg(r.ok ? 'Você entrou na viagem!' : (r.erro || 'Falhou.')); if (r.ok) ir('resumo'); }
  async function apagar(v, e) { e.stopPropagation(); if (!window.confirm(`Apagar "${v.nome}"? Remove a viagem e todos os dados dela para todos. Não dá pra desfazer.`)) return; const r = await apagarViagem(v.id); setMsg(r.ok ? 'Viagem apagada.' : (r.erro || 'Falhou.')); }
  async function trocarFoto(v, e) { e.stopPropagation(); const url = window.prompt('Cole o link de uma foto (URL de imagem) para a capa da viagem. Deixe em branco para remover.', v.foto || ''); if (url === null) return; await definirFotoViagem(v.id, url.trim()); }

  function Card({ v, idx }) {
    const i = info(v);
    const ativa = viagem && v.id === viagem.id;
    const bg = v.foto
      ? `linear-gradient(180deg, rgba(0,20,28,.15) 0%, rgba(0,20,28,.78) 100%), url('${v.foto}')`
      : `linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,20,28,.45) 100%), ${GRADS[idx % GRADS.length]}`;
    return (
      <div onClick={() => abrir(v)} style={{ position: 'relative', height: 168, borderRadius: 22, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', backgroundImage: bg, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 10px 26px rgba(20,28,40,.16)', filter: i.passada ? 'saturate(.7)' : 'none', outline: ativa ? '3px solid var(--ui-teal)' : 'none', outlineOffset: -3 }}>
        {/* topo: tag + ações */}
        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(4px)', padding: '5px 11px', borderRadius: 20 }}>{i.tag}</span>
          {ehDono(v) && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={(e) => trocarFoto(v, e)} aria-label="Trocar foto" style={{ border: 'none', background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(4px)', color: '#fff', width: 30, height: 30, borderRadius: '50%', fontSize: 13, cursor: 'pointer' }}>📷</button>
              <button onClick={(e) => apagar(v, e)} aria-label="Apagar" style={{ border: 'none', background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(4px)', color: '#fff', width: 30, height: 30, borderRadius: '50%', fontSize: 13, cursor: 'pointer' }}>🗑</button>
            </div>
          )}
        </div>
        {/* base: nome + datas + total */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, color: '#fff' }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px', textShadow: '0 1px 8px rgba(0,0,0,.3)' }}>{v.nome}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 3 }}>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.9)', textShadow: '0 1px 6px rgba(0,0,0,.4)' }}>{v.data_ida ? `${fmtDia(v.data_ida)}${v.data_volta ? ' → ' + fmtDia(v.data_volta) : ''}` : 'Sem datas'}</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, textShadow: '0 1px 6px rgba(0,0,0,.4)' }}>{totais[v.id] ? fmtBRL(totais[v.id]) : 'R$ 0'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '18px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ padding: '2px 2px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.7px' }}>Minhas viagens ✈️</div>
        <div style={{ fontSize: 13.5, color: 'var(--ui-muted)', marginTop: 3 }}>Toque numa viagem para entrar</div>
      </div>

      {proximas.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 2px 12px' }}>Próximas</div>}
      {proximas.map((v, i) => <Card key={v.id} v={v} idx={i} />)}

      <button onClick={criar} disabled={busy} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 16, padding: '16px', background: 'transparent', color: 'var(--ui-teal)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>+ Criar nova viagem</button>

      {passadas.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '24px 2px 12px' }}>Passadas</div>}
      {passadas.map((v, i) => <Card key={v.id} v={v} idx={i + proximas.length} />)}

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '26px 2px 12px' }}>Compartilhar a viagem ativa</div>
      <div style={{ background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)', padding: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 12, lineHeight: 1.4 }}>Gere um link de <b style={{ color: 'var(--ui-ink)' }}>{viagem?.nome || '—'}</b> e mande pra quem vai junto. Quem abrir e logar entra automaticamente.</div>
        <button onClick={convidar} disabled={busy} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{busy ? '...' : '🔗 Gerar link de convite'}</button>
        {link && (<div style={{ marginTop: 12 }}><div style={{ fontSize: 12, wordBreak: 'break-all', background: 'var(--ui-bg)', padding: '10px 12px', borderRadius: 10 }}>{link}</div><button onClick={copiar} style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 10, padding: '10px', background: 'var(--ui-card)', color: 'var(--ui-teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Copiar link</button></div>)}
        <button onClick={entrar} disabled={busy} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, cursor: 'pointer', marginTop: 12 }}>Tenho um convite — entrar por código</button>
      </div>

      {msg && <div style={{ fontSize: 12.5, color: 'var(--ui-teal)', textAlign: 'center', marginTop: 14 }}>{msg}</div>}
    </div>
  );
}

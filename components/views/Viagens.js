'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { fmtBRL } from '../../lib/format';

const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };

export default function Viagens({ ir }) {
  const { perfil, viagem, viagens, trocarViagem, criarViagem, gerarConvite, entrarPorConvite, apagarViagem } = useData();
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
    if (v.data_volta && v.data_volta < hoje) return { tag: 'concluída', cor: 'var(--ui-faint)', passada: true };
    if (v.data_ida && v.data_ida > hoje) { const d = Math.ceil((new Date(v.data_ida + 'T00:00:00') - new Date(hoje + 'T00:00:00')) / 86400000); return { tag: `faltam ${d} dias`, cor: 'var(--ui-teal)', passada: false }; }
    if (v.data_ida) return { tag: 'em viagem', cor: 'var(--ui-teal)', passada: false };
    return { tag: 'sem datas', cor: 'var(--ui-faint)', passada: false };
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
  async function apagar(v, e) { e.stopPropagation(); if (!window.confirm(`Apagar "${v.nome}"? Isso remove a viagem e todos os dados dela para todos. Não dá pra desfazer.`)) return; const r = await apagarViagem(v.id); setMsg(r.ok ? 'Viagem apagada.' : (r.erro || 'Falhou.')); }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  function Card({ v }) {
    const i = info(v);
    const ativa = viagem && v.id === viagem.id;
    return (
      <div onClick={() => abrir(v)} style={{ ...card, marginBottom: 11, padding: 16, cursor: 'pointer', opacity: i.passada ? 0.82 : 1, outline: ativa ? '2px solid var(--ui-teal)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: i.passada ? 'var(--ui-bg)' : 'rgba(0,199,177,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flex: '0 0 auto' }}>{i.passada ? '🗂️' : '🧳'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.nome}</div>
            <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 2 }}>{v.data_ida ? `${fmtDia(v.data_ida)}${v.data_volta ? ' → ' + fmtDia(v.data_volta) : ''}` : 'Sem datas'}</div>
          </div>
          {ehDono(v) && <button onClick={(e) => apagar(v, e)} aria-label="Apagar viagem" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 16, cursor: 'pointer', flex: '0 0 auto', padding: 4 }}>🗑</button>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--ui-line)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: i.cor }}>{i.tag}</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{totais[v.id] ? fmtBRL(totais[v.id]) : 'R$ 0'}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '16px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ padding: '4px 2px 18px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px' }}>Minhas viagens</div>
        <div style={{ fontSize: 13.5, color: 'var(--ui-muted)', marginTop: 3 }}>Escolha uma viagem ou comece uma nova</div>
      </div>

      {proximas.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 2px 10px' }}>Próximas</div>}
      {proximas.map((v) => <Card key={v.id} v={v} />)}

      <button onClick={criar} disabled={busy} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: '15px', background: 'transparent', color: 'var(--ui-teal)', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', marginTop: 2, marginBottom: 8 }}>+ Criar nova viagem</button>

      {passadas.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '22px 2px 10px' }}>Passadas</div>}
      {passadas.map((v) => <Card key={v.id} v={v} />)}

      {/* compartilhar */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '24px 2px 10px' }}>Compartilhar a viagem ativa</div>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 12, lineHeight: 1.4 }}>Gere um link de <b style={{ color: 'var(--ui-ink)' }}>{viagem?.nome || '—'}</b> e mande pra quem vai junto. Quem abrir e logar entra automaticamente.</div>
        <button onClick={convidar} disabled={busy} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{busy ? '...' : '🔗 Gerar link de convite'}</button>
        {link && (<div style={{ marginTop: 12 }}><div style={{ fontSize: 12, wordBreak: 'break-all', background: 'var(--ui-bg)', padding: '10px 12px', borderRadius: 10 }}>{link}</div><button onClick={copiar} style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 10, padding: '10px', background: 'var(--ui-card)', color: 'var(--ui-teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Copiar link</button></div>)}
        <button onClick={entrar} disabled={busy} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, cursor: 'pointer', marginTop: 12 }}>Tenho um convite — entrar por código</button>
      </div>

      {msg && <div style={{ fontSize: 12.5, color: 'var(--ui-teal)', textAlign: 'center', marginTop: 14 }}>{msg}</div>}
    </div>
  );
}

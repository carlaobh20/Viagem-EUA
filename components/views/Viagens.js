'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

export default function Viagens({ ir }) {
  const { viagem, viagens, trocarViagem, criarViagem, gerarConvite, entrarPorConvite } = useData();
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function criar() {
    const nome = window.prompt('Nome da nova viagem (ex.: Europa 2027)');
    if (!nome || !nome.trim()) return;
    setBusy(true);
    try { await criarViagem(nome); setMsg('Viagem criada!'); } catch (e) { setMsg('Não consegui criar.'); }
    setBusy(false);
  }
  async function convidar() {
    setBusy(true); setLink(''); setMsg('');
    const cod = await gerarConvite();
    setBusy(false);
    if (!cod) { setMsg('Não consegui gerar o convite.'); return; }
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    setLink(`${base}/?convite=${cod}`);
  }
  function copiar() { if (link && navigator.clipboard) { navigator.clipboard.writeText(link); setMsg('Link copiado!'); } }
  async function entrar() {
    const cod = window.prompt('Cole o código ou o link do convite');
    if (!cod) return;
    const codigo = cod.includes('convite=') ? cod.split('convite=')[1] : cod;
    setBusy(true);
    const r = await entrarPorConvite(codigo);
    setBusy(false);
    setMsg(r.ok ? 'Você entrou na viagem!' : (r.erro || 'Falhou.'));
  }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('resumo')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer' }}>←</button>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Minhas viagens</div>
      </div>

      {/* lista */}
      {(viagens || []).map((v) => {
        const ativa = viagem && v.id === viagem.id;
        return (
          <div key={v.id} onClick={() => !ativa && trocarViagem(v.id)} style={{ ...card, marginBottom: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: ativa ? 'default' : 'pointer', outline: ativa ? '2px solid var(--ui-teal)' : 'none' }}>
            <span style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(0,199,177,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flex: '0 0 auto' }}>🧳</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--ui-muted)' }}>{ativa ? 'Viagem ativa' : 'Tocar para abrir'}</div>
            </div>
            {ativa && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ui-teal)', background: 'rgba(0,199,177,.12)', padding: '4px 10px', borderRadius: 20 }}>ativa</span>}
          </div>
        );
      })}

      <button onClick={criar} disabled={busy} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: '14px', background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>+ Criar nova viagem</button>

      {/* compartilhar */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ui-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '24px 2px 10px' }}>Compartilhar</div>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ui-muted)', marginBottom: 12, lineHeight: 1.4 }}>Gere um link da viagem ativa (<b style={{ color: 'var(--ui-ink)' }}>{viagem?.nome}</b>) e mande pra quem vai junto. Quem abrir e fizer login entra automaticamente.</div>
        <button onClick={convidar} disabled={busy} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{busy ? '...' : '🔗 Gerar link de convite'}</button>
        {link && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, wordBreak: 'break-all', background: 'var(--ui-bg)', padding: '10px 12px', borderRadius: 10, color: 'var(--ui-ink)' }}>{link}</div>
            <button onClick={copiar} style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 10, padding: '10px', background: 'var(--ui-card)', color: 'var(--ui-teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Copiar link</button>
          </div>
        )}
        <button onClick={entrar} disabled={busy} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, cursor: 'pointer', marginTop: 12 }}>Tenho um convite — entrar por código</button>
      </div>

      {msg && <div style={{ fontSize: 12.5, color: 'var(--ui-teal)', textAlign: 'center', marginTop: 14 }}>{msg}</div>}
    </div>
  );
}

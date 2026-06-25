'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Conta({ ir }) {
  const [email, setEmail] = useState('');
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email || '');
    });
  }, []);

  async function sair() {
    setSaindo(true);
    await supabase.auth.signOut();
  }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '10px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 2px 18px' }}>
        <button onClick={() => ir('resumo')} style={{ border: 'none', background: 'var(--ui-card)', width: 38, height: 38, borderRadius: 12, fontSize: 18, cursor: 'pointer', boxShadow: 'var(--ui-shadow)', flex: '0 0 auto' }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Minha conta</div>
      </div>

      <div style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(135deg,var(--ui-teal),#0E9F97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', flex: '0 0 auto' }}>
          {email ? email[0].toUpperCase() : '👤'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>Conectado como</div>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email || '...'}</div>
        </div>
      </div>

      <button onClick={sair} disabled={saindo} style={{ width: '100%', height: 52, borderRadius: 16, border: '1px solid var(--ui-line)', background: 'var(--ui-card)', color: '#C0392B', fontSize: 15, fontWeight: 700, marginTop: 16, cursor: 'pointer', boxShadow: 'var(--ui-shadow)' }}>
        {saindo ? '...' : 'Sair da conta'}
      </button>

    </div>
  );
}

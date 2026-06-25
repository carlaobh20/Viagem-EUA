'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Conta({ ir }) {
  const [email, setEmail] = useState('');
  const [saindo, setSaindo] = useState(false);

  // mudar senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null); // { tipo: 'ok'|'erro', texto }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email || '');
    });
  }, []);

  async function sair() {
    setSaindo(true);
    await supabase.auth.signOut();
  }

  async function mudarSenha() {
    setMsg(null);
    if (novaSenha.length < 6) { setMsg({ tipo: 'erro', texto: 'A senha precisa de pelo menos 6 caracteres.' }); return; }
    if (novaSenha !== confirma) { setMsg({ tipo: 'erro', texto: 'As senhas não são iguais.' }); return; }
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setMsg({ tipo: 'ok', texto: 'Senha alterada com sucesso!' });
      setNovaSenha(''); setConfirma('');
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message || 'Não foi possível alterar a senha.' });
    } finally {
      setSalvando(false);
    }
  }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const label = { fontSize: 12.5, fontWeight: 600, color: 'var(--ui-muted)' };
  const inp = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--ui-line)', borderRadius: 13, padding: '13px 15px', fontSize: 15, background: 'var(--ui-bg)', color: 'var(--ui-ink)', marginTop: 5, outline: 'none' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '10px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 2px 18px' }}>
        <button onClick={() => ir('resumo')} style={{ border: 'none', background: 'var(--ui-card)', width: 38, height: 38, borderRadius: 12, fontSize: 18, cursor: 'pointer', boxShadow: 'var(--ui-shadow)', flex: '0 0 auto' }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Minha conta</div>
      </div>

      {/* dados do usuário */}
      <div style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(135deg,var(--ui-teal),#0E9F97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', flex: '0 0 auto' }}>
          {email ? email[0].toUpperCase() : '👤'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>Conectado como</div>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email || '...'}</div>
        </div>
      </div>

      {/* mudar senha */}
      <div style={{ ...card, padding: 18, marginTop: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Mudar senha</div>

        {msg && (
          <div style={{ fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 12, background: msg.tipo === 'ok' ? 'rgba(0,199,177,.12)' : '#FEECEC', color: msg.tipo === 'ok' ? '#0E7C73' : '#C0392B' }}>{msg.texto}</div>
        )}

        <label style={label}>Nova senha</label>
        <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••••" style={inp} />

        <label style={{ ...label, display: 'block', marginTop: 12 }}>Repetir nova senha</label>
        <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && mudarSenha()} style={inp} />

        <button onClick={mudarSenha} disabled={salvando} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,var(--ui-teal),#0E9F97)', color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 18, boxShadow: '0 8px 18px rgba(0,199,177,.28)' }}>
          {salvando ? '...' : 'Salvar nova senha'}
        </button>
      </div>

      {/* sair */}
      <button onClick={sair} disabled={saindo} style={{ width: '100%', height: 52, borderRadius: 16, border: '1px solid var(--ui-line)', background: 'var(--ui-card)', color: '#C0392B', fontSize: 15, fontWeight: 700, marginTop: 16, cursor: 'pointer', boxShadow: 'var(--ui-shadow)' }}>
        {saindo ? '...' : 'Sair da conta'}
      </button>

    </div>
  );
}

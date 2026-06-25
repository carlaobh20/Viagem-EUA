'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ modo = 'login', onVoltar }) {
  const [m, setM] = useState(modo);
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(''); const [info, setInfo] = useState(''); const [carregando, setCarregando] = useState(false);
  const T = '#00C7B1', SUB = '#6B7280';

  async function enviar() {
    setErro(''); setInfo(''); setCarregando(true);
    try {
      if (m === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        if (!data.session) setInfo('Conta criada! Confirme pelo e-mail que enviamos e depois faça login.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (e) { setErro(traduz(e.message)); } finally { setCarregando(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#E6F5FB 0%,#F7FBFD 50%,#FFFFFF 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: '#111827', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 22px', maxWidth: 460, margin: '0 auto' }}>
      {onVoltar && <button onClick={onVoltar} style={{ position: 'absolute', top: 20, left: 20, border: 'none', background: 'rgba(255,255,255,.7)', width: 38, height: 38, borderRadius: 12, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>←</button>}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ width: 58, height: 58, borderRadius: 18, background: `linear-gradient(135deg,${T},#0E9F97)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#fff', boxShadow: '0 10px 22px rgba(0,199,177,.32)' }}>✈</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', margin: '14px 0 4px' }}>{m === 'signup' ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
        <p style={{ fontSize: 14.5, color: SUB }}>{m === 'signup' ? 'Comece a organizar suas viagens.' : 'Entre para ver suas viagens.'}</p>
      </div>

      {erro && <div style={{ background: '#FEECEC', color: '#C0392B', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 12 }}>{erro}</div>}
      {info && <div style={{ background: 'rgba(0,199,177,.12)', color: '#0E7C73', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 12 }}>{info}</div>}

      <label style={{ fontSize: 12.5, fontWeight: 600, color: SUB }}>E-mail</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" style={inp} />
      <label style={{ fontSize: 12.5, fontWeight: 600, color: SUB, marginTop: 12 }}>Senha</label>
      <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && enviar()} style={inp} />

      <button onClick={enviar} disabled={carregando} style={{ width: '100%', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${T},#0E9F97)`, color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 20, boxShadow: '0 10px 22px rgba(0,199,177,.30)' }}>{carregando ? '...' : (m === 'signup' ? 'Criar conta' : 'Entrar')}</button>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: SUB }}>
        {m === 'signup'
          ? <>Já tem conta? <span onClick={() => { setM('login'); setErro(''); setInfo(''); }} style={lnk}>Entrar</span></>
          : <>Não tem conta? <span onClick={() => { setM('signup'); setErro(''); setInfo(''); }} style={lnk}>Criar agora</span></>}
      </div>
    </div>
  );
}
const inp = { width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 13, padding: '13px 15px', fontSize: 15, background: '#fff', color: '#111827', marginTop: 5, outline: 'none' };
const lnk = { color: '#00C7B1', fontWeight: 700, cursor: 'pointer' };
function traduz(msg) {
  if (/Invalid login/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/already registered/i.test(msg)) return 'Esse e-mail já tem conta. Tente entrar.';
  if (/Password should be/i.test(msg)) return 'A senha precisa de pelo menos 6 caracteres.';
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar.';
  return msg;
}

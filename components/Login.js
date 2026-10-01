'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login({ modo = 'login', onVoltar, onRecuperado }) {
  const [m, setM] = useState(modo);
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erro, setErro] = useState(''); const [info, setInfo] = useState(''); const [carregando, setCarregando] = useState(false);
  const T = '#00C7B1', SUB = '#6B7280';

  async function enviar() {
    setErro(''); setInfo(''); setCarregando(true);
    try {
      if (m === 'forgot') {
        if (!email.trim()) throw new Error('Informe o e-mail usado no aplicativo.');
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (error) throw error;
        setInfo('Se esse e-mail estiver cadastrado, enviaremos um link para criar uma nova senha. Confira também a caixa de spam.');
      } else if (m === 'recovery') {
        if (senha.length < 6) throw new Error('A senha precisa de pelo menos 6 caracteres.');
        if (senha !== confirmaSenha) throw new Error('As senhas não são iguais.');
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        setInfo('Senha alterada com sucesso!');
        if (onRecuperado) setTimeout(onRecuperado, 700);
      } else if (m === 'signup') {
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
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', margin: '14px 0 4px' }}>{m === 'signup' ? 'Criar conta' : m === 'forgot' ? 'Recuperar acesso' : m === 'recovery' ? 'Criar nova senha' : 'Bem-vindo de volta'}</h1>
        <p style={{ fontSize: 14.5, color: SUB }}>{m === 'signup' ? 'Comece a organizar suas viagens.' : m === 'forgot' ? 'Enviaremos um link para o e-mail cadastrado.' : m === 'recovery' ? 'Escolha uma senha nova para entrar no aplicativo.' : 'Entre para ver suas viagens.'}</p>
      </div>

      {erro && <div style={{ background: '#FEECEC', color: '#C0392B', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 12 }}>{erro}</div>}
      {info && <div style={{ background: 'rgba(0,199,177,.12)', color: '#0E7C73', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 12 }}>{info}</div>}

      {m !== 'recovery' && (
        <>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: SUB }}>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" style={inp} />
          {m === 'forgot' && <div style={{ fontSize: 12.5, color: SUB, lineHeight: 1.45, marginTop: 8 }}>Se o login foi criado com um e-mail que não existe, peça ao administrador para trocar o endereço ou definir uma senha nova.</div>}
        </>
      )}
      {m !== 'forgot' && (
        <>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: SUB, marginTop: 12 }}>{m === 'recovery' ? 'Nova senha' : 'Senha'}</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && m !== 'recovery' && enviar()} style={inp} />
        </>
      )}
      {m === 'recovery' && (
        <>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: SUB, marginTop: 12 }}>Repetir nova senha</label>
          <input type="password" value={confirmaSenha} onChange={(e) => setConfirmaSenha(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && enviar()} style={inp} />
        </>
      )}

      {m === 'login' && (
        <button type="button" onClick={() => { setM('forgot'); setErro(''); setInfo(''); }} style={{ alignSelf: 'flex-end', border: 'none', background: 'none', color: T, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', padding: '9px 0 0' }}>Esqueci minha senha</button>
      )}

      <button onClick={enviar} disabled={carregando} style={{ width: '100%', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${T},#0E9F97)`, color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 20, boxShadow: '0 10px 22px rgba(0,199,177,.30)' }}>{carregando ? '...' : m === 'signup' ? 'Criar conta' : m === 'forgot' ? 'Enviar link de recuperação' : m === 'recovery' ? 'Salvar nova senha' : 'Entrar'}</button>

      {m !== 'recovery' && (
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: SUB }}>
          {m === 'signup'
            ? <>Já tem conta? <span onClick={() => { setM('login'); setErro(''); setInfo(''); }} style={lnk}>Entrar</span></>
            : m === 'forgot'
              ? <><span onClick={() => { setM('login'); setErro(''); setInfo(''); }} style={lnk}>← Voltar para entrar</span></>
              : <>Não tem conta? <span onClick={() => { setM('signup'); setErro(''); setInfo(''); }} style={lnk}>Criar agora</span></>}
        </div>
      )}
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
  if (/rate limit/i.test(msg)) return 'Muitas tentativas agora. Aguarde alguns minutos e tente novamente.';
  return msg;
}

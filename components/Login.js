'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
export default function Login() {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(''); const [carregando, setCarregando] = useState(false);
  async function entrar() {
    setErro(''); setCarregando(true);
    try { const { error } = await supabase.auth.signInWithPassword({ email, password: senha }); if (error) throw error; }
    catch (e) { setErro(traduzErro(e.message)); } finally { setCarregando(false); }
  }
  return (
    <div className="auth">
      <div className="logo">✈</div>
      <h1>Viagem EUA</h1>
      <p className="lead">Controle dos gastos da família, em dólar e em real.</p>
      {erro && <div className="err">{erro}</div>}
      <div className="field"><label>E-mail</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></div>
      <div className="field"><label>Senha</label>
        <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && entrar()} /></div>
      <button className="btn-primary" onClick={entrar} disabled={carregando}>{carregando ? 'Entrando…' : 'Entrar'}</button>
      <p style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>As contas são criadas pelo administrador da viagem.</p>
    </div>
  );
}
function traduzErro(msg) {
  if (/Invalid login/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado.';
  return msg;
}

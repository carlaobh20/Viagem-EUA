'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const [modo, setModo] = useState('entrar'); // 'entrar' | 'criar'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    setErro('');
    setOk('');
    setCarregando(true);
    try {
      if (modo === 'criar') {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome } },
        });
        if (error) throw error;
        setOk('Conta criada! Se o e-mail pedir confirmação, confirme e depois entre.');
        setModo('entrar');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      }
    } catch (e) {
      setErro(traduzErro(e.message));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth">
      <div className="logo">✈</div>
      <h1>Viagem EUA</h1>
      <p className="lead">Controle dos gastos da família, em dólar e em real.</p>

      {erro && <div className="err">{erro}</div>}
      {ok && <div className="ok">{ok}</div>}

      {modo === 'criar' && (
        <div className="field">
          <label>Seu nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Carlos" />
        </div>
      )}
      <div className="field">
        <label>E-mail</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
      </div>
      <div className="field">
        <label>Senha</label>
        <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" />
      </div>

      <button className="btn-primary" onClick={enviar} disabled={carregando}>
        {carregando ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : 'Entrar'}
      </button>

      <button
        className="btn-ghost"
        style={{ marginTop: 14, alignSelf: 'center' }}
        onClick={() => {
          setModo(modo === 'criar' ? 'entrar' : 'criar');
          setErro('');
          setOk('');
        }}
      >
        {modo === 'criar' ? 'Já tenho conta — entrar' : 'Criar uma conta nova'}
      </button>
    </div>
  );
}

function traduzErro(msg) {
  if (/Invalid login/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/already registered/i.test(msg)) return 'Esse e-mail já tem conta. Faça login.';
  if (/at least 6/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  return msg;
}

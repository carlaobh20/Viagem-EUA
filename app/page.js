'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DataProvider } from '../components/DataProvider';
import Login from '../components/Login';
import Welcome from '../components/Welcome';
import AppShell from '../components/AppShell';
export default function Home() {
  const [session, setSession] = useState(null);
  const [pronto, setPronto] = useState(false);
  const [authView, setAuthView] = useState('welcome');
  const [modoApp, setModoApp] = useState(false);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setModoApp(params.get('app') === '1' || params.has('convite'));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setPronto(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  function abrirApp(view = 'login') {
    setAuthView(view);
    setModoApp(true);
    window.history.replaceState({}, '', '/?app=1');
  }
  function voltarLanding() {
    setAuthView('welcome');
    setModoApp(false);
    window.history.replaceState({}, '', '/');
  }
  if (!pronto) return <div className="center-msg">Carregando…</div>;
  if (session && recuperandoSenha) return <Login modo="recovery" onRecuperado={() => setRecuperandoSenha(false)} />;
  if (!modoApp) return <Welcome onComecar={() => abrirApp('signup')} onEntrar={() => abrirApp('login')} />;
  if (!session) return <Login modo={authView === 'welcome' ? 'login' : authView} onVoltar={voltarLanding} />;
  return (<DataProvider session={session}><AppShell /></DataProvider>);
}

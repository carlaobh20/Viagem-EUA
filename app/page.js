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
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setPronto(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!pronto) return <div className="center-msg">Carregando…</div>;
  if (session && recuperandoSenha) return <Login modo="recovery" onRecuperado={() => setRecuperandoSenha(false)} />;
  if (!session) {
    if (authView === 'welcome') return <Welcome onComecar={() => setAuthView('signup')} onEntrar={() => setAuthView('login')} />;
    return <Login modo={authView} onVoltar={() => setAuthView('welcome')} />;
  }
  return (<DataProvider session={session}><AppShell /></DataProvider>);
}

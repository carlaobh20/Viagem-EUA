'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DataProvider } from '../components/DataProvider';
import Login from '../components/Login';
import AppShell from '../components/AppShell';

export default function Home() {
  const [session, setSession] = useState(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setPronto(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!pronto) return <div className="center-msg">Carregando…</div>;
  if (!session) return <Login />;

  return (
    <DataProvider session={session}>
      <AppShell />
    </DataProvider>
  );
}

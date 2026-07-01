'use client';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useData } from './DataProvider';
import Nav from './Nav';

// telas carregadas sob demanda (cada uma vira um pedaço separado, baixado só ao abrir)
const Resumo = lazy(() => import('./views/Resumo'));
const Gastos = lazy(() => import('./views/Gastos'));
const Novo = lazy(() => import('./views/Novo'));
const Pessoas = lazy(() => import('./views/Pessoas'));
const Acerto = lazy(() => import('./views/Acerto'));
const Roteiro = lazy(() => import('./views/Roteiro'));
const Mapa = lazy(() => import('./views/Mapa'));
const Motorhome = lazy(() => import('./views/Motorhome'));
const Checklist = lazy(() => import('./views/Checklist'));
const Viagens = lazy(() => import('./views/Viagens'));
const Conta = lazy(() => import('./views/Conta'));
const Menu = lazy(() => import('./views/menu'));
const Lugares = lazy(() => import('./views/Lugares'));
const BoasVindas = lazy(() => import('./views/BoasVindas'));

const Carregando = () => <div className="center-msg">Carregando…</div>;

export default function AppShell() {
  const { carregando, viagem, erro, recarregar, entrarPorConvite, precisaNome } = useData();
  const [view, setView] = useState('viagens');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cod = new URLSearchParams(window.location.search).get('convite');
    if (cod && entrarPorConvite) {
      entrarPorConvite(cod).then((r) => { if (r && r.ok) setView('resumo'); }).finally(() => window.history.replaceState({}, '', window.location.pathname));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (carregando) return <div className="center-msg">Carregando a viagem…</div>;
  if (erro) return (
    <div className="center-msg" style={{ flexDirection: 'column', gap: 14, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Não consegui carregar</div>
      <div style={{ fontSize: 13, color: 'var(--ui-muted, #667)' }}>Pode ser a internet. Tente de novo.</div>
      <button className="btn-primary" style={{ maxWidth: 220 }} onClick={() => recarregar()}>Tentar de novo</button>
    </div>
  );
  // primeira vez da pessoa: pede o nome antes de tudo (mesmo sem viagem)
  if (precisaNome) return <Suspense fallback={<Carregando />}><BoasVindas /></Suspense>;
  const irPara = (v) => setView(v);
  // ainda sem nenhuma viagem: abre direto no lobby pra criar/entrar na primeira
  if (!viagem) return <div className="app ui-theme"><Suspense fallback={<Carregando />}><Viagens ir={irPara} /></Suspense></div>;
  return (
    <div className="app ui-theme">
      <Suspense fallback={<Carregando />}>
        {view === 'resumo' && <Resumo ir={irPara} />}
        {view === 'gastos' && <Gastos ir={irPara} />}
        {view === 'novo' && <Novo ir={irPara} />}
        {view === 'pessoas' && <Pessoas ir={irPara} />}
        {view === 'acerto' && <Acerto ir={irPara} />}
        {view === 'roteiro' && <Roteiro ir={irPara} />}
        {view === 'mapa' && <Mapa ir={irPara} />}
        {view === 'motorhome' && <Motorhome ir={irPara} />}
        {view === 'checklist' && <Checklist ir={irPara} />}
        {view === 'compras' && <Checklist ir={irPara} abaInicial="comprar" />}
        {view === 'menu' && <Menu ir={irPara} />}
        {view === 'lugares' && <Lugares ir={irPara} />}
        {view === 'viagens' && <Viagens ir={irPara} />}
        {view === 'conta' && <Conta ir={irPara} />}
      </Suspense>
      {view !== 'novo' && view !== 'viagens' && view !== 'conta' && <Nav view={view} setView={setView} />}
    </div>
  );
}

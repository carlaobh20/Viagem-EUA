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
const Frases = lazy(() => import('./views/Frases'));
const AppsInstalar = lazy(() => import('./views/AppsInstalar'));
const BoasVindas = lazy(() => import('./views/BoasVindas'));
const Diario = lazy(() => import('./views/Diario'));
const Passagens = lazy(() => import('./views/Passagens'));
const Documentos = lazy(() => import('./views/Documentos'));
const Logins = lazy(() => import('./views/Logins'));

const Carregando = () => <div className="center-msg">Carregando…</div>;

export default function AppShell() {
  const { carregando, viagem, erro, recarregar, entrarPorConvite, precisaNome, atualizarTransporteViagem } = useData();
  const [view, setView] = useState('viagens');
  const [viewParam, setViewParam] = useState(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cod = new URLSearchParams(window.location.search).get('convite');
    if (cod && entrarPorConvite) {
      entrarPorConvite(cod).then((r) => {
        if (r && r.ok) setView('resumo');
        else if (r && r.erro) window.alert(r.erro);
      }).finally(() => window.history.replaceState({}, '', '/?app=1'));
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
  const irPara = (v, param = null) => { setView(v); setViewParam(param); };
  // ainda sem nenhuma viagem: abre direto no lobby pra criar/entrar na primeira
  if (!viagem) return <div className="app ui-theme"><Suspense fallback={<Carregando />}><Viagens ir={irPara} /></Suspense></div>;
  const precisaPerguntarMotorhome = !Array.isArray(viagem.transporte) || viagem.transporte.length === 0;
  async function responderMotorhome(sim) {
    setSalvandoPerfil(true);
    await atualizarTransporteViagem(sim ? ['motorhome'] : ['outro']);
    setSalvandoPerfil(false);
  }
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
        {view === 'motorhome' && <Motorhome ir={irPara} abaInicial={viewParam} />}
        {view === 'checklist' && <Checklist ir={irPara} />}
        {view === 'compras' && <Checklist ir={irPara} abaInicial="comprar" />}
        {view === 'menu' && <Menu ir={irPara} />}
        {view === 'lugares' && <Lugares ir={irPara} />}
        {view === 'frases' && <Frases ir={irPara} categoriaInicial={viewParam} />}
        {view === 'appsinstalar' && <AppsInstalar ir={irPara} />}
        {view === 'diario' && <Diario ir={irPara} />}
        {view === 'passagens' && <Passagens ir={irPara} />}
        {view === 'documentos' && <Documentos ir={irPara} />}
        {view === 'logins' && <Logins ir={irPara} />}
        {view === 'viagens' && <Viagens ir={irPara} />}
        {view === 'conta' && <Conta ir={irPara} />}
      </Suspense>
      {view !== 'novo' && view !== 'viagens' && view !== 'conta' && <Nav view={view} setView={(v) => irPara(v)} />}
      {precisaPerguntarMotorhome && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,22,28,.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div className="ui-card" style={{ width: '100%', maxWidth: 390, padding: 22, textAlign: 'center', boxShadow: '0 24px 70px rgba(0,0,0,.28)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--ui-teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 31, margin: '0 auto 14px' }}>🚐</div>
            <div className="ui-h2" style={{ fontSize: 21 }}>Esta viagem terá motorhome?</div>
            <div className="ui-caption" style={{ fontSize: 13.5, margin: '7px auto 18px', maxWidth: 310 }}>Se tiver, mostramos uma área especial para reservas, quilometragem, custos e diário do RV. Você pode mudar isso depois em Menu.</div>
            <button disabled={salvandoPerfil} onClick={() => responderMotorhome(true)} className="ui-btn ui-btn-primary lg" style={{ width: '100%' }}>Sim, vamos de motorhome</button>
            <button disabled={salvandoPerfil} onClick={() => responderMotorhome(false)} className="ui-btn ui-btn-secondary" style={{ width: '100%', marginTop: 8 }}>Não nesta viagem</button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useData } from './DataProvider';
import Nav from './Nav';
import Resumo from './views/Resumo';
import Gastos from './views/Gastos';
import Novo from './views/Novo';
import Pessoas from './views/Pessoas';
import Acerto from './views/Acerto';
import Roteiro from './views/Roteiro';
import Mapa from './views/Mapa';
import Motorhome from './views/Motorhome';
import Checklist from './views/Checklist';
import Viagens from './views/Viagens';
import Conta from './views/Conta';
export default function AppShell() {
  const { carregando, viagem, erro, recarregar, entrarPorConvite } = useData();
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
  if (erro || !viagem) return (
    <div className="center-msg" style={{ flexDirection: 'column', gap: 14, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Não consegui carregar a viagem</div>
      <div style={{ fontSize: 13, color: 'var(--ui-muted, #667)' }}>Pode ser a internet. Tente de novo.</div>
      <button className="btn-primary" style={{ maxWidth: 220 }} onClick={() => recarregar()}>Tentar de novo</button>
    </div>
  );
  const irPara = (v) => setView(v);
  return (
    <div className="app ui-theme">
      {view === 'resumo' && <Resumo ir={irPara} />}
      {view === 'gastos' && <Gastos ir={irPara} />}
      {view === 'novo' && <Novo ir={irPara} />}
      {view === 'pessoas' && <Pessoas ir={irPara} />}
      {view === 'acerto' && <Acerto ir={irPara} />}
      {view === 'roteiro' && <Roteiro ir={irPara} />}
      {view === 'mapa' && <Mapa ir={irPara} />}
      {view === 'motorhome' && <Motorhome ir={irPara} />}
      {view === 'checklist' && <Checklist ir={irPara} />}
      {view === 'viagens' && <Viagens ir={irPara} />}
      {view === 'conta' && <Conta ir={irPara} />}
      {view !== 'novo' && view !== 'viagens' && view !== 'conta' && <Nav view={view} setView={setView} />}
    </div>
  );
}

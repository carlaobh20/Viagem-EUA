'use client';
import { useState } from 'react';
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
export default function AppShell() {
  const { carregando, viagem, erro, recarregar } = useData();
  const [view, setView] = useState('resumo');
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
      {view !== 'novo' && <Nav view={view} setView={setView} />}
    </div>
  );
}

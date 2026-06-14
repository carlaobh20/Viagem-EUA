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
export default function AppShell() {
  const { carregando, viagem } = useData();
  const [view, setView] = useState('resumo');
  if (carregando) return <div className="center-msg">Carregando a viagem…</div>;
  const irPara = (v) => setView(v);
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand"><span className="mark" aria-hidden="true">✈</span>{viagem?.nome || 'Viagem'}</div>
        <button className="rate" onClick={() => setView('acerto')} style={{ border: 0, cursor: 'pointer' }}>Câmbio R$ {Number(viagem?.cotacao_usd || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</button>
      </div>
      {view === 'resumo' && <Resumo ir={irPara} />}
      {view === 'gastos' && <Gastos ir={irPara} />}
      {view === 'novo' && <Novo ir={irPara} />}
      {view === 'pessoas' && <Pessoas ir={irPara} />}
      {view === 'acerto' && <Acerto ir={irPara} />}
      {view === 'roteiro' && <Roteiro ir={irPara} />}
      {view !== 'novo' && <Nav view={view} setView={setView} />}
    </div>
  );
}

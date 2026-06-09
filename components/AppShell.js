'use client';

import { useState } from 'react';
import { useData } from './DataProvider';
import { supabase } from '../lib/supabaseClient';
import Nav from './Nav';
import Resumo from './views/Resumo';
import Gastos from './views/Gastos';
import Novo from './views/Novo';
import Pessoas from './views/Pessoas';
import Acerto from './views/Acerto';
import Roteiro from './views/Roteiro';

export default function AppShell() {
  const { carregando, viagem, perfil, recarregar } = useData();
  const [view, setView] = useState('resumo');

  if (carregando) {
    return <div className="center-msg">Carregando a viagem…</div>;
  }

  const irPara = (v) => setView(v);

  async function editarNome() {
    const novo = window.prompt('Como você quer aparecer no app?', perfil?.nome || '');
    if (novo && novo.trim()) {
      await supabase.from('perfis').update({ nome: novo.trim() }).eq('id', perfil.id);
      await recarregar();
    }
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true">✈</span>
          {viagem?.nome || 'Viagem'}
        </div>
        <button
          className="rate"
          onClick={() => setView('resumo')}
          style={{ border: 0, cursor: 'pointer' }}
        >
          USD {Number(viagem?.cotacao_usd || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </button>
      </div>

      {view === 'resumo' && <Resumo ir={irPara} />}
      {view === 'gastos' && <Gastos ir={irPara} />}
      {view === 'novo' && <Novo ir={irPara} />}
      {view === 'pessoas' && <Pessoas ir={irPara} />}
      {view === 'acerto' && <Acerto ir={irPara} />}
      {view === 'roteiro' && <Roteiro ir={irPara} />}

      {view !== 'novo' && view !== 'roteiro' && <Nav view={view} setView={setView} />}

      {view === 'pessoas' && (
        <div style={{ textAlign: 'center', paddingBottom: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={editarNome}>Editar meu nome</button>
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sair da conta</button>
        </div>
      )}
    </div>
  );
}

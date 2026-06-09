'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ session, children }) {
  const [perfil, setPerfil] = useState(null);
  const [viagem, setViagem] = useState(null);
  const [perfis, setPerfis] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [divisoes, setDivisoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const uid = session.user.id;

    // Garante que o perfil do usuário logado existe
    let { data: meu } = await supabase.from('perfis').select('*').eq('id', uid).maybeSingle();
    if (!meu) {
      const nome = session.user.user_metadata?.nome || session.user.email.split('@')[0];
      const cor = corAleatoria();
      await supabase.from('perfis').insert({ id: uid, nome, cor });
      const r = await supabase.from('perfis').select('*').eq('id', uid).maybeSingle();
      meu = r.data;
    }
    setPerfil(meu);

    // Pega a viagem (a família compartilha uma só). Cria uma padrão se não houver.
    let { data: v } = await supabase.from('viagens').select('*').order('criado_em').limit(1).maybeSingle();
    if (!v) {
      const r = await supabase
        .from('viagens')
        .insert({ nome: 'Viagem EUA', orcamento_brl: 35000, cotacao_usd: 5.4 })
        .select()
        .single();
      v = r.data;
    }
    setViagem(v);

    const [{ data: ps }, { data: pts }, { data: gs }] = await Promise.all([
      supabase.from('perfis').select('*'),
      supabase.from('pontos_roteiro').select('*').eq('viagem_id', v.id).order('ordem'),
      supabase.from('gastos').select('*').eq('viagem_id', v.id).order('data', { ascending: false }),
    ]);
    setPerfis(ps || []);
    setPontos(pts || []);
    setGastos(gs || []);

    const ids = (gs || []).map((g) => g.id);
    if (ids.length) {
      const { data: dv } = await supabase.from('gasto_divisao').select('*').in('gasto_id', ids);
      setDivisoes(dv || []);
    } else {
      setDivisoes([]);
    }

    setCarregando(false);
  }, [session]);

  useEffect(() => {
    carregar();
    // Tempo real: qualquer mudança recarrega os dados
    const canal = supabase
      .channel('viagem-mudancas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gasto_divisao' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viagens' }, carregar)
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [carregar]);

  // --- Ações ---

  async function salvarGasto({ descricao, valor, moeda, categoria, pagoPor, pontoId, data, participantes }) {
    const { data: novo, error } = await supabase
      .from('gastos')
      .insert({
        viagem_id: viagem.id,
        descricao,
        valor,
        moeda,
        categoria,
        pago_por: pagoPor,
        ponto_id: pontoId || null,
        data,
      })
      .select()
      .single();
    if (error) throw error;

    const linhas = participantes.map((p) => ({
      gasto_id: novo.id,
      perfil_id: p.id,
      partes: p.partes,
    }));
    await supabase.from('gasto_divisao').insert(linhas);
    await carregar();
  }

  async function atualizarCotacao(cotacao) {
    await supabase.from('viagens').update({ cotacao_usd: cotacao }).eq('id', viagem.id);
    await carregar();
  }

  async function atualizarOrcamento(orcamento) {
    await supabase.from('viagens').update({ orcamento_brl: orcamento }).eq('id', viagem.id);
    await carregar();
  }

  async function removerGasto(id) {
    await supabase.from('gastos').delete().eq('id', id);
    await carregar();
  }

  const value = {
    perfil,
    viagem,
    perfis,
    pontos,
    gastos,
    divisoes,
    carregando,
    salvarGasto,
    atualizarCotacao,
    atualizarOrcamento,
    removerGasto,
    recarregar: carregar,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function corAleatoria() {
  const cores = ['#534AB7', '#D4537E', '#0F6E56', '#BA7517', '#185FA5', '#993C1D'];
  return cores[Math.floor(Math.random() * cores.length)];
}

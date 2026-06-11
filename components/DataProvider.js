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
  const [acertos, setAcertos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gastoEditando, setGastoEditando] = useState(null);

  const carregar = useCallback(async () => {
    const uid = session.user.id;
    let { data: meu } = await supabase.from('perfis').select('*').eq('user_id', uid).maybeSingle();
    if (!meu) {
      const nome = session.user.user_metadata?.nome || session.user.email.split('@')[0];
      await supabase.from('perfis').insert({ user_id: uid, nome, cor: corAleatoria() });
      const r = await supabase.from('perfis').select('*').eq('user_id', uid).maybeSingle();
      meu = r.data;
    }
    setPerfil(meu);
    let { data: v } = await supabase.from('viagens').select('*').order('criado_em').limit(1).maybeSingle();
    if (!v) {
      const r = await supabase.from('viagens').insert({ nome: 'Viagem EUA', orcamento_brl: 35000, cotacao_usd: 5.4 }).select().single();
      v = r.data;
    }
    setViagem(v);
    const [{ data: ps }, { data: pts }, { data: gs }, { data: acs }] = await Promise.all([
      supabase.from('perfis').select('*').order('criado_em'),
      supabase.from('pontos_roteiro').select('*').eq('viagem_id', v.id).order('ordem'),
      supabase.from('gastos').select('*').eq('viagem_id', v.id).order('data', { ascending: false }),
      supabase.from('acertos').select('*').eq('viagem_id', v.id).order('criado_em', { ascending: false }),
    ]);
    setPerfis(ps || []); setPontos(pts || []); setGastos(gs || []); setAcertos(acs || []);
    const ids = (gs || []).map((g) => g.id);
    if (ids.length) { const { data: dv } = await supabase.from('gasto_divisao').select('*').in('gasto_id', ids); setDivisoes(dv || []); }
    else setDivisoes([]);
    setCarregando(false);
  }, [session]);

  useEffect(() => {
    carregar();
    const canal = supabase.channel('viagem-mudancas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gasto_divisao' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viagens' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfis' }, carregar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acertos' }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [carregar]);

  async function subirRecibo(file) {
    const path = `${viagem.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage.from('recibos').upload(path, file, { contentType: 'image/jpeg', upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('recibos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function salvarGasto({ descricao, valor, moeda, categoria, pagoPor, pontoId, data, participantes, reciboFile }) {
    let recibo_url = null;
    if (reciboFile) recibo_url = await subirRecibo(reciboFile);
    const { data: novo, error } = await supabase.from('gastos').insert({
      viagem_id: viagem.id, descricao, valor, moeda, categoria, pago_por: pagoPor, ponto_id: pontoId || null, data, recibo_url,
    }).select().single();
    if (error) throw error;
    const linhas = participantes.map((p) => ({ gasto_id: novo.id, perfil_id: p.id, partes: p.partes }));
    await supabase.from('gasto_divisao').insert(linhas);
    await carregar();
  }

  async function atualizarGasto({ id, descricao, valor, moeda, categoria, pagoPor, pontoId, data, participantes, reciboFile, reciboUrlAtual }) {
    let recibo_url = reciboUrlAtual || null;
    if (reciboFile) recibo_url = await subirRecibo(reciboFile);
    const { error } = await supabase.from('gastos').update({ descricao, valor, moeda, categoria, pago_por: pagoPor, ponto_id: pontoId || null, data, recibo_url }).eq('id', id);
    if (error) throw error;
    await supabase.from('gasto_divisao').delete().eq('gasto_id', id);
    const linhas = participantes.map((p) => ({ gasto_id: id, perfil_id: p.id, partes: p.partes }));
    await supabase.from('gasto_divisao').insert(linhas);
    await carregar();
  }

  async function registrarAcerto({ de, para, valor }) {
    await supabase.from('acertos').insert({ viagem_id: viagem.id, de, para, valor, data: new Date().toISOString().slice(0, 10) });
    await carregar();
  }
  async function removerAcerto(id) { await supabase.from('acertos').delete().eq('id', id); await carregar(); }

  async function adicionarPessoa(nome) { await supabase.from('perfis').insert({ nome: nome.trim(), cor: corAleatoria() }); await carregar(); }
  async function atualizarNomePessoa(id, nome) { await supabase.from('perfis').update({ nome: nome.trim() }).eq('id', id); await carregar(); }
  async function removerPessoa(id) { const { error } = await supabase.from('perfis').delete().eq('id', id); await carregar(); return error; }
  async function atualizarCotacao(cotacao) { await supabase.from('viagens').update({ cotacao_usd: cotacao }).eq('id', viagem.id); await carregar(); }
  async function atualizarOrcamento(orcamento) { await supabase.from('viagens').update({ orcamento_brl: orcamento }).eq('id', viagem.id); await carregar(); }
  async function removerGasto(id) { await supabase.from('gastos').delete().eq('id', id); await carregar(); }

  const value = { perfil, viagem, perfis, pontos, gastos, divisoes, acertos, carregando, gastoEditando, setGastoEditando, salvarGasto, atualizarGasto, registrarAcerto, removerAcerto, adicionarPessoa, atualizarNomePessoa, removerPessoa, atualizarCotacao, atualizarOrcamento, removerGasto, recarregar: carregar };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
function corAleatoria() { const cores = ['#534AB7', '#D4537E', '#0F6E56', '#BA7517', '#185FA5', '#993C1D']; return cores[Math.floor(Math.random() * cores.length)]; }

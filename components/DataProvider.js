'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);
export function DataProvider({ session, children }) {
  const [perfil, setPerfil] = useState(null);
  const [viagem, setViagem] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [divisoes, setDivisoes] = useState([]);
  const [acertos, setAcertos] = useState([]);
  const [registrosKm, setRegistrosKm] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [gastoEditando, setGastoEditando] = useState(null);

  const carregar = useCallback(async () => {
    try {
    const uid = session.user.id;
    let { data: meu } = await supabase.from('perfis').select('*').eq('user_id', uid).maybeSingle();
    if (!meu) {
      const nome = session.user.user_metadata?.nome || session.user.email.split('@')[0];
      await supabase.from('perfis').insert({ user_id: uid, nome, cor: corAleatoria() });
      const r = await supabase.from('perfis').select('*').eq('user_id', uid).maybeSingle();
      meu = r.data;
    }
    setPerfil(meu);
    // viagens das quais sou membro
    const { data: ms } = await supabase.from('viagem_membros').select('viagem_id').eq('user_id', uid);
    const vids = (ms || []).map((m) => m.viagem_id);
    let vs = [];
    if (vids.length) { const r = await supabase.from('viagens').select('*').in('id', vids).order('criado_em'); vs = r.data || []; }
    if (!vs.length) {
      const r = await supabase.from('viagens').insert({ nome: 'Minha viagem', orcamento_brl: 0, cotacao_usd: 5.4, owner_id: uid }).select().single();
      if (r.data) { await supabase.from('viagem_membros').insert({ viagem_id: r.data.id, user_id: uid, papel: 'dono' }); vs = [r.data]; }
    }
    setViagens(vs);
    const savedId = (typeof window !== 'undefined' && window.localStorage.getItem('viagemAtiva')) || null;
    const v = vs.find((x) => x.id === savedId) || vs[0];
    setViagem(v);
    if (!v) { setErro('Você ainda não está em nenhuma viagem.'); setCarregando(false); return; }
    const [{ data: ps }, { data: pts }, { data: gs }, { data: acs }, { data: rk }, { data: ck }] = await Promise.all([
      supabase.from('perfis').select('*').order('criado_em'),
      supabase.from('pontos_roteiro').select('*').eq('viagem_id', v.id).order('ordem'),
      supabase.from('gastos').select('*').eq('viagem_id', v.id).order('data', { ascending: false }),
      supabase.from('acertos').select('*').eq('viagem_id', v.id).order('criado_em', { ascending: false }),
      supabase.from('registros_km').select('*').eq('viagem_id', v.id).order('data', { ascending: false }),
      supabase.from('checklist_itens').select('*').eq('viagem_id', v.id).order('ordem'),
    ]);
    setPerfis(ps || []); setPontos(pts || []); setGastos(gs || []); setAcertos(acs || []); setRegistrosKm(rk || []); setChecklist(ck || []);
    const ids = (gs || []).map((g) => g.id);
    if (ids.length) { const { data: dv } = await supabase.from('gasto_divisao').select('*').in('gasto_id', ids); setDivisoes(dv || []); }
    else setDivisoes([]);
    setErro(null);
    } catch (e) { setErro((e && e.message) || 'Falha ao carregar a viagem.'); }
    finally { setCarregando(false); }
  }, [session]);

  useEffect(() => {
    carregar();
    let t;
    const deb = () => { clearTimeout(t); t = setTimeout(() => carregar(), 400); };
    const canal = supabase.channel('viagem-mudancas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, deb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gasto_divisao' }, deb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viagens' }, deb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfis' }, deb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acertos' }, deb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros_km' }, deb)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_itens' }, deb)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(canal); };
  }, [carregar]);

  async function subirRecibo(file) {
    const path = `${viagem.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage.from('recibos').upload(path, file, { contentType: 'image/jpeg', upsert: false });
    if (error) return null;
    return path; // guarda o caminho; a URL é assinada na hora de ver
  }

  async function urlRecibo(ref) {
    if (!ref) return null;
    if (ref.startsWith('http')) return ref; // recibos antigos (URL pública)
    const { data } = await supabase.storage.from('recibos').createSignedUrl(ref, 3600);
    return (data && data.signedUrl) || null;
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

  async function registrarAcerto({ de, para, valor, moeda }) {
    await supabase.from('acertos').insert({ viagem_id: viagem.id, de, para, valor, moeda: moeda || 'BRL', data: new Date().toISOString().slice(0, 10) });
    await carregar();
  }
  async function removerAcerto(id) { await supabase.from('acertos').delete().eq('id', id); await carregar(); }

  async function adicionarPessoa(nome) { await supabase.from('perfis').insert({ nome: nome.trim(), cor: corAleatoria() }); await carregar(); }
  async function atualizarNomePessoa(id, nome) { await supabase.from('perfis').update({ nome: nome.trim() }).eq('id', id); await carregar(); }
  async function removerPessoa(id) { const { error } = await supabase.from('perfis').delete().eq('id', id); await carregar(); return error; }
  async function atualizarCotacao(cotacao) { await supabase.from('viagens').update({ cotacao_usd: cotacao }).eq('id', viagem.id); await carregar(); }
  async function atualizarOrcamento(orcamento) { await supabase.from('viagens').update({ orcamento_brl: orcamento }).eq('id', viagem.id); await carregar(); }
  async function removerGasto(id) { await supabase.from('gastos').delete().eq('id', id); await carregar(); }
  async function adicionarKm({ km, valorOrigem, unidade, data, origem, destino, nota }) { await supabase.from('registros_km').insert({ viagem_id: viagem.id, km, valor_origem: valorOrigem, unidade, data: data || null, origem: origem || null, destino: destino || null, nota: nota || null }); await carregar(); }
  async function removerKm(id) { await supabase.from('registros_km').delete().eq('id', id); await carregar(); }
  async function adicionarChecklist({ texto, tema, prazo, ordem }) { await supabase.from('checklist_itens').insert({ viagem_id: viagem.id, texto, tema: tema || 'Geral', prazo: prazo || null, ordem: ordem || 0 }); await carregar(); }
  async function alternarChecklist(id, feito) { await supabase.from('checklist_itens').update({ feito }).eq('id', id); await carregar(); }
  async function editarChecklist(id, texto) { await supabase.from('checklist_itens').update({ texto }).eq('id', id); await carregar(); }
  async function removerChecklist(id) { await supabase.from('checklist_itens').delete().eq('id', id); await carregar(); }
  async function semearChecklist(itens) { if (!itens || !itens.length) return; await supabase.from('checklist_itens').insert(itens.map((it) => ({ ...it, viagem_id: viagem.id }))); await supabase.from('viagens').update({ checklist_seed: true }).eq('id', viagem.id); await carregar(); }

  function trocarViagem(id) { if (typeof window !== 'undefined') window.localStorage.setItem('viagemAtiva', id); carregar(); }
  async function criarViagem(nome) {
    const uid = session.user.id;
    const { data: nv, error } = await supabase.from('viagens').insert({ nome: (nome || 'Nova viagem').trim(), orcamento_brl: 0, cotacao_usd: 5.4, owner_id: uid }).select().single();
    if (error) throw error;
    await supabase.from('viagem_membros').insert({ viagem_id: nv.id, user_id: uid, papel: 'dono' });
    if (typeof window !== 'undefined') window.localStorage.setItem('viagemAtiva', nv.id);
    await carregar();
    return nv;
  }
  async function gerarConvite() {
    const codigo = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from('convites').insert({ viagem_id: viagem.id, codigo, criado_por: session.user.id });
    if (error) return null;
    return codigo;
  }
  async function entrarPorConvite(codigo) {
    const cod = (codigo || '').trim().toUpperCase();
    if (!cod) return { erro: 'Informe o código.' };
    const { data: c } = await supabase.from('convites').select('*').eq('codigo', cod).eq('ativo', true).maybeSingle();
    if (!c) return { erro: 'Convite inválido ou expirado.' };
    await supabase.from('viagem_membros').upsert({ viagem_id: c.viagem_id, user_id: session.user.id, papel: 'membro' }, { onConflict: 'viagem_id,user_id' });
    if (typeof window !== 'undefined') window.localStorage.setItem('viagemAtiva', c.viagem_id);
    await carregar();
    return { ok: true };
  }

  const value = { perfil, viagem, viagens, trocarViagem, criarViagem, gerarConvite, entrarPorConvite, perfis, pontos, gastos, divisoes, acertos, carregando, gastoEditando, setGastoEditando, salvarGasto, atualizarGasto, registrarAcerto, removerAcerto, adicionarPessoa, atualizarNomePessoa, removerPessoa, atualizarCotacao, atualizarOrcamento, removerGasto, registrosKm, adicionarKm, removerKm, checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist, semearChecklist, urlRecibo, erro, recarregar: carregar };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
function corAleatoria() { const cores = ['#534AB7', '#D4537E', '#0F6E56', '#BA7517', '#185FA5', '#993C1D']; return cores[Math.floor(Math.random() * cores.length)]; }

'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

// Conteúdo estático (sem banco, sem dado de usuário, zero risco novo).
const GRUPOS = [
  { id: 'essencial', label: 'Essencial', emoji: '⭐', apps: [
    { nome: 'Google Maps', funcao: 'Navegação e trajeto no carro/motorhome.', beneficio: 'Funciona com mapa baixado offline — salva quando o sinal falhar na estrada.' },
    { nome: 'Google Tradutor', funcao: 'Traduzir texto, voz e placas pela câmera.', beneficio: 'Baixa o pacote de inglês offline antes de viajar; usa sem internet.' },
    { nome: 'GasBuddy', funcao: 'Achar o posto de gasolina mais barato perto de você.', beneficio: 'Economiza real de verdade em viagem longa de motorhome.' },
  ] },
  { id: 'transporte', label: 'Transporte', emoji: '🚗', apps: [
    { nome: 'Uber ou Lyft', funcao: 'Corridas quando não estiver com o carro/motorhome.', beneficio: 'Cadastra o cartão antes de viajar — evita ficar sem opção na hora.' },
    { nome: 'RVezy / RV Trip Wizard (se for motorhome alugado)', funcao: 'Achar RV parks e pontos de apoio na rota.', beneficio: 'Mostra estacionamento e infraestrutura pra motorhome especificamente.' },
    { nome: 'Waze', funcao: 'Trânsito em tempo real e alerta de polícia/radar.', beneficio: 'Complementa o Google Maps em cidade grande.' },
  ] },
  { id: 'dinheiro', label: 'Dinheiro', emoji: '💳', apps: [
    { nome: 'App do seu banco/cartão internacional', funcao: 'Ver fatura e bloquear cartão na hora, se precisar.', beneficio: 'Ativa notificação de compra — percebe fraude na hora.' },
    { nome: 'XE Currency', funcao: 'Cotação de dólar atualizada, mesmo offline.', beneficio: 'Confere se o preço em USD está justo, sem depender de internet.' },
  ] },
  { id: 'lugares', label: 'Lugares e passeio', emoji: '🗽', apps: [
    { nome: 'Yelp ou Google (avaliações)', funcao: 'Ver nota e foto de restaurante/atração antes de ir.', beneficio: 'Evita perder tempo em lugar ruim.' },
    { nome: 'AllTrails', funcao: 'Trilhas de parques nacionais com mapa e dificuldade.', beneficio: 'Mostra a trilha certa pro nível da família, com avaliação de outros visitantes.' },
    { nome: 'App do parque (ex.: National Park Service)', funcao: 'Horário, mapa e alerta do parque que for visitar.', beneficio: 'Alguns parques exigem reserva de horário — evita ser barrado na entrada.' },
  ] },
  { id: 'comunicacao', label: 'Comunicação', emoji: '📶', apps: [
    { nome: 'WhatsApp', funcao: 'Manter contato com quem ficou no Brasil.', beneficio: 'Funciona por wi-fi, sem gastar o plano de dados americano.' },
    { nome: 'eSIM (Airalo, Holafly ou operadora local)', funcao: 'Internet no celular durante a viagem.', beneficio: 'Configura antes de embarcar — chega e já usa, sem depender de wi-fi de hotel.' },
  ] },
  { id: 'combustivel', label: 'Postos e combustível', emoji: '⛽', apps: [
    { nome: 'Upside', funcao: 'Mostra postos perto de você com cashback. Resgata a oferta no app, abastece com o cartão normal e o desconto (US$ 0,10 a 0,25/galão) cai na conta pra sacar depois.', beneficio: 'Num tanque de 60 galões dá pra economizar uns US$ 15 num abastecimento só.' },
    { nome: 'Pilot Flying J (myRewards Plus)', funcao: 'Rede de postos oficial de quem viaja de motorhome. Desconto automático de US$ 0,10/galão.', beneficio: 'Pontos trocam por banho grátis, café e desconto na estação de despejo de esgoto do motorhome.' },
    { nome: 'Shell Fuel Rewards / BPme', funcao: 'Digita seu número de telefone americano no teclado da bomba antes de passar o cartão.', beneficio: 'Desconto instantâneo na hora, geralmente US$ 0,05 a 0,10 a menos por galão.' },
  ] },
  { id: 'supermercado', label: 'Supermercado', emoji: '🛒', apps: [
    { nome: 'Target Circle', funcao: 'Programa de desconto da Target, ativado pelo número de celular.', beneficio: 'Descontos de até 20% em categorias específicas + 1% de cashback em tudo.' },
    { nome: 'Kroger / Safeway / Albertsons (Member Price)', funcao: 'No caixa, coloca o número de telefone americano na maquininha pra destravar o "Member Price".', beneficio: 'Preço de membro costuma ser até 30% mais barato em carne, pão e snacks.' },
    { nome: 'Ibotta / Fetch Rewards', funcao: 'Depois da compra, tira foto do recibo no app.', beneficio: 'O app identifica os produtos e devolve dinheiro na hora — saque exige verificação por SMS americano.' },
  ] },
  { id: 'fastfood', label: 'Fast food na estrada', emoji: '🍔', apps: [
    { nome: 'McDonald\'s / Wendy\'s / Burger King', funcao: 'Baixa o app (verifica por SMS) e olha a aba "Deals" antes de pedir.', beneficio: 'Ofertas tipo "leve 2 pague 1" ou 20% acima de US$ 10 — de US$ 8 a 15 de economia por parada com a família.' },
    { nome: 'Chick-fil-A / Domino\'s', funcao: 'Programa de pontos por compra.', beneficio: 'Depois de algumas compras no Domino\'s, ganha uma pizza média grátis — economiza um jantar no motorhome.' },
  ] },
  { id: 'outlets', label: 'Compras e outlets', emoji: '🛍️', apps: [
    { nome: 'Simon Premium Outlets (VIP Shopper Club)', funcao: 'Cadastra com o número americano e libera um "Coupon Book" digital.', beneficio: 'Desconto extra de 15-20% em cima das promoções que já são boas da loja.' },
    { nome: 'Macy\'s / Kohl\'s (SMS "SAVE")', funcao: 'No caixa, manda SMS com a palavra SAVE pro número da loja e recebe um código de barras na hora.', beneficio: '20% de desconto na compra — só funciona com linha americana de verdade.' },
  ] },
];

export default function AppsInstalar({ ir }) {
  const { appsInstalar, adicionarApp, removerApp } = useData();
  const [aberto, setAberto] = useState('essencial');
  const [addForm, setAddForm] = useState(null); // { nome, funcao, beneficio }
  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, background: 'var(--ui-bg)', color: 'var(--ui-ink)' };

  function salvarAdd() {
    if (!addForm || !addForm.nome.trim()) { setAddForm(null); return; }
    adicionarApp(addForm);
    setAddForm(null);
  }

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('menu')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Apps pra instalar</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Baixe antes de embarcar</div>
        </div>
      </div>

      {/* Adicionados pela família — editável, compartilhado com quem está na viagem */}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)', margin: '0 4px 10px' }}>ADICIONADOS POR VOCÊS</div>

      {(appsInstalar || []).length === 0 && !addForm && (
        <div style={{ ...card, padding: 20, textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, marginBottom: 12 }}>
          Nenhum app adicionado ainda.
        </div>
      )}

      {(appsInstalar || []).map((a) => (
        <div key={a.id} style={{ ...card, padding: 15, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{a.nome}</div>
              {a.funcao && <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 3 }}>{a.funcao}</div>}
              {a.beneficio && <div style={{ fontSize: 12.5, color: 'var(--ui-teal)', marginTop: 5, display: 'flex', gap: 6 }}><span>✓</span><span>{a.beneficio}</span></div>}
            </div>
            <button onClick={() => { if (window.confirm('Remover este app?')) removerApp(a.id); }} aria-label="Remover" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 15, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
          </div>
        </div>
      ))}

      {addForm ? (
        <div style={{ ...card, padding: 16, marginBottom: 20 }}>
          <input autoFocus value={addForm.nome} onChange={(e) => setAddForm({ ...addForm, nome: e.target.value })} placeholder="Nome do app" style={{ ...inp, marginBottom: 9 }} />
          <input value={addForm.funcao} onChange={(e) => setAddForm({ ...addForm, funcao: e.target.value })} placeholder="Função (pra que serve)" style={{ ...inp, marginBottom: 9 }} />
          <input value={addForm.beneficio} onChange={(e) => setAddForm({ ...addForm, beneficio: e.target.value })} placeholder="Benefício (por que instalar)" style={{ ...inp, marginBottom: 12 }} />
          <button onClick={salvarAdd} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
          <button onClick={() => setAddForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, marginTop: 6, cursor: 'pointer' }}>fechar</button>
        </div>
      ) : (
        <button onClick={() => setAddForm({ nome: '', funcao: '', beneficio: '' })} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: 14, background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 22 }}>+ Adicionar app</button>
      )}

      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)', margin: '0 4px 6px' }}>SUGESTÕES</div>
      <div style={{ fontSize: 12, color: 'var(--ui-faint)', margin: '0 4px 10px', lineHeight: 1.4 }}>💡 Vários apps de economia (combustível, mercado, fast food, outlets) só liberam o desconto com um <strong>número de celular americano</strong> — vale ativar um chip local antes de embarcar.</div>

      {GRUPOS.map((g) => {
        const on = aberto === g.id;
        return (
          <div key={g.id} style={{ ...card, marginBottom: 12, overflow: 'hidden' }}>
            <button onClick={() => setAberto(on ? null : g.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: 15, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 18 }}>{g.emoji}</span>
              <span style={{ flex: 1, fontSize: 15.5, fontWeight: 700 }}>{g.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ui-faint)' }}>{g.apps.length}</span>
              <span style={{ color: 'var(--ui-faint)', fontSize: 16, transform: on ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>
            </button>
            {on && (
              <div style={{ borderTop: '1px solid var(--ui-line)' }}>
                {g.apps.map((a, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{a.nome}</div>
                    <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 3 }}>{a.funcao}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ui-teal)', marginTop: 5, display: 'flex', gap: 6 }}>
                      <span>✓</span><span>{a.beneficio}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

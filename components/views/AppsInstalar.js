'use client';
import { useState } from 'react';

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
];

export default function AppsInstalar({ ir }) {
  const [aberto, setAberto] = useState('essencial');
  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('menu')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Apps pra instalar</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Baixe antes de embarcar</div>
        </div>
      </div>

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

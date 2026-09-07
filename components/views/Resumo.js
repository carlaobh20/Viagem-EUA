'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { valorEmBRL, fmtBRL, emojiCategoria, nomeCategoria, CATEGORIAS_MOTORHOME, hojeLocal, usaDolar } from '../../lib/format';
import { statusViagem, pulsoFinanceiro, ordenarRoteiro } from '../../lib/trip-metrics';
import { motion as motionTokens, layout } from '../../lib/design-tokens';

import HeroTravelCard from '../home/HeroTravelCard';
import ProximoEvento from '../home/ProximoEvento';
import RotaViagem from '../home/RotaViagem';
import FinancePulse from '../home/FinancePulse';
import QuickActions from '../home/QuickActions';
import MotorhomeBanner from '../home/MotorhomeBanner';
import RecentActivity from '../home/RecentActivity';
import DiarioLembrete from '../home/DiarioLembrete';
// Pontos de integração futuros — deixados prontos, não renderizados ainda
// (sem fonte de dado real hoje, ver os próprios arquivos):
// import CopilotSlot from '../home/futuro/CopilotSlot';
// import WeatherSlot from '../home/futuro/WeatherSlot';

/**
 * Home — centro de comando da viagem. Ordem fixa de leitura:
 *   1. Onde estou (nome da viagem, câmbio, conta)
 *   2. O que importa agora (lembrete do diário quando cabe, cartão da viagem
 *      com dias + situação financeira, próximo evento)
 *   3. Rota, pulso dos gastos, pendências (acerto / checklist), motorhome
 *   4. Atividade recente (menor prioridade, no rodapé)
 * Toda métrica vem dos dados que já existem (lib/trip-metrics.js).
 */
export default function Resumo({ ir }) {
  const { viagem, gastos, perfis, divisoes, acertos, pontos, checklist, atualizarOrcamento, diario, perfil } = useData();
  const cambio = Number(viagem.cotacao_usd);
  const comDolar = usaDolar(viagem);
  const hoje = hojeLocal();
  const orcamento = Number(viagem.orcamento_brl) || 0;

  // Provocação diária pro Diário: mostra uma vez por dia, na Home, enquanto a
  // pessoa não tiver escrito nada hoje (em nenhum dos dois modos) e só durante
  // o período da viagem (se as datas estiverem cadastradas).
  const dentroDaViagem = !viagem.data_ida || !viagem.data_volta || (hoje >= viagem.data_ida && hoje <= viagem.data_volta);
  const jaEscreveuHoje = !!perfil && (diario || []).some((e) => e.data === hoje && e.perfil_id === perfil.id);
  const chaveDispensa = `diario-lembrete-dispensado-${hoje}`;
  const [lembreteDispensado, setLembreteDispensado] = useState(() => (typeof window !== 'undefined' && window.localStorage.getItem(chaveDispensa) === '1'));
  const mostrarLembreteDiario = dentroDaViagem && !jaEscreveuHoje && !lembreteDispensado;
  function dispensarLembreteDiario() {
    if (typeof window !== 'undefined') window.localStorage.setItem(chaveDispensa, '1');
    setLembreteDispensado(true);
  }

  const status = statusViagem(viagem.data_ida, viagem.data_volta, hoje);
  const financeiro = pulsoFinanceiro(gastos, cambio, status, orcamento, hoje);

  const ordPontos = ordenarRoteiro(pontos);
  const prox = ordPontos.find((p) => p.data_inicio >= hoje) || ordPontos[ordPontos.length - 1] || null;
  const rota = (pontos || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((p) => ({ nome: p.nome, tipo: p.tipo })).filter((p) => p.nome);

  const mapaCat = {};
  gastos.forEach((g) => { mapaCat[g.categoria] = (mapaCat[g.categoria] || 0) + valorEmBRL(g, cambio); });
  const categorias = Object.entries(mapaCat).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v).slice(0, 5);

  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio, acertos);
  const transf = quemDeveParaQuem(saldos);
  const nomeP = (id) => { const p = perfis.find((x) => x.id === id); return p ? p.nome : '—'; };
  const totalMH = gastos.filter((g) => CATEGORIAS_MOTORHOME.includes(g.categoria)).reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const ultimos = gastos.slice(0, 2);

  const checklistArr = checklist || [];
  const checklistFeitos = checklistArr.filter((i) => i.feito).length;

  function editarOrcamento() {
    const v = window.prompt('Meta de gastos da viagem (em reais)', String(orcamento));
    if (v != null) { const n = parseFloat(v.replace(',', '.')); if (!isNaN(n) && n >= 0) atualizarOrcamento(n); }
  }

  const sec = { marginTop: layout.section };

  return (
    <div className="ui-screen" style={{ paddingTop: 10 }}>

      {/* 1. Onde estou — nome da viagem (toca pra trocar), câmbio e conta */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTokens.base, ease: motionTokens.easing }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 2px 16px' }}
      >
        <button onClick={() => ir('viagens')} aria-label="Trocar de viagem" className="ui-press" style={{ border: 'none', background: 'none', padding: '4px 0', minHeight: 40, fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--ui-ink)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 0, textAlign: 'left' }}>
          <span className="ui-clamp1">{viagem?.nome || 'Minha viagem'}</span>
          <span style={{ fontSize: 13, color: 'var(--ui-faint)', fontWeight: 600, flex: '0 0 auto' }}>⌄</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {comDolar && (
            <button onClick={() => ir('acerto')} aria-label="Câmbio usado na viagem" className="ui-pill ui-pill-info ui-press ui-num" style={{ border: 'none', cursor: 'pointer', minHeight: 32, padding: '0 12px', fontSize: 12 }}>
              US$ 1 = {cambio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$ ')}
            </button>
          )}
          <button onClick={() => ir('conta')} aria-label="Minha conta" className="ui-iconbtn raised ui-press" style={{ width: 40, height: 40, borderRadius: '50%', color: 'var(--ui-muted)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
        </div>
      </motion.div>

      {/* 2. O que importa agora */}
      {mostrarLembreteDiario && (
        <DiarioLembrete onEscrever={() => ir('diario')} onDispensar={dispensarLembreteDiario} />
      )}

      <HeroTravelCard
        fotoUrl={viagem?.foto || null}
        status={status}
        financeiro={financeiro}
        orcamento={orcamento}
        onEditarOrcamento={editarOrcamento}
      />

      {prox && (
        <div style={{ marginTop: layout.gap }}>
          <ProximoEvento prox={prox} onClick={() => ir('roteiro')} />
        </div>
      )}

      {/* 3. Rota, gastos, pendências */}
      <div style={sec}>
        <RotaViagem rota={rota} prox={prox} onVerMapa={() => ir('mapa')} onMontar={() => ir('roteiro')} />
      </div>

      <div style={sec}>
        <FinancePulse
          gastoHoje={financeiro.gastoHoje}
          gastoOntem={financeiro.gastoOntem}
          categorias={categorias}
          nomeCategoria={nomeCategoria}
          emojiCategoria={emojiCategoria}
          onVerTodos={() => ir('gastos')}
          onNovo={() => ir('novo')}
        />
      </div>

      <div style={sec}>
        <QuickActions
          sozinho={(perfis || []).length <= 1}
          tudoQuite={transf.length === 0}
          resumoAcerto={transf.length === 0 ? 'Tudo quite ✅' : `${nomeP(transf[0].de)} → ${nomeP(transf[0].para)} · ${fmtBRL(transf[0].valor)}`}
          onAcerto={() => ir('acerto')}
          checklistFeitos={checklistFeitos}
          checklistTotal={checklistArr.length}
          onChecklist={() => ir('checklist')}
        />
      </div>

      {totalMH > 0 && (
        <div style={{ marginTop: layout.gap }}>
          <MotorhomeBanner totalMH={totalMH} onClick={() => ir('motorhome')} />
        </div>
      )}

      {/* 4. Atividade recente — só aparece quando existe algo; sem gasto, o
          bloco de gastos acima já convida a lançar o primeiro. */}
      {ultimos.length > 0 && (
        <div style={sec}>
          <RecentActivity itens={ultimos} nomePessoa={nomeP} emojiCategoria={emojiCategoria} nomeCategoria={nomeCategoria} onVerTodos={() => ir('gastos')} />
        </div>
      )}

    </div>
  );
}

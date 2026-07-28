'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../DataProvider';
import { calcularSaldos, quemDeveParaQuem } from '../../lib/settle';
import { valorEmBRL, fmtBRL, emojiCategoria, nomeCategoria, CATEGORIAS_MOTORHOME, hojeLocal, usaDolar } from '../../lib/format';
import { statusViagem, pulsoFinanceiro, ordenarRoteiro } from '../../lib/trip-metrics';
import { motion as motionTokens } from '../../lib/design-tokens';

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
 * Home v3 — identidade da viagem, timeline da jornada, pulso financeiro e
 * ações contextuais. Composta a partir de components/ui (design system) e
 * components/home (peças específicas da Home). Toda métrica é derivada dos
 * dados que já existem hoje (ver lib/trip-metrics.js) — nada de dado
 * fabricado ou dependência de API externa ainda inexistente.
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

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '10px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>

      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTokens.base, ease: motionTokens.easing }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px 16px' }}
      >
        <div onClick={() => ir('viagens')} style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          {viagem?.nome || 'Minha viagem'}
          <span style={{ fontSize: 13, color: 'var(--ui-faint)', fontWeight: 600 }}>⌄</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          {comDolar && (
            <button onClick={() => ir('acerto')} className="v3-press" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-teal)', background: 'rgba(0,199,177,.12)', padding: '7px 12px', borderRadius: 20, border: 'none' }}>
              {cambio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$ ')}
            </button>
          )}
          <button onClick={() => ir('conta')} aria-label="Minha conta" className="v3-press" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ui-card)', border: '1px solid var(--ui-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--ui-shadow)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ui-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
        </div>
      </motion.div>

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

      <div style={{ marginTop: 14 }}>
        <ProximoEvento prox={prox} onClick={() => ir('roteiro')} />
      </div>

      <RotaViagem rota={rota} prox={prox} onVerMapa={() => ir('mapa')} />

      <div style={{ marginTop: 8 }}>
        <FinancePulse
          gastoHoje={financeiro.gastoHoje}
          gastoOntem={financeiro.gastoOntem}
          categorias={categorias}
          nomeCategoria={nomeCategoria}
          emojiCategoria={emojiCategoria}
          onVerTodos={() => ir('gastos')}
        />
      </div>

      <div style={{ marginTop: 24 }}>
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
        <div style={{ marginTop: 14 }}>
          <MotorhomeBanner totalMH={totalMH} onClick={() => ir('motorhome')} />
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <RecentActivity itens={ultimos} nomePessoa={nomeP} emojiCategoria={emojiCategoria} nomeCategoria={nomeCategoria} onVerTodos={() => ir('gastos')} />
      </div>

    </div>
  );
}

'use client';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { radius, motion as motionTokens } from '../../lib/design-tokens';

const ICON_TIPO = { voo: '✈️', aviao: '✈️', hotel: '🏨', hospedagem: '🏨', passeio: '🎟️', atividade: '🎟️', museu: '🖼️', transporte: '🚗', carro: '🚗', comida: '🍽️', restaurante: '🍽️' };
const COR_TIPO = { voo: '#185FA5', hospedagem: '#BA7517', hotel: '#BA7517', passeio: '#1D9E75', comida: '#D4537E', restaurante: '#D4537E', museu: '#534AB7', transporte: '#0F6E56', carro: '#0F6E56', outro: '#00877A' };
const iconDe = (t) => ICON_TIPO[(t || '').toLowerCase()] || '📍';
const corDe = (t) => COR_TIPO[(t || '').toLowerCase()] || COR_TIPO.outro;
const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };

/**
 * @typedef {Object} JourneyTimelineProps
 * @property {Array<Object>} janela - até 4 pontos do roteiro (1 passado + próximo + 2 futuros), já ordenados.
 * @property {Object|null} atual - o ponto considerado "agora/próximo" dentro da janela.
 * @property {() => void} onVerRoteiro
 * @property {() => void} onVerMapa
 */

/**
 * Timeline vertical (estilo Apple Calendar) que substitui os dois cards
 * antigos de "próximo evento" + mini-rota horizontal por uma única leitura
 * cronológica, com destaque pro item mais próximo de agora.
 * @param {JourneyTimelineProps} props
 */
export default function JourneyTimeline({ janela, atual, onVerRoteiro, onVerMapa }) {
  if (!janela || janela.length === 0) {
    return (
      <>
        <SectionHeader title="Sua jornada" actionLabel="Montar roteiro" onAction={onVerRoteiro} />
        <GlassCard onClick={onVerRoteiro} delay={0.05} style={{ padding: 20 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ui-muted)' }}>Ainda sem paradas no roteiro — toque pra começar a montar.</div>
        </GlassCard>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Sua jornada" actionLabel="Ver mapa" onAction={onVerMapa} />
      <GlassCard onClick={onVerRoteiro} delay={0.05} style={{ padding: '18px 18px 14px' }}>
        {janela.map((p, i) => {
          const cor = corDe(p.tipo);
          const destaque = atual && p === atual;
          return (
            <motion.div
              key={p.id || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: motionTokens.base, delay: 0.05 + i * 0.05, ease: motionTokens.easing }}
              style={{ display: 'flex', gap: 14, paddingBottom: i < janela.length - 1 ? 18 : 0, position: 'relative' }}
            >
              {i < janela.length - 1 && (
                <span style={{ position: 'absolute', left: 15, top: 32, bottom: -4, width: 2, background: 'var(--ui-line)' }} />
              )}
              <span
                className={destaque ? 'v3-pulse-dot' : ''}
                style={{
                  width: 32, height: 32, borderRadius: radius.sm, flex: '0 0 auto', zIndex: 1,
                  background: destaque ? cor : `${cor}22`, color: destaque ? '#fff' : cor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  border: destaque ? 'none' : `1px solid ${cor}44`,
                }}
              >
                {iconDe(p.tipo)}
              </span>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div style={{ fontSize: 11.5, color: 'var(--ui-faint)', fontWeight: 600 }}>{fmtDia(p.data_inicio)}{p.hora ? ` · ${p.hora}` : ''}</div>
                <div style={{ fontSize: 14.5, fontWeight: destaque ? 800 : 600, color: 'var(--ui-ink)', marginTop: 1 }}>{p.nome}</div>
                {p.local && <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.local}</div>}
              </div>
            </motion.div>
          );
        })}
      </GlassCard>
    </>
  );
}

'use client';
import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import { motion as motionTokens } from '../../lib/design-tokens';

const ICON_TIPO = { voo: '✈️', aviao: '✈️', hotel: '🏨', hospedagem: '🏨', passeio: '🎟️', atividade: '🎟️', museu: '🖼️', transporte: '🚗', carro: '🚗', comida: '🍽️', restaurante: '🍽️' };
const iconDe = (t) => ICON_TIPO[(t || '').toLowerCase()] || '📍';
const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };

/**
 * Card "Próximo evento" — formato original (ícone + nome + data, uma linha).
 * @param {{ prox: Object|null, onClick: () => void }} props
 */
export default function ProximoEvento({ prox, onClick }) {
  if (!prox) return null;
  return (
    <GlassCard onClick={onClick} delay={0.05} radiusPx={18} style={{ padding: 16 }}>
      <motion.div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(0,199,177,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: '0 0 auto' }}>{iconDe(prox.tipo)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)', marginBottom: 2 }}>Próximo evento</div>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prox.nome}</div>
          <div style={{ fontSize: 12, color: 'var(--ui-muted)', marginTop: 2 }}>{fmtDia(prox.data_inicio)}{prox.hora ? ` · ${prox.hora}` : ''}</div>
        </div>
        <span style={{ color: 'var(--ui-faint)', fontSize: 20, flex: '0 0 auto' }}>›</span>
      </motion.div>
    </GlassCard>
  );
}

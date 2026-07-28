'use client';
import { motion } from 'framer-motion';
import { motion as motionTokens } from '../../lib/design-tokens';

/**
 * @typedef {Object} ProgressBarProps
 * @property {number} pct - 0 a 100.
 * @property {string} [trackColor] - cor de fundo da trilha.
 * @property {string} [fillColor] - cor do preenchimento.
 * @property {number} [height] - altura em px.
 * @property {boolean} [over] - se true, indica estouro (cor de alerta assumida pelo fillColor do chamador).
 */

/** Barra de progresso animada (largura anima suavemente ao montar/atualizar). @param {ProgressBarProps} props */
export default function ProgressBar({ pct, trackColor = 'var(--ui-line)', fillColor = 'var(--ui-teal)', height = 7 }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ height, borderRadius: height, background: trackColor, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${w}%` }}
        transition={{ duration: motionTokens.slow, ease: motionTokens.easing }}
        style={{ height: '100%', borderRadius: height, background: fillColor }}
      />
    </div>
  );
}

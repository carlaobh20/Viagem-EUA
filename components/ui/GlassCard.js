'use client';
import { motion } from 'framer-motion';
import { radius, shadow, motion as motionTokens } from '../../lib/design-tokens';

/**
 * @typedef {Object} GlassCardProps
 * @property {React.ReactNode} children
 * @property {'surface'|'glass'|'dark'} [variant] - 'surface' (cartão branco padrão),
 *   'glass' (vidro translúcido — usar sobre foto/gradiente escuro), 'dark' (sólido escuro).
 * @property {() => void} [onClick] - se presente, o card vira pressionável (feedback de toque + hover).
 * @property {number} [delay] - atraso da animação de entrada em segundos (stagger entre cards).
 * @property {number|string} [radiusPx] - raio custom; padrão radius.lg.
 * @property {Object} [style] - estilos extras aplicados por cima do padrão.
 */

/** Cartão base do design system: entrada suave, feedback de toque, 3 variantes de superfície. @param {GlassCardProps} props */
export default function GlassCard({ children, variant = 'surface', onClick, delay = 0, radiusPx, style = {} }) {
  const base = {
    surface: { background: 'var(--ui-card)', boxShadow: shadow.card, border: '1px solid transparent' },
    glass: { background: 'rgba(255,255,255,.09)', backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)', border: '1px solid rgba(255,255,255,.16)' },
    dark: { background: 'var(--ui-dark)', boxShadow: shadow.floating, border: '1px solid rgba(255,255,255,.06)' },
  }[variant];

  const Tag = onClick ? motion.button : motion.div;

  return (
    <Tag
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.base, delay, ease: motionTokens.easing }}
      whileTap={onClick ? { scale: 0.97, opacity: 0.94 } : undefined}
      style={{
        textAlign: 'left', border: 'none', cursor: onClick ? 'pointer' : 'default',
        borderRadius: radiusPx ?? radius.lg, width: '100%', display: 'block',
        fontFamily: 'inherit', color: 'inherit', padding: 0, overflow: 'hidden',
        ...base, ...style,
      }}
    >
      {children}
    </Tag>
  );
}

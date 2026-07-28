'use client';
import { motion } from 'framer-motion';
import { motion as motionTokens } from '../../lib/design-tokens';

/**
 * @typedef {Object} DiarioLembreteProps
 * @property {() => void} onEscrever
 * @property {() => void} onDispensar
 */

/**
 * Provocação diária pra registrar o dia no Diário — aparece na Home uma vez
 * por dia (controlado por quem chama, ver Resumo.js) enquanto a pessoa ainda
 * não escreveu nada hoje. Sem push notification real (isso exigiria uma
 * infraestrutura própria, ver conversa com o usuário); este é o empurrão
 * dentro do app, no momento em que ele é aberto.
 * @param {DiarioLembreteProps} props
 */
export default function DiarioLembrete({ onEscrever, onDispensar }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.base, ease: motionTokens.easing }}
      style={{
        borderRadius: 18, padding: '15px 16px', marginBottom: 14,
        background: 'linear-gradient(135deg, rgba(194,65,12,.14) 0%, var(--ui-card) 78%)',
        border: '1px solid rgba(194,65,12,.24)', boxShadow: 'var(--ui-shadow)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <span style={{ fontSize: 24, flex: '0 0 auto' }}>📔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ui-ink)' }}>Vamos guardar o que rolou hoje?</div>
        <div style={{ fontSize: 11.5, color: 'var(--ui-muted)', marginTop: 2, lineHeight: 1.3 }}>Registre agora pra não esquecer amanhã o que está vivendo hoje.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={onEscrever} className="v3-press" style={{ border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', color: '#fff' }}>
            Escrever agora
          </button>
          <button onClick={onDispensar} className="v3-press" style={{ border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '7px 8px' }}>
            Agora não
          </button>
        </div>
      </div>
    </motion.div>
  );
}

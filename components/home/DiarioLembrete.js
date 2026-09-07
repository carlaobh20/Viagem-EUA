'use client';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { motion as motionTokens, radius } from '../../lib/design-tokens';

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
        borderRadius: radius.md, padding: '14px 16px', marginBottom: 12,
        background: 'linear-gradient(135deg, var(--ui-teal-soft) 0%, var(--ui-card) 80%)',
        boxShadow: 'var(--ui-shadow)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <span style={{ fontSize: 24, flex: '0 0 auto' }} aria-hidden="true">📔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ui-ink)' }}>Vamos guardar o que rolou hoje?</div>
        <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 2, lineHeight: 1.35 }}>Registre agora pra não esquecer amanhã o que está vivendo hoje.</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
          <Button size="sm" onClick={onEscrever}>Escrever agora</Button>
          <Button size="sm" variant="ghost" onClick={onDispensar} style={{ color: 'var(--ui-muted)' }}>Agora não</Button>
        </div>
      </div>
    </motion.div>
  );
}

'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as m } from '../../lib/design-tokens';

/**
 * Entrada suave de um bloco (tela, card, resultado). Use com parcimônia:
 * entrada de tela, abertura de formulário, conclusão/sucesso, expansão.
 * @param {{ children: React.ReactNode, delay?: number, style?: object, className?: string }} props
 */
export default function Reveal({ children, delay = 0, style, className }) {
  return (
    <motion.div initial={m.fadeUp.initial} animate={m.fadeUp.animate} transition={{ ...m.fadeUp.transition, delay }} style={style} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Expansão/colapso com altura animada (detalhes de um item, seção fechada).
 * @param {{ aberto: boolean, children: React.ReactNode }} props
 */
export function Expand({ aberto, children }) {
  return (
    <AnimatePresence initial={false}>
      {aberto && (
        <motion.div key="x" initial={m.expand.initial} animate={m.expand.animate} exit={m.expand.exit} transition={m.expand.transition} style={{ overflow: 'hidden' }}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

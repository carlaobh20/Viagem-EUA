'use client';
import { motion } from 'framer-motion';
import ProgressBar from '../ui/ProgressBar';
import { radius, motion as motionTokens } from '../../lib/design-tokens';
import { fmtBRL } from '../../lib/format';

/**
 * @typedef {Object} HeroTravelCardProps
 * @property {string|null} fotoUrl - imagem de fundo (usa /hero-eua.jpg como fallback do app).
 * @property {import('../../lib/trip-metrics').StatusViagem} status
 * @property {{ totalBRL: number }} financeiro
 * @property {number} orcamento
 * @property {() => void} onEditarOrcamento
 */

/**
 * Cartão de identidade da viagem — tamanho e layout originais (contador de
 * dias à esquerda, total gasto + barra de orçamento à direita). Voltou pro
 * formato de antes a pedido do usuário; a versão anterior desta tela tinha
 * ficado maior que o necessário.
 * @param {HeroTravelCardProps} props
 */
export default function HeroTravelCard({ fotoUrl, status, financeiro, orcamento, onEditarOrcamento }) {
  const { totalBRL } = financeiro;
  const pct = orcamento > 0 ? Math.min(100, Math.round((totalBRL / orcamento) * 100)) : 0;
  const restante = orcamento - totalBRL;
  const bg = fotoUrl || '/hero-eua.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.base, ease: motionTokens.easing }}
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0,43,54,.88) 0%, rgba(0,43,54,.60) 52%, rgba(0,43,54,.82) 100%), url('${bg}')`,
        backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: radius.xl, padding: 22, color: '#fff',
        display: 'flex', gap: 18, boxShadow: '0 14px 30px rgba(0,43,54,.30)',
      }}
    >
      <div style={{ flex: '0 0 auto' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>{status.topo}</div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, margin: '4px 0 2px' }}>{status.grande}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>{status.baixo}</div>
      </div>
      <div onClick={onEditarOrcamento} style={{ flex: 1, minWidth: 0, borderLeft: '1px solid rgba(255,255,255,.14)', paddingLeft: 18, cursor: 'pointer' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>Total gasto</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', margin: '3px 0 2px' }}>{fmtBRL(totalBRL)}</div>
        {orcamento > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 10 }}>de {fmtBRL(orcamento)}</div>
            <ProgressBar pct={pct} trackColor="rgba(255,255,255,.18)" fillColor="var(--ui-teal)" height={7} />
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>{pct}% · {restante >= 0 ? `${fmtBRL(restante)} restantes` : `${fmtBRL(-restante)} acima`}</div>
          </>
        )}
      </div>
    </motion.div>
  );
}

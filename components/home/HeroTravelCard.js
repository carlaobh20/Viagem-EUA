'use client';
import { motion } from 'framer-motion';
import StatTile from '../ui/StatTile';
import ProgressBar from '../ui/ProgressBar';
import { radius, shadow, motion as motionTokens } from '../../lib/design-tokens';
import { fmtBRL } from '../../lib/format';

/**
 * @typedef {Object} HeroTravelCardProps
 * @property {string} nome - nome da viagem.
 * @property {string|null} fotoUrl - imagem de fundo (usa /hero-eua.jpg como fallback do app).
 * @property {import('../../lib/trip-metrics').StatusViagem} status
 * @property {string|null} localAtualNome - local mais recente do roteiro (proxy sem GPS).
 * @property {{ totalBRL: number, gastoHoje: number, gastoOntem: number, ritmoDiario: number|null, projecaoFinal: number|null, economiaProjetada: number|null }} financeiro
 * @property {number} orcamento
 * @property {() => void} onEditarOrcamento
 */

/**
 * Cartão de identidade da viagem: substitui os dois widgets separados
 * (contador + orçamento) por uma única leitura de status, com um insight
 * que os dados já suportam hoje — projeção de gasto no ritmo atual — sem
 * exigir nenhuma API nova.
 * @param {HeroTravelCardProps} props
 */
export default function HeroTravelCard({ nome, fotoUrl, status, localAtualNome, financeiro, orcamento, onEditarOrcamento }) {
  const { totalBRL, ritmoDiario, projecaoFinal, economiaProjetada } = financeiro;
  const pct = orcamento > 0 ? Math.min(100, Math.round((totalBRL / orcamento) * 100)) : 0;
  const estourou = orcamento > 0 && totalBRL > orcamento;
  const bg = fotoUrl || '/hero-eua.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.slow, ease: motionTokens.easing }}
      style={{
        position: 'relative', borderRadius: radius.xxl, overflow: 'hidden',
        boxShadow: shadow.floating, color: '#fff',
        backgroundImage: `linear-gradient(175deg, rgba(0,26,33,.30) 0%, rgba(0,26,33,.55) 55%, rgba(0,26,33,.92) 100%), url('${bg}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
    >
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nome}</div>
            {localAtualNome && status.fase === 'em_andamento' && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📍</span><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{localAtualNome}</span>
              </div>
            )}
          </div>
          {status.fase === 'em_andamento' && (
            <span className="v3-pulse-dot" style={{ flex: '0 0 auto', fontSize: 10.5, fontWeight: 800, letterSpacing: '.5px', color: '#fff', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.28)', borderRadius: radius.pill, padding: '5px 10px' }}>● EM VIAGEM</span>
          )}
        </div>

        <div style={{ margin: '14px 0 20px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.68)', fontWeight: 500 }}>{status.topo}</div>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, margin: '2px 0' }}>{status.grande}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.62)' }}>{status.baixo}</div>
        </div>
      </div>

      {/* painel de vidro com o pulso financeiro */}
      <div
        onClick={onEditarOrcamento}
        className="v3-glass v3-press"
        style={{ margin: '0 10px 10px', borderRadius: radius.lg, padding: '16px 18px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{fmtBRL(totalBRL)}</span>
          {orcamento > 0 && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>de {fmtBRL(orcamento)}</span>}
        </div>
        {orcamento > 0 ? (
          <>
            <ProgressBar pct={pct} trackColor="rgba(255,255,255,.18)" fillColor={estourou ? '#FF8A80' : 'var(--ui-teal)'} />
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${projecaoFinal != null ? 3 : 1}, 1fr)`, gap: 14, marginTop: 14 }}>
              <StatTile on="dark" label="Progresso" value={`${pct}%`} />
              {ritmoDiario != null && <StatTile on="dark" label="Ritmo/dia" value={fmtBRL(ritmoDiario)} />}
              {projecaoFinal != null && (
                <StatTile
                  on="dark"
                  label="Projeção final"
                  value={fmtBRL(projecaoFinal)}
                  tone={economiaProjetada != null ? (economiaProjetada >= 0 ? '#5FE3B0' : '#FF8A80') : undefined}
                />
              )}
            </div>
            {economiaProjetada != null && (
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', marginTop: 10 }}>
                {economiaProjetada >= 0 ? `No ritmo atual, sobram ${fmtBRL(economiaProjetada)}` : `No ritmo atual, estoura em ${fmtBRL(-economiaProjetada)}`}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>Toque pra definir uma meta de orçamento</div>
        )}
      </div>
    </motion.div>
  );
}

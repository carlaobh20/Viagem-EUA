'use client';
import GlassCard from '../ui/GlassCard';
import ProgressBar from '../ui/ProgressBar';
import SectionHeader from '../ui/SectionHeader';
import EmptyState from '../ui/EmptyState';
import { fmtBRL } from '../../lib/format';
import { text } from '../../lib/design-tokens';

/**
 * @typedef {Object} FinancePulseProps
 * @property {number} gastoHoje
 * @property {number} gastoOntem
 * @property {Array<{id: string, v: number}>} categorias - já ordenadas desc, top N.
 * @property {(id: string) => string} nomeCategoria
 * @property {(id: string) => string} emojiCategoria
 * @property {() => void} onVerTodos
 * @property {() => void} [onNovo] - abre o lançamento de gasto (usado no estado vazio).
 */

/** Pulso financeiro: comparação hoje/ontem + top categorias. @param {FinancePulseProps} props */
export default function FinancePulse({ gastoHoje, gastoOntem, categorias, nomeCategoria, emojiCategoria, onVerTodos, onNovo }) {
  const delta = gastoOntem > 0 ? Math.round(((gastoHoje - gastoOntem) / gastoOntem) * 100) : null;
  const maxCat = categorias.reduce((m, c) => Math.max(m, c.v), 0) || 1;

  if (categorias.length === 0) {
    return (
      <>
        <SectionHeader title="Gastos" actionLabel="Ver todos" onAction={onVerTodos} />
        <EmptyState compacto icone="💸" titulo="Nenhum gasto ainda" texto="Lance o primeiro e a Home passa a mostrar quanto foi hoje, ontem e por categoria." cta={onNovo ? 'Lançar gasto' : undefined} onCta={onNovo} />
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Gastos" actionLabel="Ver todos" onAction={onVerTodos} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <GlassCard delay={0.05} style={{ padding: '14px 16px' }}>
          <div style={{ ...text.caption, fontWeight: 700, marginBottom: 4 }}>Hoje</div>
          <div className="ui-num" style={{ ...text.number, fontSize: 18 }}>{fmtBRL(gastoHoje)}</div>
        </GlassCard>
        <GlassCard delay={0.1} style={{ padding: '14px 16px' }}>
          <div style={{ ...text.caption, fontWeight: 700, marginBottom: 4 }}>Ontem</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="ui-num" style={{ ...text.number, fontSize: 18 }}>{fmtBRL(gastoOntem)}</span>
            {delta != null && (
              <span className="ui-num" style={{ fontSize: 11, fontWeight: 700, color: delta <= 0 ? 'var(--ui-teal-ink)' : 'var(--ui-debit)' }}>
                {delta <= 0 ? '↓' : '↑'} {Math.abs(delta)}%
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard delay={0.15} style={{ padding: '6px 18px' }}>
        {categorias.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--ui-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>{emojiCategoria(c.id)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span className="ui-clamp1" style={{ fontSize: 13.5, fontWeight: 600 }}>{nomeCategoria(c.id)}</span>
                <span className="ui-num" style={{ fontSize: 13.5, fontWeight: 700, flex: '0 0 auto' }}>{fmtBRL(c.v)}</span>
              </div>
              <ProgressBar pct={(c.v / maxCat) * 100} height={5} />
            </div>
          </div>
        ))}
      </GlassCard>
    </>
  );
}

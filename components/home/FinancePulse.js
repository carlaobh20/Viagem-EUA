'use client';
import GlassCard from '../ui/GlassCard';
import ProgressBar from '../ui/ProgressBar';
import SectionHeader from '../ui/SectionHeader';
import { fmtBRL } from '../../lib/format';

/**
 * @typedef {Object} FinancePulseProps
 * @property {number} gastoHoje
 * @property {number} gastoOntem
 * @property {Array<{id: string, v: number}>} categorias - já ordenadas desc, top N.
 * @property {(id: string) => string} nomeCategoria
 * @property {(id: string) => string} emojiCategoria
 * @property {() => void} onVerTodos
 */

/** Pulso financeiro: comparação hoje/ontem + top categorias. @param {FinancePulseProps} props */
export default function FinancePulse({ gastoHoje, gastoOntem, categorias, nomeCategoria, emojiCategoria, onVerTodos }) {
  const delta = gastoOntem > 0 ? Math.round(((gastoHoje - gastoOntem) / gastoOntem) * 100) : null;
  const maxCat = categorias.reduce((m, c) => Math.max(m, c.v), 0) || 1;

  return (
    <>
      <SectionHeader title="Gastos" actionLabel="Ver todos" onAction={onVerTodos} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <GlassCard delay={0.05} style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 600, marginBottom: 4 }}>Hoje</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>{fmtBRL(gastoHoje)}</div>
        </GlassCard>
        <GlassCard delay={0.1} style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 600, marginBottom: 4 }}>Ontem</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>{fmtBRL(gastoOntem)}</span>
            {delta != null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: delta <= 0 ? 'var(--ui-teal)' : '#C0463F' }}>
                {delta <= 0 ? '↓' : '↑'} {Math.abs(delta)}%
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard delay={0.15} style={{ padding: categorias.length ? '6px 18px' : 18 }}>
        {categorias.length === 0 && <div style={{ fontSize: 13, color: 'var(--ui-faint)', textAlign: 'center', padding: '18px 0' }}>Nenhum gasto ainda</div>}
        {categorias.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>{emojiCategoria(c.id)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeCategoria(c.id)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, flex: '0 0 auto' }}>{fmtBRL(c.v)}</span>
              </div>
              <ProgressBar pct={(c.v / maxCat) * 100} height={5} />
            </div>
          </div>
        ))}
      </GlassCard>
    </>
  );
}

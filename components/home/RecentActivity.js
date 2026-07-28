'use client';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { fmtBRL, fmtUSD } from '../../lib/format';

const MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDia = (d) => { if (!d) return ''; const [, m, dia] = d.split('-'); return `${Number(dia)} ${MS[Number(m) - 1]}`; };

/**
 * @typedef {Object} RecentActivityProps
 * @property {Array<Object>} itens - no máximo 2 (teaser, não lista completa — a lista vive na aba Gastos).
 * @property {(id: string) => string} nomePessoa
 * @property {(id: string) => string} emojiCategoria
 * @property {(id: string) => string} nomeCategoria
 * @property {() => void} onVerTodos
 */

/** Teaser de atividade recente — informação de menor prioridade, por isso vive no rodapé da Home. @param {RecentActivityProps} props */
export default function RecentActivity({ itens, nomePessoa, emojiCategoria, nomeCategoria, onVerTodos }) {
  return (
    <>
      <SectionHeader title="Atividade recente" actionLabel="Ver todos" onAction={onVerTodos} />
      <GlassCard delay={0.05} style={{ padding: itens.length ? '4px 18px' : 18 }}>
        {itens.length === 0 && <div style={{ fontSize: 13, color: 'var(--ui-faint)', textAlign: 'center', padding: '18px 0' }}>Nenhum gasto ainda</div>}
        {itens.map((g, i) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>{emojiCategoria(g.categoria)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.descricao || nomeCategoria(g.categoria)}</div>
              <div style={{ fontSize: 11, color: 'var(--ui-muted)' }}>{nomePessoa(g.pago_por)} · {fmtDia(g.data)}</div>
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, flex: '0 0 auto' }}>{g.moeda === 'USD' ? fmtUSD(g.valor) : fmtBRL(g.valor)}</span>
          </div>
        ))}
      </GlassCard>
    </>
  );
}

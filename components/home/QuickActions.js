'use client';
import GlassCard from '../ui/GlassCard';

/**
 * @typedef {Object} QuickActionsProps
 * @property {boolean} tudoQuite - se não há ninguém a acertar.
 * @property {string} resumoAcerto - texto do maior acerto pendente, ou "Tudo quite".
 * @property {() => void} onAcerto
 * @property {number} checklistFeitos
 * @property {number} checklistTotal
 * @property {() => void} onChecklist
 */

/**
 * Acerto de contas e checklist lado a lado, como tiles compactos — só ganham
 * destaque visual (cor cheia) quando há algo pendente de verdade; senão
 * encolhem para um estado neutro "resolvido".
 * @param {QuickActionsProps} props
 */
export default function QuickActions({ tudoQuite, resumoAcerto, onAcerto, checklistFeitos, checklistTotal, onChecklist }) {
  const checklistPct = checklistTotal > 0 ? Math.round((checklistFeitos / checklistTotal) * 100) : null;
  const Tile = ({ onClick, delay, emoji, label, valor, destaque }) => (
    <GlassCard onClick={onClick} delay={delay} style={{ padding: '16px 14px', background: destaque ? 'linear-gradient(160deg, rgba(0,199,177,.12), var(--ui-card) 70%)' : 'var(--ui-card)' }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{emoji}</div>
      <div style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ui-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</div>
    </GlassCard>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Tile onClick={onAcerto} delay={0.05} emoji="🤝" label="A acertar" valor={resumoAcerto} destaque={!tudoQuite} />
      <Tile
        onClick={onChecklist}
        delay={0.1}
        emoji="✅"
        label="Checklist"
        valor={checklistTotal > 0 ? `${checklistFeitos}/${checklistTotal} · ${checklistPct}%` : 'Montar lista'}
        destaque={checklistTotal > 0 && checklistPct < 100}
      />
    </div>
  );
}

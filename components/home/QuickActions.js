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

// Tons de destaque dos tiles. 'alerta' = laranja (tem pendência real), 'ok' = verde
// (resolvido), 'teal' = destaque neutro-positivo (usado no checklist em andamento,
// mantém o visual que já existia antes), 'neutro' = sem pendência.
const TONS = {
  alerta: { grad: 'linear-gradient(160deg, rgba(232,135,30,.16) 0%, var(--ui-card) 72%)', ring: '1px solid rgba(232,135,30,.38)', iconBg: 'rgba(232,135,30,.18)' },
  ok: { grad: 'linear-gradient(160deg, rgba(0,199,177,.14) 0%, var(--ui-card) 72%)', ring: '1px solid rgba(0,199,177,.32)', iconBg: 'rgba(0,199,177,.16)' },
  teal: { grad: 'linear-gradient(160deg, rgba(0,199,177,.12) 0%, var(--ui-card) 70%)', ring: '1px solid transparent', iconBg: 'var(--ui-bg)' },
  neutro: { grad: 'var(--ui-card)', ring: '1px solid transparent', iconBg: 'var(--ui-bg)' },
};

/**
 * Acerto de contas e checklist lado a lado, como tiles compactos.
 * "A acertar" segue um semáforo: laranja enquanto houver alguém devendo,
 * verde quando estiver tudo quite. Checklist mantém o destaque neutro de
 * antes (teal quando ainda tem item pendente).
 * @param {QuickActionsProps} props
 */
export default function QuickActions({ tudoQuite, resumoAcerto, onAcerto, checklistFeitos, checklistTotal, onChecklist }) {
  const checklistPct = checklistTotal > 0 ? Math.round((checklistFeitos / checklistTotal) * 100) : null;

  const Tile = ({ onClick, delay, emoji, label, valor, tom }) => {
    const t = TONS[tom] || TONS.neutro;
    return (
      <GlassCard onClick={onClick} delay={delay} style={{ padding: '16px 14px', background: t.grad, border: t.ring }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{emoji}</div>
        <div style={{ fontSize: 11, color: 'var(--ui-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ui-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</div>
      </GlassCard>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Tile onClick={onAcerto} delay={0.05} emoji={tudoQuite ? '✅' : '🟠'} label="A acertar" valor={resumoAcerto} tom={tudoQuite ? 'ok' : 'alerta'} />
      <Tile
        onClick={onChecklist}
        delay={0.1}
        emoji="✅"
        label="Checklist"
        valor={checklistTotal > 0 ? `${checklistFeitos}/${checklistTotal} · ${checklistPct}%` : 'Montar lista'}
        tom={checklistTotal > 0 && checklistPct < 100 ? 'teal' : 'neutro'}
      />
    </div>
  );
}

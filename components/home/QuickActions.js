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
// 'fundoTint' é a mesma cor usada em 'grad', só que sólida (sem gradiente) — serve
// de véu por cima da foto de fundo do tile "A acertar", pra manter a leitura
// laranja/verde mesmo com a imagem atrás.
const TONS = {
  alerta: { grad: 'linear-gradient(160deg, rgba(232,135,30,.16) 0%, var(--ui-card) 72%)', ring: '1px solid rgba(232,135,30,.38)', iconBg: 'rgba(232,135,30,.18)', fundoTint: 'linear-gradient(160deg, rgba(196,90,10,.62) 0%, rgba(196,90,10,.38) 100%)' },
  ok: { grad: 'linear-gradient(160deg, rgba(0,199,177,.14) 0%, var(--ui-card) 72%)', ring: '1px solid rgba(0,199,177,.32)', iconBg: 'rgba(0,199,177,.16)', fundoTint: 'linear-gradient(160deg, rgba(0,150,132,.6) 0%, rgba(0,150,132,.36) 100%)' },
  teal: { grad: 'linear-gradient(160deg, rgba(0,199,177,.12) 0%, var(--ui-card) 70%)', ring: '1px solid transparent', iconBg: 'var(--ui-bg)' },
  neutro: { grad: 'var(--ui-card)', ring: '1px solid transparent', iconBg: 'var(--ui-bg)' },
};

/**
 * Acerto de contas e checklist lado a lado, como tiles compactos.
 * Os dois seguem o mesmo semáforo: laranja enquanto houver pendência
 * (alguém devendo, ou checklist não 100% concluído), verde só quando
 * estiver tudo resolvido (quite, ou checklist 100%).
 * O tile "A acertar" usa uma foto desfocada de fundo (troca de dinheiro)
 * em vez do ícone, com um véu laranja/verde por cima pra manter a cor.
 * @param {QuickActionsProps} props
 */
export default function QuickActions({ tudoQuite, resumoAcerto, onAcerto, checklistFeitos, checklistTotal, onChecklist }) {
  const checklistPct = checklistTotal > 0 ? Math.round((checklistFeitos / checklistTotal) * 100) : null;
  const checklistCompleto = checklistTotal > 0 && checklistPct === 100;
  const checklistPendente = checklistTotal > 0 && checklistPct < 100;

  const Tile = ({ onClick, delay, emoji, label, valor, tom, foto }) => {
    const t = TONS[tom] || TONS.neutro;
    return (
      <GlassCard onClick={onClick} delay={delay} style={{ padding: '16px 14px', background: foto ? 'var(--ui-card)' : t.grad, border: t.ring, position: 'relative' }}>
        {foto && (
          <>
            <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)', opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: 0, background: t.fundoTint }} />
          </>
        )}
        <div style={{ position: 'relative' }}>
          {!foto && (
            <div style={{ width: 32, height: 32, borderRadius: 10, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{emoji}</div>
          )}
          <div style={{ fontSize: 11, color: foto ? 'rgba(255,255,255,.85)' : 'var(--ui-muted)', fontWeight: 600, marginBottom: 2, marginTop: foto ? 34 : 0 }}>{label}</div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: foto ? '#fff' : 'var(--ui-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Tile onClick={onAcerto} delay={0.05} emoji={tudoQuite ? '✅' : '🟠'} label="A acertar" valor={resumoAcerto} tom={tudoQuite ? 'ok' : 'alerta'} foto="/acerto-bg.jpg" />
      <Tile
        onClick={onChecklist}
        delay={0.1}
        emoji={checklistCompleto ? '✅' : '🟠'}
        label="Checklist"
        valor={checklistTotal > 0 ? `${checklistFeitos}/${checklistTotal} · ${checklistPct}%` : 'Montar lista'}
        tom={checklistPendente ? 'alerta' : (checklistCompleto ? 'ok' : 'neutro')}
      />
    </div>
  );
}

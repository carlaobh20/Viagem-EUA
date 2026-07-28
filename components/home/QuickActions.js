'use client';
import GlassCard from '../ui/GlassCard';

/**
 * @typedef {Object} QuickActionsProps
 * @property {boolean} sozinho - true quando a viagem tem só uma pessoa registrada (nenhuma
 *   outra em "Pessoas") — nesse caso não existe ninguém pra acertar conta com quem viaja
 *   sozinho, então o card "A acertar" some e o Checklist volta a ser um card simples,
 *   sem foto de fundo (fica estranho um card de foto sozinho na grade).
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
// 'fundoTint' é a cor sólida que tinge a foto de fundo do tile "A acertar" — aplicada
// com mix-blend-mode 'color' (não como véu opaco por cima), pra manter o card lendo
// como laranja/verde sem esconder o que a foto mostra.
const TONS = {
  alerta: { grad: 'linear-gradient(160deg, rgba(232,135,30,.16) 0%, var(--ui-card) 72%)', ring: '1px solid rgba(232,135,30,.38)', iconBg: 'rgba(232,135,30,.18)', fundoTint: '#C2410C' },
  ok: { grad: 'linear-gradient(160deg, rgba(0,199,177,.14) 0%, var(--ui-card) 72%)', ring: '1px solid rgba(0,199,177,.32)', iconBg: 'rgba(0,199,177,.16)', fundoTint: '#0E9C8C' },
  teal: { grad: 'linear-gradient(160deg, rgba(0,199,177,.12) 0%, var(--ui-card) 70%)', ring: '1px solid transparent', iconBg: 'var(--ui-bg)' },
  neutro: { grad: 'var(--ui-card)', ring: '1px solid transparent', iconBg: 'var(--ui-bg)', fundoTint: '#64748B' },
};

/**
 * Acerto de contas e checklist lado a lado, como tiles compactos.
 * Os dois seguem o mesmo semáforo: laranja enquanto houver pendência
 * (alguém devendo, ou checklist não 100% concluído), verde só quando
 * estiver tudo resolvido (quite, ou checklist 100%).
 * Os dois tiles usam uma foto nítida de fundo (em vez do ícone), tingida
 * na cor do estado (laranja/verde/neutro) sem esconder a imagem.
 * @param {QuickActionsProps} props
 */
export default function QuickActions({ sozinho, tudoQuite, resumoAcerto, onAcerto, checklistFeitos, checklistTotal, onChecklist }) {
  const checklistPct = checklistTotal > 0 ? Math.round((checklistFeitos / checklistTotal) * 100) : null;
  const checklistCompleto = checklistTotal > 0 && checklistPct === 100;
  const checklistPendente = checklistTotal > 0 && checklistPct < 100;

  const Tile = ({ onClick, delay, emoji, label, valor, tom, foto }) => {
    const t = TONS[tom] || TONS.neutro;
    return (
      <GlassCard onClick={onClick} delay={delay} style={{ padding: '16px 14px', background: foto ? 'var(--ui-card)' : t.grad, border: t.ring, position: 'relative' }}>
        {foto && (
          <>
            <img src={foto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* tinge a foto de laranja/verde preservando o detalhe (mix-blend 'color'), em vez de cobrir com um véu opaco */}
            <div style={{ position: 'absolute', inset: 0, background: t.fundoTint, opacity: 0.5, mixBlendMode: 'color' }} />
            {/* leve degradê escuro só embaixo, pra garantir contraste do texto sobre a foto */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,.62) 0%, rgba(0,0,0,0) 62%)' }} />
          </>
        )}
        <div style={{ position: 'relative' }}>
          {!foto && (
            <div style={{ width: 32, height: 32, borderRadius: 10, background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>{emoji}</div>
          )}
          <div style={{ fontSize: 12.5, color: foto ? 'rgba(255,255,255,.92)' : 'var(--ui-muted)', fontWeight: 800, marginBottom: 3, marginTop: foto ? 34 : 0, textShadow: foto ? '0 1px 3px rgba(0,0,0,.55)' : 'none' }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: foto ? '#fff' : 'var(--ui-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: foto ? '0 1px 3px rgba(0,0,0,.55)' : 'none' }}>{valor}</div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: sozinho ? '1fr' : '1fr 1fr', gap: 10 }}>
      {!sozinho && (
        <Tile onClick={onAcerto} delay={0.05} emoji={tudoQuite ? '✅' : '🟠'} label="A acertar" valor={resumoAcerto} tom={tudoQuite ? 'ok' : 'alerta'} foto="/acerto-bg.jpg" />
      )}
      <Tile
        onClick={onChecklist}
        delay={sozinho ? 0.05 : 0.1}
        emoji={checklistCompleto ? '✅' : '🟠'}
        label="Checklist"
        valor={checklistTotal > 0 ? `${checklistFeitos}/${checklistTotal} · ${checklistPct}%` : 'Montar lista'}
        tom={checklistPendente ? 'alerta' : (checklistCompleto ? 'ok' : 'neutro')}
        foto={sozinho ? undefined : '/checklist-bg.jpg'}
      />
    </div>
  );
}

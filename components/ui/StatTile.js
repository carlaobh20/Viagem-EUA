'use client';

/**
 * @typedef {Object} StatTileProps
 * @property {string} label - rótulo curto (ex: "Ritmo/dia").
 * @property {string} value - valor formatado (ex: "R$ 412").
 * @property {string} [tone] - cor do value; padrão herda do contexto (claro ou escuro).
 * @property {'light'|'dark'} [on] - se o tile está sobre fundo escuro/imagem ('dark') ou claro ('light').
 */

/** Célula compacta de estatística — usada em grades dentro do Hero e do painel financeiro. @param {StatTileProps} props */
export default function StatTile({ label, value, tone, on = 'light' }) {
  const labelColor = on === 'dark' ? 'rgba(255,255,255,.62)' : 'var(--ui-muted)';
  const valueColor = tone || (on === 'dark' ? '#fff' : 'var(--ui-ink)');
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: labelColor, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: valueColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

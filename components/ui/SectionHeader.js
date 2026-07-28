'use client';

/**
 * @typedef {Object} SectionHeaderProps
 * @property {string} title
 * @property {string} [actionLabel] - texto do link de ação (ex: "Ver todos").
 * @property {() => void} [onAction]
 */

/** Cabeçalho de seção padrão da Home (título + ação opcional à direita). @param {SectionHeaderProps} props */
export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '28px 2px 12px' }}>
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.6px', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>{title}</span>
      {actionLabel && (
        <span onClick={onAction} style={{ fontSize: 12.5, color: 'var(--ui-teal)', fontWeight: 700, cursor: 'pointer' }}>{actionLabel}</span>
      )}
    </div>
  );
}

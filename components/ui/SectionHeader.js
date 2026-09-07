'use client';

/**
 * Cabeçalho de seção (título curto em caixa alta + ação opcional à direita).
 * @param {{ title: string, actionLabel?: string, onAction?: () => void, style?: object }} props
 */
export default function SectionHeader({ title, actionLabel, onAction, style }) {
  return (
    <div className="ui-section" style={style}>
      <span>{title}</span>
      {actionLabel && <button className="act" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

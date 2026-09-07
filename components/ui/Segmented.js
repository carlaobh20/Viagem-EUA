'use client';

/**
 * Controle segmentado (2–4 opções mutuamente exclusivas). Parece um só controle, não botões soltos.
 * @param {{ opcoes: Array<{ id: string, label: React.ReactNode }>, valor: string, onChange: (id: string) => void, style?: object }} props
 */
export default function Segmented({ opcoes, valor, onChange, style }) {
  return (
    <div className="ui-seg" role="tablist" style={style}>
      {opcoes.map((o) => (
        <button key={o.id} role="tab" aria-selected={valor === o.id} className={valor === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

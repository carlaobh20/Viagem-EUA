'use client';

/**
 * Campo de formulário: rótulo curto em caixa alta + controle + dica opcional.
 * Passe o input/select/textarea como filho com className="ui-input".
 * @param {{ label: string, hint?: string, opcional?: boolean, children: React.ReactNode, style?: object }} props
 */
export default function Field({ label, hint, opcional = false, children, style }) {
  return (
    <div className="ui-field" style={style}>
      <label className="ui-label">{label}{opcional ? <span style={{ fontWeight: 500, color: 'var(--ui-faint)', letterSpacing: 0, textTransform: 'none' }}> · opcional</span> : null}</label>
      {children}
      {hint ? <div className="ui-hint">{hint}</div> : null}
    </div>
  );
}

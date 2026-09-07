'use client';

/**
 * Botão do design system. Alvo mínimo de 44px; primário = ação principal da tela.
 * @param {{ variant?: 'primary'|'secondary'|'soft'|'ghost'|'danger', size?: 'md'|'sm'|'lg', full?: boolean, children: React.ReactNode, style?: object } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({ variant = 'primary', size = 'md', full = false, children, style, className = '', ...rest }) {
  const cls = ['ui-btn', `ui-btn-${variant}`, size === 'sm' ? 'ui-btn-sm' : '', size === 'lg' ? 'lg' : '', className].filter(Boolean).join(' ');
  return (
    <button className={cls} style={{ ...(full ? { width: '100%' } : null), ...style }} {...rest}>{children}</button>
  );
}

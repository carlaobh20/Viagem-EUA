'use client';
import Button from './Button';

/**
 * Estado vazio que nunca parece erro: ícone, frase de contexto, próximo passo.
 * @param {{ icone?: string, titulo: string, texto?: string, cta?: string, onCta?: () => void, secundario?: React.ReactNode, compacto?: boolean }} props
 */
export default function EmptyState({ icone = '✨', titulo, texto, cta, onCta, secundario, compacto = false }) {
  return (
    <div className="ui-card ui-empty ui-in" style={compacto ? { padding: '20px 16px' } : undefined}>
      <div className="ico" aria-hidden="true">{icone}</div>
      <div className="t">{titulo}</div>
      {texto ? <div className="s">{texto}</div> : null}
      {cta && onCta ? <div className="cta"><Button onClick={onCta}>{cta}</Button></div> : null}
      {secundario ? <div style={{ marginTop: 10 }}>{secundario}</div> : null}
    </div>
  );
}

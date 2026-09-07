'use client';

/**
 * Cabeçalho padrão de tela: responde "onde estou?" em uma linha.
 * @param {{ titulo: string, subtitulo?: React.ReactNode, onVoltar?: () => void, acao?: React.ReactNode, compacto?: boolean }} props
 *   - onVoltar: mostra o botão ← (telas que vivem dentro do Menu)
 *   - acao: botão/ícone à direita (ex.: "+ Adicionar")
 */
export default function PageHeader({ titulo, subtitulo, onVoltar, acao, compacto = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: compacto ? '2px 2px 12px' : '2px 2px 18px' }}>
      {onVoltar && (
        <button onClick={onVoltar} aria-label="Voltar" className="ui-iconbtn raised ui-press" style={{ width: 40, height: 40 }}>←</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ui-title ui-wrap" style={compacto ? { fontSize: 21 } : undefined}>{titulo}</div>
        {subtitulo ? <div className="ui-subtitle ui-wrap">{subtitulo}</div> : null}
      </div>
      {acao ? <div style={{ flex: '0 0 auto' }}>{acao}</div> : null}
    </div>
  );
}

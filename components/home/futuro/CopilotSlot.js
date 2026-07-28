'use client';
import GlassCard from '../../ui/GlassCard';

/**
 * PONTO DE INTEGRAÇÃO FUTURO — Copiloto de viagem.
 * ---------------------------------------------------------------
 * Não está sendo renderizado em nenhuma tela hoje (ver Resumo.js — o import
 * fica comentado até existir dado real). Existe aqui só como o componente
 * visual + contrato de props já prontos, pra quando houver uma fonte real
 * de sugestões (geolocalização + API de lugares/preços).
 *
 * Contrato esperado quando a integração existir:
 * @typedef {Object} CopilotoSugestao
 * @property {string} id
 * @property {string} icone - emoji ou chave de ícone.
 * @property {string} texto - ex: "Outlet Premium está no caminho".
 * @property {string} [distancia] - ex: "8 km".
 * @property {() => void} [onAbrir] - ex: abrir no mapa/maps externo.
 *
 * @param {{ sugestoes: CopilotoSugestao[] }} props
 */
export default function CopilotSlot({ sugestoes = [] }) {
  // Sem fonte de dado real ainda (sem permissão de GPS pedida, sem API de
  // lugares configurada) — não renderiza nada em produção. Fica pronto pra
  // ligar assim que `sugestoes` vier de um provider real.
  if (!sugestoes || sugestoes.length === 0) return null;

  return (
    <GlassCard variant="dark" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: 'rgba(255,255,255,.6)', marginBottom: 10, textTransform: 'uppercase' }}>Copiloto</div>
      {sugestoes.map((s) => (
        <div key={s.id} onClick={s.onAbrir} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: s.onAbrir ? 'pointer' : 'default' }}>
          <span style={{ fontSize: 16 }}>{s.icone}</span>
          <span style={{ flex: 1, fontSize: 13, color: '#fff' }}>{s.texto}</span>
          {s.distancia && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>{s.distancia}</span>}
        </div>
      ))}
    </GlassCard>
  );
}

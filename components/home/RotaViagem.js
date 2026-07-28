'use client';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';

const ICON_TIPO = { voo: '✈️', aviao: '✈️', hotel: '🏨', hospedagem: '🏨', passeio: '🎟️', atividade: '🎟️', museu: '🖼️', transporte: '🚗', carro: '🚗', comida: '🍽️', restaurante: '🍽️' };
const COR_TIPO = { voo: '#185FA5', hospedagem: '#BA7517', hotel: '#BA7517', passeio: '#1D9E75', comida: '#D4537E', restaurante: '#D4537E', museu: '#534AB7', transporte: '#0F6E56', carro: '#0F6E56', outro: '#00877A' };
const hexRgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const iconDe = (t) => ICON_TIPO[(t || '').toLowerCase()] || '📍';
const corDe = (t) => COR_TIPO[(t || '').toLowerCase()] || COR_TIPO.outro;

/**
 * Mini-rota horizontal (formato original): ícones ligados por linha, nomes
 * embaixo, ponto atual destacado com anel colorido.
 * @param {{ rota: Array<{nome:string, tipo:string}>, prox: Object|null, onVerMapa: () => void }} props
 */
export default function RotaViagem({ rota, prox, onVerMapa }) {
  const rotaShow = rota.slice(0, 5);
  if (rotaShow.length === 0) return null;

  return (
    <>
      <SectionHeader title="Roteiro da viagem" actionLabel="Ver mapa" onAction={onVerMapa} />
      <GlassCard onClick={onVerMapa} delay={0.05} radiusPx={18} style={{ padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {rotaShow.map((p, i) => {
            const cor = corDe(p.tipo);
            const corProx = corDe(rotaShow[i + 1]?.tipo);
            const atual = prox && p.nome === prox.nome;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < rotaShow.length - 1 ? 1 : '0 0 auto', minWidth: 0 }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: hexRgba(cor, 0.13), border: atual ? `2px solid ${cor}` : `1px solid ${hexRgba(cor, 0.28)}`, boxShadow: atual ? `0 0 0 4px ${hexRgba(cor, 0.16)}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{iconDe(p.tipo)}</span>
                {i < rotaShow.length - 1 && <span style={{ flex: 1, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${hexRgba(cor, 0.55)}, ${hexRgba(corProx, 0.55)})`, margin: '0 4px' }} />}
              </div>
            );
          })}
          {rota.length > rotaShow.length && <span style={{ fontSize: 11, color: 'var(--ui-muted)', marginLeft: 6, flex: '0 0 auto' }}>+{rota.length - rotaShow.length}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9 }}>
          {rotaShow.map((p, i) => (
            <span key={i} style={{ fontSize: 10.5, color: 'var(--ui-muted)', fontWeight: prox && p.nome === prox.nome ? 700 : 400, flex: 1, textAlign: i === 0 ? 'left' : i === rotaShow.length - 1 ? 'right' : 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>{p.nome}</span>
          ))}
        </div>
      </GlassCard>
    </>
  );
}

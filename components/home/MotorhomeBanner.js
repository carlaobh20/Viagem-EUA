'use client';
import GlassCard from '../ui/GlassCard';
import { fmtBRL } from '../../lib/format';

/** @param {{ totalMH: number, onClick: () => void }} props */
export default function MotorhomeBanner({ totalMH, onClick }) {
  if (!(totalMH > 0)) return null;
  return (
    <GlassCard
      onClick={onClick}
      delay={0.1}
      radiusPx={22}
      style={{
        color: '#fff',
        backgroundImage: "linear-gradient(160deg, rgba(0,26,33,.68) 0%, rgba(0,26,33,.88) 100%), url('/motorhome-bg.jpg')",
        backgroundSize: 'cover', backgroundPosition: 'center', padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 18 }}>🚐</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>Motorhome</div>
          <div style={{ fontSize: 11.5, opacity: 0.82, marginTop: 1 }}>{fmtBRL(totalMH)} no RV · ver detalhes</div>
        </div>
        <span style={{ fontSize: 17, opacity: 0.85 }}>›</span>
      </div>
    </GlassCard>
  );
}

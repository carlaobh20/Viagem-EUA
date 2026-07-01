'use client';

const SVG = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
function Ic({ paths }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...SVG}>{paths}</svg>;
}

const ITENS = [
  {
    id: 'gastos', label: 'Gastos', sub: 'Lançamentos e divisão da viagem', cor: '#0F9D6B', bg: 'rgba(16,185,129,.12)',
    icon: <><rect x="2" y="6" width="20" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></>,
  },
  {
    id: 'acerto', label: 'Acerto de contas', sub: 'Quem deve quanto pra quem', cor: '#2D66A8', bg: 'rgba(45,102,168,.12)',
    icon: <><polyline points="17 2 21 6 17 10" /><path d="M3 12V9a3 3 0 0 1 3-3h15" /><polyline points="7 22 3 18 7 14" /><path d="M21 12v3a3 3 0 0 1-3 3H3" /></>,
  },
  {
    id: 'checklist', label: 'Checklist', sub: 'Tarefas pra não esquecer nada', cor: '#0E9C8C', bg: 'rgba(0,199,177,.14)',
    icon: <><path d="M9 11l3 3 9-9" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  },
  {
    id: 'compras', label: 'Compras', sub: 'O que comprar antes de viajar', cor: '#BA7517', bg: 'rgba(186,117,23,.14)',
    icon: <><circle cx="9" cy="20" r="1.6" /><circle cx="19" cy="20" r="1.6" /><path d="M2 3h3l2.2 11a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" /></>,
  },
  {
    id: 'lugares', label: 'Lugares para Ir', sub: 'Lista de desejos: obrigatórios e sugeridos', cor: '#D4537E', bg: 'rgba(212,83,126,.14)',
    icon: <><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  },
  {
    id: 'pessoas', label: 'Pessoas', sub: 'Quem está na viagem', cor: '#534AB7', bg: 'rgba(83,74,183,.14)',
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  },
  {
    id: 'viagens', label: 'Trocar de viagem', sub: 'Ver e abrir suas viagens', cor: '#5F5E5A', bg: 'rgba(95,94,90,.12)',
    icon: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  },
];

export default function Menu({ ir }) {
  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ padding: '2px 2px 16px' }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Menu</div>
        <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Tudo da viagem num lugar só</div>
      </div>
      <div style={{ ...card, padding: '4px 16px' }}>
        {ITENS.map((it, i) => (
          <button key={it.id} onClick={() => ir(it.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: it.bg, color: it.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><Ic paths={it.icon} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ui-ink)' }}>{it.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 1 }}>{it.sub}</div>
            </div>
            <span style={{ color: 'var(--ui-faint)', fontSize: 20, flex: '0 0 auto' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

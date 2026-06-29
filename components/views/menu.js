'use client';

export default function Menu({ ir }) {
  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const itens = [
    { id: 'gastos', emoji: '💸', label: 'Gastos', sub: 'Lançamentos e divisão da viagem' },
    { id: 'checklist', emoji: '✅', label: 'Checklist', sub: 'Tarefas pra não esquecer nada' },
    { id: 'compras', emoji: '🛒', label: 'Compras', sub: 'O que comprar antes de viajar' },
    { id: 'pessoas', emoji: '👥', label: 'Pessoas', sub: 'Quem está na viagem' },
    { id: 'viagens', emoji: '🧳', label: 'Trocar de viagem', sub: 'Ver e abrir suas viagens' },
    { id: 'conta', emoji: '⚙️', label: 'Minha conta', sub: 'Nome, senha e sair' },
  ];
  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ padding: '2px 2px 16px' }}>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Menu</div>
        <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Tudo da viagem num lugar só</div>
      </div>
      <div style={{ ...card, padding: '4px 16px' }}>
        {itens.map((it, i) => (
          <button key={it.id} onClick={() => ir(it.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--ui-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flex: '0 0 auto' }}>{it.emoji}</span>
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

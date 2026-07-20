'use client';

const PATHS = {
  resumo: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>,
  motorhome: <><rect x="2" y="7" width="13" height="9" rx="2.5" /><path d="M15 10h3.4a1 1 0 0 1 .8.4L21 13v3h-6" /><circle cx="6.5" cy="18" r="1.9" /><circle cx="16.5" cy="18" r="1.9" /></>,
  roteiro: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
  menu: <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>,
};

// telas que vivem "dentro" do Menu — pra acender o ícone Menu quando estiver numa delas
const NO_MENU = ['menu', 'gastos', 'checklist', 'compras', 'pessoas', 'acerto', 'conta'];

export default function Nav({ view, setView }) {
  const ativo = NO_MENU.includes(view) ? 'menu' : view;
  const item = (id, label) => (
    <button onClick={() => setView(id)} aria-label={label} style={{ color: ativo === id ? 'var(--ui-teal)' : 'var(--ui-faint)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PATHS[id]}</svg>
      <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
    </button>
  );
  return (
    <nav className="nav">
      {item('resumo', 'Início')}
      {item('motorhome', 'Motorhome')}
      <button onClick={() => setView('novo')} aria-label="Novo gasto"
        style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#0EA5E9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -26, boxShadow: '0 8px 20px rgba(14,165,180,.45)', border: 'none' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </button>
      {item('roteiro', 'Roteiro')}
      {item('menu', 'Menu')}
    </nav>
  );
}

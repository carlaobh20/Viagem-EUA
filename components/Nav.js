'use client';
export default function Nav({ view, setView }) {
  const item = (id, label, icone) => (
    <button className={view === id ? 'on' : ''} onClick={() => setView(id)} aria-label={label}>
      <span className="gi" aria-hidden="true">{icone}</span>{label}
    </button>
  );
  return (
    <nav className="nav">
      {item('resumo', 'Início', '◈')}
      {item('gastos', 'Gastos', '☰')}
      <button className="add" onClick={() => setView('novo')} aria-label="Novo gasto">＋</button>
      {item('pessoas', 'Pessoas', '👥')}
      {item('acerto', 'Acerto', '⇄')}
    </nav>
  );
}

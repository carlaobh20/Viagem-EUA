'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

const SVG = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
function Ic({ paths, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...SVG}>{paths}</svg>;
}

const IT = {
  gastos: { id: 'gastos', label: 'Gastos', sub: 'Lançamentos e divisão da viagem', cor: '#0F9D6B', bg: 'rgba(16,185,129,.12)', icon: <><rect x="2" y="6" width="20" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></> },
  acerto: { id: 'acerto', label: 'Acerto de contas', sub: 'Quem deve quanto pra quem', cor: '#2D66A8', bg: 'rgba(45,102,168,.12)', icon: <><polyline points="17 2 21 6 17 10" /><path d="M3 12V9a3 3 0 0 1 3-3h15" /><polyline points="7 22 3 18 7 14" /><path d="M21 12v3a3 3 0 0 1-3 3H3" /></> },
  checklist: { id: 'checklist', label: 'Checklist', sub: 'Suas tarefas pra não esquecer nada', cor: '#0E9C8C', bg: 'rgba(0,199,177,.14)', icon: <><path d="M9 11l3 3 9-9" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></> },
  compras: { id: 'compras', label: 'Compras', sub: 'Sua lista do que comprar antes de viajar', cor: '#BA7517', bg: 'rgba(186,117,23,.14)', icon: <><circle cx="9" cy="20" r="1.6" /><circle cx="19" cy="20" r="1.6" /><path d="M2 3h3l2.2 11a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" /></> },
  lugares: { id: 'lugares', label: 'Lugares para Ir', sub: 'Lista de desejos: obrigatórios e sugeridos', cor: '#D4537E', bg: 'rgba(212,83,126,.14)', icon: <><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></> },
  pessoas: { id: 'pessoas', label: 'Pessoas', sub: 'Quem está na viagem', cor: '#534AB7', bg: 'rgba(83,74,183,.14)', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
  viagens: { id: 'viagens', label: 'Trocar de viagem', sub: 'Ver e abrir suas viagens', cor: '#5F5E5A', bg: 'rgba(95,94,90,.12)', icon: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
  frases: { id: 'frases', label: 'Conversar em inglês', sub: 'Frases prontas por situação', cor: '#0E7C9C', bg: 'rgba(14,124,156,.12)', icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></> },
  appsinstalar: { id: 'appsinstalar', label: 'Apps pra instalar', sub: 'Nome, função e o benefício de cada um', cor: '#2563EB', bg: 'rgba(37,99,235,.12)', icon: <><rect x="5" y="2" width="14" height="20" rx="2.5" /><path d="M9 18h6" /></> },
  diario: { id: 'diario', label: 'Diário da viagem', sub: 'Texto, áudio e fotos de cada dia', cor: '#C2410C', bg: 'rgba(234,88,12,.14)', icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
};

const INDIVIDUAL = [IT.checklist, IT.compras];
const COMPARTILHADO = [IT.diario, IT.gastos, IT.acerto, IT.lugares, IT.frases, IT.appsinstalar, IT.pessoas];

export default function Menu({ ir }) {
  const { viagem } = useData();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState('');

  // Card "Conversar em inglês" só some se a viagem tiver perfil definido como
  // nacional (ver NovaViagemWizard). Viagem sem perfil ainda (tipo_viagem
  // ausente) continua mostrando — não some card de viagem já em uso antes
  // dessa personalização existir.
  const semPerfilTipo = !viagem || !viagem.tipo_viagem;
  const mostrarFrases = semPerfilTipo || viagem.tipo_viagem !== 'nacional';

  const bate = (it) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q);
  };
  const individualFiltrado = INDIVIDUAL.filter(bate);
  const compartilhado = mostrarFrases ? COMPARTILHADO : COMPARTILHADO.filter((it) => it.id !== 'frases');
  const compartilhadoFiltrado = [...compartilhado, IT.viagens].filter(bate);
  const semResultado = busca.trim() && individualFiltrado.length === 0 && compartilhadoFiltrado.length === 0;

  const CardGrande = ({ it }) => (
    <button onClick={() => ir(it.id)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 18, padding: 14, background: `linear-gradient(160deg, ${it.bg} 0%, var(--ui-card) 75%)`, position: 'relative', minHeight: 122, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--ui-shadow)' }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: it.cor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic paths={it.icon} size={18} />
      </span>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--ui-ink)', marginBottom: 2 }}>{it.label}</div>
        <div style={{ fontSize: 11, color: 'var(--ui-muted)', lineHeight: 1.3 }}>{it.sub}</div>
      </div>
      <span style={{ position: 'absolute', right: 12, bottom: 12, width: 26, height: 26, borderRadius: '50%', background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--ui-muted)' }}>›</span>
    </button>
  );

  const CardPequeno = ({ it, cheio }) => (
    <button onClick={() => ir(it.id)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 16, padding: 12, background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)', display: 'flex', alignItems: 'flex-start', gap: 10, gridColumn: cheio ? '1 / -1' : 'auto' }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: it.bg, color: it.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <Ic paths={it.icon} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ui-ink)' }}>{it.label}</div>
        <div style={{ fontSize: 11, color: 'var(--ui-muted)', marginTop: 1, lineHeight: 1.25 }}>{it.sub}</div>
      </div>
      <span style={{ color: 'var(--ui-faint)', fontSize: 16, flex: '0 0 auto', marginTop: 1 }}>›</span>
    </button>
  );

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '2px 2px 20px' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Menu</div>
          <div style={{ fontSize: 14, color: 'var(--ui-muted)', marginTop: 2 }}>Tudo da viagem num lugar só ✈️</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flex: '0 0 auto' }}>
          <button onClick={() => setBuscaAberta((v) => !v)} aria-label="Buscar" style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ui-ink)' }}>
            <Ic paths={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>} />
          </button>
          <button aria-label="Notificações" style={{ width: 42, height: 42, borderRadius: 14, border: 'none', background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', color: 'var(--ui-ink)', position: 'relative' }}>
            <Ic paths={<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>} />
            <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: '50%', background: 'var(--ui-teal, #0E9C8C)', border: '2px solid var(--ui-card)' }} />
          </button>
        </div>
      </div>

      {buscaAberta && (
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no menu..." style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 14, padding: '12px 16px', fontSize: 14, marginBottom: 18, background: 'var(--ui-card)', color: 'var(--ui-ink)' }} />
      )}

      {semResultado && (
        <div style={{ textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, padding: '30px 0' }}>Nada encontrado pra "{busca}"</div>
      )}

      {individualFiltrado.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 4px 12px' }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)' }}>INDIVIDUAL</span>
            <span style={{ fontSize: 12, color: 'var(--ui-faint)' }}>🔒 só você vê</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {individualFiltrado.map((it) => <CardGrande key={it.id} it={it} />)}
          </div>
        </div>
      )}

      {compartilhadoFiltrado.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 4px 12px' }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)' }}>COMPARTILHADO</span>
            <span style={{ fontSize: 12, color: 'var(--ui-faint)' }}>🔗 todos da viagem veem</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {compartilhadoFiltrado.map((it) => <CardPequeno key={it.id} it={it} cheio={it.id === 'viagens' || it.id === 'diario'} />)}
          </div>
        </div>
      )}

      <button onClick={() => ir('roteiro')} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 24, borderRadius: 22, padding: '20px 22px', background: 'linear-gradient(135deg,#0E9C8C 0%,#2D66A8 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 26, flex: '0 0 auto' }}>🗺️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Partiu próxima aventura?</div>
          <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>Organize tudo e aproveite cada momento</div>
        </div>
        <span style={{ background: '#fff', color: '#0E9C8C', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 20, whiteSpace: 'nowrap', flex: '0 0 auto' }}>Ver roteiro →</span>
      </button>
    </div>
  );
}

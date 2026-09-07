'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import Reveal from '../ui/Reveal';

const SVG = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
function Ic({ paths, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...SVG}>{paths}</svg>;
}

// Cada item do menu: id = tela (ir(id)), param = argumento extra pro AppShell
// (ex.: aba inicial), so = "só você vê" (dado individual por login).
// As cores dos ícones são a identidade que o menu já tinha; ficam só aqui.
const IT = {
  roteiro: { id: 'roteiro', label: 'Roteiro', sub: 'Dia a dia da viagem, destinos e horários', cor: '#0E9C8C', bg: 'rgba(0,199,177,.14)', icon: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></> },
  passagens: { id: 'passagens', label: 'Passagem aérea', sub: 'Voo, localizador, pedido e 0800', cor: '#7C3AED', bg: 'rgba(124,58,237,.13)', icon: <><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></> },
  reservas: { id: 'motorhome', param: 'rvparks', key: 'reservas', label: 'Reservas RV Park', sub: 'Noite a noite: onde parar e o comprovante', cor: '#BA7517', bg: 'rgba(186,117,23,.14)', icon: <><path d="M3 20h18" /><path d="M5 20V9l7-5 7 5v11" /><path d="M9 20v-6h6v6" /></> },
  checklist: { id: 'checklist', label: 'Checklist', sub: 'Suas tarefas pra não esquecer nada', so: true, cor: '#0E9C8C', bg: 'rgba(0,199,177,.14)', icon: <><path d="M9 11l3 3 9-9" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></> },
  compras: { id: 'compras', label: 'Compras', sub: 'O que comprar antes de viajar', so: true, cor: '#BA7517', bg: 'rgba(186,117,23,.14)', icon: <><circle cx="9" cy="20" r="1.6" /><circle cx="19" cy="20" r="1.6" /><path d="M2 3h3l2.2 11a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L22 7H6" /></> },
  appsinstalar: { id: 'appsinstalar', label: 'Apps pra instalar', sub: 'O que baixar antes de embarcar', cor: '#2563EB', bg: 'rgba(37,99,235,.12)', icon: <><rect x="5" y="2" width="14" height="20" rx="2.5" /><path d="M9 18h6" /></> },

  lugares: { id: 'lugares', label: 'Lugares para ir', sub: 'Obrigatórios e sugeridos', cor: '#D4537E', bg: 'rgba(212,83,126,.14)', icon: <><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></> },
  mapa: { id: 'mapa', label: 'Mapa', sub: 'A rota inteira no mapa', cor: '#2D66A8', bg: 'rgba(45,102,168,.12)', icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></> },
  diario: { id: 'diario', label: 'Diário da viagem', sub: 'Texto, áudio e fotos de cada dia', cor: '#C2410C', bg: 'rgba(234,88,12,.14)', icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
  frases: { id: 'frases', label: 'Conversar em inglês', sub: 'Frases prontas + tradutor por foto e voz', cor: '#0E7C9C', bg: 'rgba(14,124,156,.12)', icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></> },

  gastos: { id: 'gastos', label: 'Gastos', sub: 'Lançamentos e divisão da viagem', cor: '#0F9D6B', bg: 'rgba(16,185,129,.12)', icon: <><rect x="2" y="6" width="20" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></> },
  acerto: { id: 'acerto', label: 'Acerto de contas', sub: 'Quem deve quanto pra quem', cor: '#2D66A8', bg: 'rgba(45,102,168,.12)', icon: <><polyline points="17 2 21 6 17 10" /><path d="M3 12V9a3 3 0 0 1 3-3h15" /><polyline points="7 22 3 18 7 14" /><path d="M21 12v3a3 3 0 0 1-3 3H3" /></> },
  motorhome: { id: 'motorhome', label: 'Motorhome', sub: 'Custos, km rodados e mercado', cor: '#0F6E56', bg: 'rgba(15,110,86,.13)', icon: <><rect x="2" y="7" width="13" height="9" rx="2.5" /><path d="M15 10h3.4a1 1 0 0 1 .8.4L21 13v3h-6" /><circle cx="6.5" cy="18" r="1.9" /><circle cx="16.5" cy="18" r="1.9" /></> },
  documentos: { id: 'documentos', label: 'Documentos', sub: 'Passagens, reservas, ESTA, seguro — PDF ou foto', cor: '#B45309', bg: 'rgba(180,83,9,.13)', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" /></> },
  pessoas: { id: 'pessoas', label: 'Pessoas', sub: 'Quem está na viagem', cor: '#534AB7', bg: 'rgba(83,74,183,.14)', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },

  viagens: { id: 'viagens', label: 'Trocar de viagem', sub: 'Ver e abrir suas viagens', cor: '#5F5E5A', bg: 'rgba(95,94,90,.12)', icon: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></> },
  conta: { id: 'conta', label: 'Minha conta', sub: 'Seu nome e sua sessão', cor: '#5F5E5A', bg: 'rgba(95,94,90,.12)', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></> },
};

// Fora do componente: definido dentro, cada digitação na busca remontava as linhas.
function Linha({ it, onClick }) {
  return (
    <button onClick={onClick} className="ui-rowbtn ui-press">
      <span style={{ width: 40, height: 40, borderRadius: 12, background: it.bg, color: it.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <Ic paths={it.icon} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="ui-clamp1" style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--ui-ink)' }}>{it.label}</span>
        <span className="ui-clamp1" style={{ display: 'block', fontSize: 12, color: 'var(--ui-muted)', marginTop: 1 }}>{it.sub}</span>
      </span>
      {it.so && <span className="ui-pill ui-pill-neutral" style={{ flex: '0 0 auto' }}>🔒 só você</span>}
      <span style={{ color: 'var(--ui-faint)', fontSize: 18, flex: '0 0 auto', lineHeight: 1 }}>›</span>
    </button>
  );
}

function Grupo({ titulo, dica, itens, ir, delay }) {
  if (itens.length === 0) return null;
  return (
    <Reveal delay={delay} style={{ marginBottom: 22 }}>
      <div className="ui-section" style={{ marginTop: 0 }}>
        <span>{titulo}</span>
        <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600, color: 'var(--ui-faint)' }}>{dica}</span>
      </div>
      <div className="ui-card ui-list" style={{ padding: '2px 16px' }}>
        {itens.map((it) => <Linha key={it.key || it.id} it={it} onClick={() => (it.param ? ir(it.id, it.param) : ir(it.id))} />)}
      </div>
    </Reveal>
  );
}

export default function Menu({ ir }) {
  const { viagem, perfis } = useData();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState('');

  // Card "Conversar em inglês" só some se a viagem tiver perfil definido como
  // nacional (ver NovaViagemWizard). Viagem sem perfil ainda (tipo_viagem
  // ausente) continua mostrando — não some card de viagem já em uso antes
  // dessa personalização existir.
  const semPerfilTipo = !viagem || !viagem.tipo_viagem;
  const mostrarFrases = semPerfilTipo || viagem.tipo_viagem !== 'nacional';

  // "Acerto de contas" só faz sentido com mais de uma pessoa na viagem —
  // sozinho não tem com quem acertar.
  const sozinho = (perfis || []).length <= 1;

  // Passagem aérea / Motorhome seguem o transporte marcado no perfil da viagem.
  // Viagem sem perfil de transporte (as antigas) continua vendo tudo — mesma
  // regra da barra de navegação (Nav.js).
  const transporte = Array.isArray(viagem?.transporte) ? viagem.transporte : [];
  const mostrarPassagens = transporte.length === 0 || transporte.includes('aviao');
  const mostrarMotorhome = transporte.length === 0 || transporte.includes('motorhome');

  const bate = (it) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q);
  };

  // Três momentos da viagem — planejar antes, viver durante, controlar sempre.
  const planejar = [IT.roteiro, mostrarPassagens && IT.passagens, mostrarMotorhome && IT.reservas, IT.checklist, IT.compras, IT.appsinstalar].filter(Boolean).filter(bate);
  const viver = [IT.lugares, IT.mapa, IT.diario, mostrarFrases && IT.frases].filter(Boolean).filter(bate);
  const controlar = [IT.gastos, !sozinho && IT.acerto, mostrarMotorhome && IT.motorhome, IT.documentos, IT.pessoas].filter(Boolean).filter(bate);
  const geral = [IT.viagens, IT.conta].filter(bate);
  const semResultado = busca.trim() && planejar.length + viver.length + controlar.length + geral.length === 0;

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="Menu"
        subtitulo="Tudo da viagem, organizado por momento"
        acao={(
          <button
            onClick={() => { setBuscaAberta((v) => !v); if (buscaAberta) setBusca(''); }}
            aria-label={buscaAberta ? 'Fechar busca' : 'Buscar no menu'}
            aria-pressed={buscaAberta}
            className="ui-iconbtn raised ui-press"
            style={buscaAberta ? { background: 'var(--ui-teal-soft)', color: 'var(--ui-teal-ink)' } : undefined}
          >
            <Ic paths={buscaAberta ? <><path d="M18 6L6 18M6 6l12 12" /></> : <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>} size={20} />
          </button>
        )}
      />

      {buscaAberta && (
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no menu…" className="ui-input ui-in" style={{ marginBottom: 18 }} />
      )}

      {semResultado ? (
        <EmptyState compacto icone="🔎" titulo={`Nada com “${busca.trim()}”`} texto="Tente outra palavra — por exemplo: gastos, roteiro, documentos." cta="Limpar busca" onCta={() => setBusca('')} />
      ) : (
        <>
          <Grupo titulo="Planejar" dica="antes de sair" itens={planejar} ir={ir} delay={0} />
          <Grupo titulo="Viver" dica="durante a viagem" itens={viver} ir={ir} delay={0.05} />
          <Grupo titulo="Controlar" dica="dinheiro e papéis" itens={controlar} ir={ir} delay={0.1} />
          <Grupo titulo="Geral" dica="" itens={geral} ir={ir} delay={0.15} />
        </>
      )}
    </div>
  );
}

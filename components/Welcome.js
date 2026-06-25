'use client';

export default function Welcome({ onComecar, onEntrar }) {
  const T = '#00C7B1', TD = '#0E9F97', INK = '#111827', SUB = '#6B7280';
  const beneficios = [
    ['🧳', 'Cadastrar suas viagens', 'Guarde todos os detalhes das suas viagens futuras.'],
    ['🔔', 'Receber lembretes', 'Nunca mais perca um voo ou reserva importante.'],
    ['👥', 'Compartilhar com quem vai', 'Convide e mantenha todos na mesma viagem.'],
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#fff', overflowX: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: INK, maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes wlFade { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none;} }
        @keyframes wlRise { from { opacity:0; transform:translateY(16px) scale(.98);} to { opacity:1; transform:none;} }
        .wl-b { opacity:0; animation: wlFade .5s ease forwards; }
      `}</style>

      {/* HERO: imagem ao fundo + texto por cima (full-bleed, fundo na cor do céu) */}
      <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', background: '#DFF1FD', paddingTop: 44, animation: 'wlRise .7s ease' }}>
        <div style={{ textAlign: 'center', padding: '0 28px 4px', maxWidth: 350, margin: '0 auto' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>Bem-vindo ao</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.03, marginTop: 2 }}><span style={{ color: T }}>Encorpei</span> na Trip ✈️</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 8, lineHeight: 1.45 }}>Organize, acompanhe e compartilhe todas as suas viagens em um só lugar.</div>
        </div>
        <img src="/welcome-hero.jpg" alt="Mala, passaporte e avião em viagem" style={{ width: '100%', display: 'block', marginTop: 8 }} />
      </div>

      {/* parte de baixo (compacta) */}
      <div style={{ padding: '8px 22px 18px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, margin: '0 0 9px' }}>Aqui você pode:</div>
        {beneficios.map(([ic, tit, desc], i) => (
          <div key={i} className="wl-b" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9, animationDelay: `${0.15 + i * 0.12}s` }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(0,199,177,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{ic}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{tit}</div>
              <div style={{ fontSize: 11, color: SUB, marginTop: 1, lineHeight: 1.3 }}>{desc}</div>
            </div>
          </div>
        ))}

        <button onClick={onEntrar} style={{ width: '100%', height: 48, borderRadius: 15, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${T} 0%, ${TD} 100%)`, color: '#fff', fontSize: 14.5, fontWeight: 700, boxShadow: '0 9px 20px rgba(0,199,177,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 6, animation: 'wlRise .6s ease .3s both' }}>Entrar <span style={{ fontSize: 16 }}>→</span></button>
        <div style={{ textAlign: 'center', marginTop: 11, fontSize: 12.5, color: SUB }}>Não tem conta? <span onClick={onComecar} style={{ color: T, fontWeight: 700, cursor: 'pointer' }}>Abrir sua conta</span></div>
      </div>
    </div>
  );
}

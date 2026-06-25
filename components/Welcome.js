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

      {/* HERO: imagem ao fundo + texto por cima (full-bleed, cobre 100% da largura) */}
      <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', background: 'linear-gradient(180deg,#E9F6FB 0%,#E4F3F9 100%)', paddingTop: 48, animation: 'wlRise .7s ease' }}>
        <div style={{ textAlign: 'center', padding: '0 34px 4px', maxWidth: 340, margin: '0 auto' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>Bem-vindo ao</div>
          <div style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.05, marginTop: 2 }}><span style={{ color: T }}>Encorpei</span> na Trip ✈️</div>
          <div style={{ fontSize: 11.5, color: SUB, marginTop: 7, lineHeight: 1.45 }}>Organize, acompanhe e compartilhe todas as suas viagens em um só lugar.</div>
        </div>
        <img src="/welcome-hero.jpg" alt="Mala, passaporte e avião em viagem" style={{ width: '100%', display: 'block', marginTop: 10 }} />
      </div>

      {/* parte de baixo (compacta) */}
      <div style={{ padding: '12px 22px 22px' }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, margin: '2px 0 11px' }}>Aqui você pode:</div>
        {beneficios.map(([ic, tit, desc], i) => (
          <div key={i} className="wl-b" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginBottom: 11, animationDelay: `${0.15 + i * 0.12}s` }}>
            <span style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(0,199,177,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flex: '0 0 auto' }}>{ic}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{tit}</div>
              <div style={{ fontSize: 12, color: SUB, marginTop: 1, lineHeight: 1.35 }}>{desc}</div>
            </div>
          </div>
        ))}

        <button onClick={onComecar} style={{ width: '100%', height: 52, borderRadius: 17, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${T} 0%, ${TD} 100%)`, color: '#fff', fontSize: 15, fontWeight: 700, boxShadow: '0 10px 22px rgba(0,199,177,.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, animation: 'wlRise .6s ease .3s both' }}>Começar agora <span style={{ fontSize: 17 }}>→</span></button>
        <div style={{ textAlign: 'center', marginTop: 13, fontSize: 13, color: SUB }}>Já tem uma conta? <span onClick={onEntrar} style={{ color: T, fontWeight: 700, cursor: 'pointer' }}>Entrar</span></div>
      </div>
    </div>
  );
}

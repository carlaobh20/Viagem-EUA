'use client';

export default function Welcome({ onComecar, onEntrar }) {
  const T = '#00C7B1', TD = '#0E9F97', INK = '#111827', SUB = '#6B7280';
  const beneficios = [
    ['🧳', 'Cadastrar suas viagens', 'Guarde todos os detalhes das suas viagens futuras.'],
    ['🔔', 'Receber lembretes', 'Nunca mais perca um voo ou reserva importante.'],
    ['👥', 'Compartilhar com quem vai', 'Convide e mantenha todos na mesma viagem.'],
  ];
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#E6F5FB 0%,#F4FBFD 42%,#FFFFFF 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: INK, padding: '46px 22px 26px', maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes wlFade { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:none;} }
        @keyframes wlPlane { 0% { transform:translateX(-30px);} 100% { transform:translateX(20px);} }
        @keyframes wlRise { from { opacity:0; transform:translateY(16px) scale(.98);} to { opacity:1; transform:none;} }
        .wl-b { opacity:0; animation: wlFade .5s ease forwards; }
      `}</style>

      {/* título */}
      <div style={{ textAlign: 'center', animation: 'wlFade .5s ease' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: INK }}>Bem-vindo ao</div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.05, marginTop: 2 }}><span style={{ color: T }}>Encorpei</span> na Trip ✈️</div>
        <div style={{ fontSize: 15, color: SUB, marginTop: 12, lineHeight: 1.45, padding: '0 8px' }}>Organize, acompanhe e compartilhe todas as suas viagens em um só lugar.</div>
      </div>

      {/* hero (imagem) */}
      <div style={{ position: 'relative', margin: '6px 0', animation: 'wlRise .7s ease' }}>
        <img src="/welcome-hero.jpg" alt="Mala, passaporte e avião em viagem" style={{ width: '100%', display: 'block' }} />
      </div>

      {/* benefícios */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Aqui você pode:</div>
        {beneficios.map(([ic, tit, desc], i) => (
          <div key={i} className="wl-b" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16, animationDelay: `${0.15 + i * 0.12}s` }}>
            <span style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(0,199,177,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: '0 0 auto' }}>{ic}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>{tit}</div>
              <div style={{ fontSize: 14, color: SUB, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* botão + rodapé */}
      <div style={{ marginTop: 'auto', paddingTop: 18 }}>
        <button onClick={onComecar} style={{ width: '100%', height: 60, borderRadius: 20, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${T} 0%, ${TD} 100%)`, color: '#fff', fontSize: 17, fontWeight: 700, boxShadow: '0 12px 26px rgba(0,199,177,.34)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, animation: 'wlRise .6s ease .3s both' }}>Começar agora <span style={{ fontSize: 19 }}>→</span></button>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14.5, color: SUB }}>Já tem uma conta? <span onClick={onEntrar} style={{ color: T, fontWeight: 700, cursor: 'pointer' }}>Entrar</span></div>
      </div>
    </div>
  );
}

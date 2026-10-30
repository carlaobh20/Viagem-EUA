'use client';
import { useEffect } from 'react';

/* Celular ilustrativo (dados de exemplo, não reais) usado no hero, no painel
   "Controle financeiro completo" e na faixa final de CTA. */
function PhoneScreen({ compact }) {
  return (
    <div className="notch-wrap">
      <div className="notch"></div>
      <div className="screen">
        <div className="ph-status"><span>16:37</span><span>●●● Wi-Fi 100%</span></div>
        <div className="ph-top">
          <div className="ph-brand"><div className="n"><span className="flag">🇺🇸</span>Viagem EUA</div><div className="d">22 set · 27 out · 36 dias</div></div>
          <span className="ph-rate">R$ 5,20</span>
        </div>
        <div className="ph-card">
          <div className="row2">
            <div><div className="lbl">Faltam</div><div className="big">64 dias</div></div>
            <div style={{ textAlign: 'right' }}><div className="lbl">Gasto total</div><div className="big">R$ 20.434,67</div></div>
          </div>
          <div className="ph-bar"><i></i></div>
          <div className="ph-sub">41% · R$ 29.565,33 restantes de R$ 50.000</div>
        </div>
        <div className="ph-event">
          <span className="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 10l7 3 3 7 8-17Z" /></svg></span>
          <div className="t"><div className="k">Próximo evento</div><div className="v">Maringá → São Paulo</div><div className="d">22 set · 10:15</div></div>
        </div>
        {!compact && <>
          <div className="ph-sec"><span>Roteiro da viagem</span><span style={{ color: 'var(--teal-d)' }}>ver mapa</span></div>
          <div className="ph-timeline">
            <div className="ph-tstop"><span className="d"></span><span>MGF</span></div>
            <div className="ph-tstop"><span className="d"></span><span>GRU</span></div>
            <div className="ph-tstop"><span className="d"></span><span>MCO</span></div>
            <div className="ph-tstop"><span className="d"></span><span>JFK</span></div>
            <div className="ph-tstop"><span className="d"></span><span>GRU</span></div>
          </div>
          <div className="ph-sec" style={{ marginTop: 16 }}><span>Resumo de gastos</span><span style={{ color: 'var(--teal-d)' }}>ver todos</span></div>
          <div className="ph-row"><div className="r1"><span className="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 10l7 3 3 7 8-17Z" /></svg></span><span className="t">Passagens aéreas</span><span className="a">R$ 19.570,68</span></div><div className="mbar"><i style={{ width: '88%' }}></i></div></div>
          <div className="ph-row"><div className="r1"><span className="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h5M8 12h8M8 16h6" /></svg></span><span className="t">Documentos / passaporte</span><span className="a">R$ 433,62</span></div><div className="mbar"><i style={{ width: '12%' }}></i></div></div>
          <div className="ph-row"><div className="r1"><span className="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h16M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /></svg></span><span className="t">Visto</span><span className="a">R$ 430,37</span></div><div className="mbar"><i style={{ width: '9%' }}></i></div></div>
        </>}
        <div className="ph-status-row">
          <span className="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2M4 10h5l2 3h2l2-3h5v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" /></svg></span>
          <div><div className="k">A acertar</div><div className="v">Tudo certo ✅</div></div>
        </div>
        <div className="ph-status-row">
          <span className="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h5M8 12h8M8 16h6" /></svg></span>
          <div><div className="k">Checklist</div><div className="v">18 de 100 itens</div></div>
          <div className="r"><div className="pct">18%</div></div>
        </div>
        <div className="ph-nav">
          <div className="n on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" /></svg><b>Início</b></div>
          <div className="n"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 16V9a2 2 0 0 1 2-2h3l2-2h4l2 2h1a2 2 0 0 1 2 2v7" /><rect x="2" y="16" width="20" height="3" rx="1" /></svg><b>Motorhome</b></div>
          <span className="add"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
          <div className="n"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20 3 18V4l6 2m0 14 6-2m-6 2V6m6 12 6 2V6l-6-2m0 16V4" /></svg><b>Roteiro</b></div>
          <div className="n"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg><b>Menu</b></div>
        </div>
      </div>
    </div>
  );
}

function Phone({ compact }) {
  return (
    <div className="phone">
      <PhoneScreen compact={compact} />
    </div>
  );
}

const FEATURES = [
  ['Gastos', <><circle cx="8" cy="12" r="6" /><circle cx="16" cy="12" r="6" /></>],
  ['Roteiro', <path d="M9 20 3 18V4l6 2m0 14 6-2m-6 2V6m6 12 6 2V6l-6-2m0 16V4" />],
  ['Checklist', <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h5M8 12h8M8 16h6" /></>],
  ['Motorhome', <><path d="M3 16V9a2 2 0 0 1 2-2h3l2-2h4l2 2h1a2 2 0 0 1 2 2v7" /><rect x="2" y="16" width="20" height="3" rx="1" /><circle cx="7" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>],
  ['Mapa', <><path d="M12 22s7-7.4 7-12.5a7 7 0 1 0-14 0C5 14.6 12 22 12 22Z" /><circle cx="12" cy="9.5" r="2.5" /></>],
  ['Acerto', <path d="M17 8V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2M4 10h5l2 3h2l2-3h5v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />],
  ['Frases', <path d="M20 3H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4l3 3 3-3h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z" />],
  ['Pessoas', <><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="18" cy="9" r="2.6" /><path d="M15.5 20a5 5 0 0 1 6.7-4.7" /></>],
];

const CHECKLIST_FINANCEIRO = [
  'Orçamento total da viagem',
  'Quanto já gastou e quanto falta',
  'Categorias de despesas',
  'Moedas — real e dólar juntos',
  'Acerto automático entre todos',
];

const PLANEJAMENTO = [
  ['Checklist inteligente', 'Por tema, compartilhado', <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h5M8 12h8M8 16h6" /></>],
  ['Roteiro completo', 'Dia a dia, com clima', <path d="M9 20 3 18V4l6 2m0 14 6-2m-6 2V6m6 12 6 2V6l-6-2m0 16V4" />],
  ['Contagem regressiva', 'Dias até a viagem', <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>],
  ['Alertas importantes', 'Próximo evento sempre à vista', <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>],
  ['Convite instantâneo', 'Um código, todo mundo dentro', <><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="18" cy="9" r="2.6" /><path d="M15.5 20a5 5 0 0 1 6.7-4.7" /></>],
  ['Tudo em tempo real', 'Sincronizado pra família toda', <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />],
];

const SCREENS = [
  ['Controle de gastos', 'Cadastre e categorize cada despesa', <><circle cx="8" cy="12" r="6" /><circle cx="16" cy="12" r="6" /></>],
  ['Roteiro', 'Organize todos os dias da viagem', <path d="M9 20 3 18V4l6 2m0 14 6-2m-6 2V6m6 12 6 2V6l-6-2m0 16V4" />],
  ['Motorhome', 'Custo por dia, por km e diário', <><path d="M3 16V9a2 2 0 0 1 2-2h3l2-2h4l2 2h1a2 2 0 0 1 2 2v7" /><rect x="2" y="16" width="20" height="3" rx="1" /><circle cx="7" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></>],
  ['Lugares', 'Restaurantes, parques e passeios', <><path d="M12 22s7-7.4 7-12.5a7 7 0 1 0-14 0C5 14.6 12 22 12 22Z" /><circle cx="12" cy="9.5" r="2.5" /></>],
  ['Checklist', 'Nada fica pra última hora', <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h5M8 12h8M8 16h6" /></>],
  ['Acertos', 'Quem deve pra quem, sem climão', <path d="M17 8V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2M4 10h5l2 3h2l2-3h5v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />],
];

const TAGS = ['Internacional', 'Disney', 'Road trip', 'Motorhome', 'Parques nacionais', 'Praia', 'Família', 'Casal'];

const STATS = [
  ['12', 'funções em um só app'],
  ['2', 'moedas, sem contas de cabeça'],
  ['∞', 'gastos, checklist e roteiro'],
  ['100%', 'em tempo real pra família toda'],
  ['0', 'planilhas e grupos lotados'],
];

const STEPS = [
  ['01', 'Crie a viagem', 'Defina destino, datas, orçamento e quem vai com você.'],
  ['02', 'Monte tudo junto', 'Roteiro, reservas, checklist, lugares e gastos ficam sincronizados.'],
  ['03', 'Viaje sem fazer conta', 'O app acompanha cada despesa e mostra o saldo final de cada pessoa.'],
];

const FAQS = [
  ['Serve apenas para viagens aos Estados Unidos?', 'Não. O app nasceu em uma viagem aos EUA, mas pode organizar viagens para qualquer destino.'],
  ['Consigo dividir os gastos com outras pessoas?', 'Sim. Você registra quem pagou, escolhe quem participou e o app consolida o saldo de cada pessoa.'],
  ['Todo mundo consegue acompanhar a mesma viagem?', 'Sim. Os participantes convidados acompanham as informações compartilhadas da viagem no mesmo lugar.'],
  ['Funciona com real e dólar?', 'Sim. As despesas podem ser registradas em real ou dólar, com conversão e totais organizados.'],
];

export default function Welcome({ onComecar, onEntrar }) {
  useEffect(() => {
    const nav = document.getElementById('lp-nav');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('shown'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.lp-reveal').forEach((el) => observer.observe(el));
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
  }, []);

  return (
    <div className="lp-root">
      <style>{`
        .lp-root{ --ink:#0F1B19; --muted:#5B6B68; --faint:#8B9C99; --teal:#00C7B1; --teal-d:#049182; --navy:#062824; --navy-2:#0B1614; --line:rgba(15,27,25,.09); --paper:#FAF9F5; --card:#FFFFFF; --glow:rgba(0,199,177,.35); }
        .lp-root{ font-family:'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:var(--ink); background:var(--paper); -webkit-font-smoothing:antialiased; overflow-x:hidden; }
        .lp-root img{ max-width:100%; display:block; }
        .lp-root .wrap{ max-width:1220px; margin:0 auto; padding:0 32px; }
        .lp-root .eyebrow{ font-size:12.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--teal); }
        .lp-root h1,.lp-root h2,.lp-root h3{ font-weight:800; letter-spacing:-0.02em; line-height:1.08; margin:0; }
        .lp-root .btn{ display:inline-flex; align-items:center; gap:9px; height:52px; padding:0 26px; border-radius:100px; font-size:15px; font-weight:700; cursor:pointer; border:none; text-decoration:none; transition:transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .lp-root .btn:hover{ transform:translateY(-2px); }
        .lp-root .btn-primary{ background:linear-gradient(135deg,var(--teal),var(--teal-d)); color:#fff; box-shadow:0 14px 30px -8px var(--glow); }
        .lp-root .btn-primary:hover{ filter:brightness(1.06); }
        .lp-root .btn-outline{ background:transparent; color:var(--ink); border:1.5px solid var(--line); }
        .lp-root .btn-outline:hover{ background:#F1EFE8; }
        .lp-root .btn-outline.on-dark{ color:#fff; border-color:rgba(255,255,255,.35); background:rgba(255,255,255,.06); }
        .lp-root .btn-outline.on-dark:hover{ background:rgba(255,255,255,.14); }
        .lp-root .icon-box{ width:42px; height:42px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }

        .lp-root nav{ position:sticky; top:0; left:0; right:0; z-index:100; padding:18px 0; transition:background .3s ease, padding .3s ease, box-shadow .3s ease; }
        .lp-root nav.scrolled{ background:rgba(250,249,245,.85); backdrop-filter:blur(10px); padding:13px 0; box-shadow:0 1px 0 var(--line); }
        .lp-root nav .row{ display:flex; align-items:center; justify-content:space-between; }
        .lp-root .logo{ display:flex; align-items:center; gap:10px; color:var(--ink); font-weight:800; font-size:17px; }
        .lp-root .logo-name{ white-space:nowrap; }
        .lp-root .logo .mark{ width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,var(--teal),var(--teal-d)); display:flex; align-items:center; justify-content:center; }
        .lp-root .nav-links{ display:flex; align-items:center; gap:6px; }
        .lp-root .nav-links a.link{ color:var(--ink); text-decoration:none; font-size:14px; font-weight:600; padding:10px 15px; border-radius:10px; opacity:.75; }
        .lp-root .nav-links a.link:hover{ opacity:1; background:rgba(15,27,25,.05); }
        .lp-root .nav-links .btn{ height:44px; padding:0 22px; font-size:14px; margin-left:8px; }

        .lp-root .phone{ width:308px; background:#111; border-radius:46px; padding:11px; box-shadow:0 40px 70px -20px rgba(6,20,18,.55), 0 0 0 1px rgba(255,255,255,.06); flex:0 0 auto; }
        .lp-root .notch{ width:100px; height:24px; background:#111; border-radius:0 0 18px 18px; margin:0 auto; position:relative; z-index:3; margin-bottom:-24px; }
        .lp-root .screen{ background:var(--paper); border-radius:35px; overflow:hidden; position:relative; }
        .lp-root .ph-status{ display:flex; justify-content:space-between; align-items:center; padding:16px 22px 2px; font-size:12px; font-weight:700; color:var(--ink); }
        .lp-root .ph-top{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px 10px; }
        .lp-root .ph-brand{ display:flex; flex-direction:column; gap:1px; }
        .lp-root .ph-brand .n{ display:flex; align-items:center; gap:6px; font-weight:800; font-size:14.5px; }
        .lp-root .ph-brand .d{ font-size:10px; color:var(--muted); font-weight:600; }
        .lp-root .ph-rate{ font-size:10.5px; font-weight:700; color:#B4790F; background:#FBEEDA; padding:4px 9px; border-radius:20px; }
        .lp-root .ph-card{ margin:6px 16px; background:linear-gradient(120deg,var(--navy-2) 45%,var(--teal-d)); border-radius:18px; padding:16px 18px; color:#fff; position:relative; overflow:hidden; }
        .lp-root .ph-card .row2{ display:flex; justify-content:space-between; align-items:flex-end; position:relative; }
        .lp-root .ph-card .big{ font-size:19px; font-weight:800; }
        .lp-root .ph-card .lbl{ font-size:9.5px; opacity:.8; text-transform:uppercase; letter-spacing:.04em; }
        .lp-root .ph-bar{ height:5px; background:rgba(255,255,255,.22); border-radius:10px; margin-top:10px; overflow:hidden; position:relative; }
        .lp-root .ph-bar i{ display:block; height:100%; width:41%; background:#fff; border-radius:10px; }
        .lp-root .ph-sub{ font-size:10px; color:rgba(255,255,255,.75); margin-top:7px; position:relative; }
        .lp-root .ph-event{ margin:10px 16px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:11px 13px; display:flex; align-items:center; gap:10px; }
        .lp-root .ph-event .ic{ width:32px; height:32px; border-radius:10px; background:#E3FBF6; color:var(--teal-d); display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
        .lp-root .ph-event .t{ flex:1; }
        .lp-root .ph-event .k{ font-size:9.5px; color:var(--muted); }
        .lp-root .ph-event .v{ font-size:12px; font-weight:800; margin-top:1px; }
        .lp-root .ph-event .d{ font-size:9.5px; color:var(--muted); margin-top:1px; }
        .lp-root .ph-sec{ font-size:10.5px; font-weight:700; color:var(--muted); margin:14px 18px 8px; display:flex; justify-content:space-between; }
        .lp-root .ph-timeline{ display:flex; align-items:flex-start; padding:0 28px; position:relative; }
        .lp-root .ph-timeline::before{ content:''; position:absolute; left:34px; right:34px; top:5px; height:1.5px; background:repeating-linear-gradient(90deg,var(--line) 0 4px, transparent 4px 8px); }
        .lp-root .ph-tstop{ flex:1; text-align:center; position:relative; min-width:0; }
        .lp-root .ph-tstop .d{ width:10px; height:10px; border-radius:50%; background:var(--teal); margin:0 auto 6px; position:relative; z-index:2; box-shadow:0 0 0 3px var(--paper); }
        .lp-root .ph-tstop span{ font-size:8px; color:var(--muted); font-weight:700; white-space:nowrap; }
        .lp-root .ph-row{ padding:9px 18px; }
        .lp-root .ph-row .r1{ display:flex; align-items:center; gap:10px; }
        .lp-root .ph-row .ic{ width:28px; height:28px; border-radius:9px; background:#E3FBF6; color:var(--teal-d); display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
        .lp-root .ph-row .t{ font-size:11.5px; font-weight:700; flex:1; }
        .lp-root .ph-row .a{ font-size:11.5px; font-weight:700; }
        .lp-root .ph-row .mbar{ height:3px; background:var(--line); border-radius:6px; margin-top:6px; margin-left:38px; overflow:hidden; }
        .lp-root .ph-row .mbar i{ display:block; height:100%; background:var(--teal); border-radius:6px; }
        .lp-root .ph-status-row{ display:flex; align-items:center; gap:10px; margin:8px 16px; background:#fff; border:1px solid var(--line); border-radius:13px; padding:10px 12px; }
        .lp-root .ph-status-row .ic{ width:26px; height:26px; border-radius:8px; background:#E3FBF6; color:var(--teal-d); display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
        .lp-root .ph-status-row .k{ font-size:9px; color:var(--muted); }
        .lp-root .ph-status-row .v{ font-size:11.5px; font-weight:800; margin-top:1px; }
        .lp-root .ph-status-row .r{ margin-left:auto; text-align:right; }
        .lp-root .ph-status-row .pct{ font-size:11px; font-weight:800; color:var(--teal-d); }
        .lp-root .ph-nav{ display:flex; justify-content:space-around; align-items:center; padding:11px 10px 16px; border-top:1px solid var(--line); margin-top:8px; }
        .lp-root .ph-nav .n{ display:flex; flex-direction:column; align-items:center; gap:2px; }
        .lp-root .ph-nav .n svg{ width:18px; height:18px; color:var(--faint); }
        .lp-root .ph-nav .n.on svg{ color:var(--teal-d); }
        .lp-root .ph-nav .n b{ font-size:7.5px; color:var(--faint); font-weight:700; }
        .lp-root .ph-nav .n.on b{ color:var(--teal-d); }
        .lp-root .ph-nav .add{ width:38px; height:38px; border-radius:50%; background:var(--teal); color:#fff; display:flex; align-items:center; justify-content:center; margin-top:-20px; box-shadow:0 8px 18px -4px var(--glow); }

        .lp-root .hero{ position:relative; padding:70px 0 100px; background:radial-gradient(900px 500px at 90% 0%, rgba(0,199,177,.12), transparent 60%); }
        .lp-root .hero-grid{ display:grid; grid-template-columns:1.15fr .85fr; gap:30px; align-items:center; position:relative; }
        .lp-root .badge-pill{ display:inline-flex; align-items:center; gap:8px; background:#EAF6F2; border:1px solid rgba(0,199,177,.3); color:var(--teal-d); font-size:13px; font-weight:700; padding:8px 16px; border-radius:100px; margin-bottom:24px; }
        .lp-root .hero h1{ font-size:52px; max-width:560px; }
        .lp-root .hero h1 span{ color:var(--teal-d); }
        .lp-root .hero p.lead{ font-size:17px; color:var(--muted); max-width:470px; margin-top:20px; line-height:1.6; }
        .lp-root .hero-ctas{ display:flex; gap:14px; margin-top:34px; flex-wrap:wrap; }
        .lp-root .hero-visual{ position:relative; display:flex; justify-content:center; }
        .lp-root .travel-stage{ width:min(100%,540px); min-height:590px; position:relative; display:flex; justify-content:center; align-items:center; border-radius:40px; background:url('/landing-phone-airport.jpg') center 43%/cover; box-shadow:0 38px 80px -34px rgba(6,40,36,.48); overflow:hidden; isolation:isolate; }
        .lp-root .travel-stage::after{ content:''; position:absolute; inset:0; background:linear-gradient(180deg,transparent 35%,rgba(6,24,21,.58)); z-index:-1; }
        .lp-root .float-note{ position:absolute; z-index:4; background:rgba(255,255,255,.92); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.75); box-shadow:0 18px 40px -18px rgba(6,30,26,.42); border-radius:16px; padding:11px 14px; font-size:12px; font-weight:800; color:var(--ink); }
        .lp-root .float-note span{ display:block; color:var(--teal-d); font-size:10px; font-weight:700; margin-bottom:2px; }
        .lp-root .float-note.one{ top:56px; left:22px; transform:rotate(-3deg); }
        .lp-root .float-note.two{ right:18px; bottom:38px; transform:rotate(3deg); }
        .lp-root .trust-line{ display:flex; align-items:center; gap:14px; margin-top:22px; color:var(--muted); font-size:12.5px; font-weight:600; flex-wrap:wrap; }
        .lp-root .trust-line span{ display:inline-flex; align-items:center; gap:6px; }
        .lp-root .trust-line i{ width:6px; height:6px; border-radius:50%; background:var(--teal); display:inline-block; }

        .lp-root .icon-strip{ background:var(--card); border:1px solid var(--line); border-radius:24px; padding:30px 20px; display:grid; grid-template-columns:repeat(8,1fr); gap:8px; box-shadow:0 30px 60px -30px rgba(6,20,18,.15); }
        .lp-root .icon-strip .it{ text-align:center; padding:8px 4px; }
        .lp-root .icon-strip .icon-box{ background:#EAF6F2; color:var(--teal-d); margin:0 auto 10px; }
        .lp-root .icon-strip .it b{ display:block; font-size:12.5px; font-weight:700; }

        .lp-root section{ padding:100px 0; }
        .lp-root .sec-head{ text-align:center; max-width:600px; margin:0 auto 50px; }
        .lp-root .sec-head h2{ font-size:34px; margin-top:10px; }

        .lp-root .split{ display:grid; grid-template-columns:1.15fr .85fr; gap:20px; align-items:stretch; }
        .lp-root .panel{ border-radius:26px; padding:44px; }
        .lp-root .panel-dark{ background:linear-gradient(135deg,var(--navy-2),var(--navy)); display:flex; align-items:center; gap:14px; flex-wrap:wrap; overflow:visible; }
        .lp-root .panel-dark .txt{ flex:1; min-width:220px; }
        .lp-root .panel-dark h3{ color:#fff; font-size:25px; }
        .lp-root .panel-dark p{ color:rgba(255,255,255,.68); font-size:14px; margin-top:10px; line-height:1.6; }
        .lp-root .panel-dark .tilt-wrap{ flex:0 0 auto; width:190px; display:flex; justify-content:center; perspective:1400px; }
        .lp-root .panel-dark .tilt-wrap .phone{ transform:rotateY(-20deg) rotateX(4deg) scale(.82); transform-style:preserve-3d; box-shadow:34px 40px 60px -20px rgba(0,0,0,.55); }
        .lp-root .held-photo{ display:block; object-fit:cover; border-radius:24px; box-shadow:0 26px 54px -22px rgba(0,0,0,.5); }
        .lp-root .panel-dark .held-photo{ width:190px; height:380px; transform:rotate(2deg); object-position:center 48%; }
        .lp-root .check-list{ margin-top:20px; display:flex; flex-direction:column; gap:11px; }
        .lp-root .check-list .c{ display:flex; align-items:center; gap:10px; color:rgba(255,255,255,.9); font-size:13.5px; font-weight:600; }
        .lp-root .check-list svg{ width:18px; height:18px; color:var(--teal); flex:0 0 auto; }
        .lp-root .panel-light{ background:var(--card); border:1px solid var(--line); }
        .lp-root .panel-light h3{ font-size:22px; }
        .lp-root .panel-light > p{ color:var(--muted); font-size:14px; margin-top:8px; }
        .lp-root .mini-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:22px; }
        .lp-root .mini{ background:var(--paper); border:1px solid var(--line); border-radius:15px; padding:15px; }
        .lp-root .mini svg{ width:19px; height:19px; color:var(--teal-d); margin-bottom:8px; }
        .lp-root .mini b{ display:block; font-size:12.5px; }
        .lp-root .mini span{ font-size:10.5px; color:var(--muted); }

        .lp-root .screens-row{ display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
        .lp-root .screen-card{ background:var(--card); border:1px solid var(--line); border-radius:18px; overflow:hidden; transition:transform .25s ease, box-shadow .25s ease; }
        .lp-root .screen-card:hover{ transform:translateY(-4px); box-shadow:0 20px 40px -18px rgba(6,40,36,.18); }
        .lp-root .screen-card .top{ height:64px; background:linear-gradient(135deg,#EAF6F2,#DDF3EE); display:flex; align-items:center; justify-content:center; }
        .lp-root .screen-card .top svg{ width:24px; height:24px; color:var(--teal-d); }
        .lp-root .screen-card .bot{ padding:13px 14px 16px; }
        .lp-root .screen-card b{ display:block; font-size:12.5px; }
        .lp-root .screen-card span{ font-size:10.5px; color:var(--muted); line-height:1.4; display:block; margin-top:3px; }

        .lp-root .tag-strip{ background:linear-gradient(135deg,var(--navy-2),var(--navy)); border-radius:28px; padding:50px 40px; text-align:center; }
        .lp-root .tag-strip h3{ color:#fff; font-size:22px; margin-bottom:26px; }
        .lp-root .tags{ display:flex; flex-wrap:wrap; gap:12px; justify-content:center; }
        .lp-root .tag{ background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18); color:#fff; font-size:13.5px; font-weight:700; padding:11px 20px; border-radius:100px; }

        .lp-root .stats{ display:grid; grid-template-columns:repeat(5,1fr); gap:0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); padding:36px 0; }
        .lp-root .stat{ text-align:center; border-right:1px solid var(--line); }
        .lp-root .stat:last-child{ border-right:none; }
        .lp-root .stat b{ font-size:26px; font-weight:800; color:var(--teal-d); display:block; }
        .lp-root .stat span{ font-size:12px; color:var(--muted); margin-top:4px; display:block; }

        .lp-root .pain-grid{ display:grid; grid-template-columns:.9fr 1.1fr; gap:18px; align-items:stretch; }
        .lp-root .pain-card{ border-radius:28px; padding:42px; border:1px solid var(--line); }
        .lp-root .pain-card.before{ background:#F1EFE8; }
        .lp-root .pain-card.after{ background:linear-gradient(140deg,#062824,#0B423A); color:#fff; position:relative; overflow:hidden; }
        .lp-root .pain-card.after::after{ content:'✈'; position:absolute; right:-18px; bottom:-40px; font-size:180px; opacity:.045; transform:rotate(-15deg); }
        .lp-root .pain-card h3{ font-size:24px; margin:8px 0 22px; }
        .lp-root .pain-list{ display:flex; flex-direction:column; gap:14px; }
        .lp-root .pain-item{ display:flex; gap:11px; align-items:flex-start; font-size:14px; line-height:1.5; color:var(--muted); }
        .lp-root .after .pain-item{ color:rgba(255,255,255,.82); }
        .lp-root .pain-item b{ width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex:0 0 auto; background:rgba(15,27,25,.08); color:var(--muted); font-size:12px; }
        .lp-root .after .pain-item b{ background:rgba(0,199,177,.16); color:#72E9DA; }

        .lp-root .steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .lp-root .step{ background:#fff; border:1px solid var(--line); border-radius:24px; padding:30px; position:relative; overflow:hidden; }
        .lp-root .step .num{ font-size:12px; font-weight:800; color:var(--teal-d); background:#EAF6F2; width:38px; height:38px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:34px; }
        .lp-root .step h3{ font-size:19px; }
        .lp-root .step p{ color:var(--muted); font-size:13.5px; line-height:1.6; margin-top:8px; }
        .lp-root .step::after{ content:''; position:absolute; width:90px; height:90px; border-radius:50%; border:18px solid rgba(0,199,177,.055); right:-34px; top:-34px; }

        .lp-root .faq{ max-width:820px; margin:0 auto; display:flex; flex-direction:column; gap:10px; }
        .lp-root .faq details{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:0 20px; }
        .lp-root .faq summary{ list-style:none; cursor:pointer; min-height:64px; display:flex; align-items:center; justify-content:space-between; gap:18px; font-size:14.5px; font-weight:800; }
        .lp-root .faq summary::-webkit-details-marker{ display:none; }
        .lp-root .faq summary::after{ content:'+'; color:var(--teal-d); font-size:22px; font-weight:500; }
        .lp-root .faq details[open] summary::after{ content:'−'; }
        .lp-root .faq p{ color:var(--muted); font-size:13.5px; line-height:1.65; padding:0 30px 18px 0; }
        .lp-root .mobile-cta{ display:none; }
        .lp-root .lp-reveal{ opacity:0; transform:translateY(24px); transition:opacity .7s ease,transform .7s cubic-bezier(.22,.61,.36,1); }
        .lp-root .lp-reveal.shown{ opacity:1; transform:none; }

        .lp-root .journey-showcase{ display:grid; grid-template-columns:1.35fr .65fr; grid-template-rows:300px 300px; gap:18px; }
        .lp-root .journey-card{ position:relative; border-radius:30px; overflow:hidden; isolation:isolate; color:#fff; box-shadow:0 28px 60px -34px rgba(6,30,26,.42); }
        .lp-root .journey-card img{ width:100%; height:100%; object-fit:cover; transition:transform .8s cubic-bezier(.22,.61,.36,1),filter .5s ease; }
        .lp-root .journey-card::after{ content:''; position:absolute; inset:0; background:linear-gradient(180deg,transparent 25%,rgba(4,20,17,.82)); z-index:1; pointer-events:none; }
        .lp-root .journey-card:hover img{ transform:scale(1.045); filter:saturate(1.08); }
        .lp-root .journey-card.desert{ grid-row:1 / 3; }
        .lp-root .journey-card.friends{ grid-column:2; }
        .lp-root .journey-copy{ position:absolute; z-index:2; left:30px; right:30px; bottom:28px; }
        .lp-root .journey-copy .over{ font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#88F4E5; margin-bottom:7px; }
        .lp-root .journey-copy h3{ font-size:27px; max-width:440px; }
        .lp-root .journey-copy p{ color:rgba(255,255,255,.78); font-size:13.5px; line-height:1.55; margin-top:8px; max-width:450px; }
        .lp-root .journey-tags{ display:flex; gap:8px; flex-wrap:wrap; margin-top:15px; }
        .lp-root .journey-tags span{ font-size:11px; font-weight:700; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.18); backdrop-filter:blur(8px); }
        .lp-root .journey-action{ grid-column:2; background:linear-gradient(145deg,#E2FAF5,#F8F7F1); color:var(--ink); padding:30px; display:flex; flex-direction:column; justify-content:space-between; }
        .lp-root .journey-action::after{ display:none; }
        .lp-root .journey-action .route{ display:flex; align-items:center; gap:8px; color:var(--teal-d); font-size:12px; font-weight:800; }
        .lp-root .journey-action .route i{ flex:1; height:2px; background:repeating-linear-gradient(90deg,var(--teal) 0 6px,transparent 6px 11px); animation:lpRoute 1.6s linear infinite; background-size:22px 2px; }
        .lp-root .journey-action h3{ font-size:23px; margin:16px 0 8px; }
        .lp-root .journey-action p{ color:var(--muted); font-size:13.5px; line-height:1.55; }
        .lp-root .journey-action button{ align-self:flex-start; border:none; background:var(--navy); color:#fff; border-radius:999px; min-height:44px; padding:0 18px; font-weight:800; margin-top:18px; }
        @keyframes lpRoute{ to{ background-position:22px 0; } }

        .lp-root .cta-final{ background:linear-gradient(120deg,var(--navy-2),var(--navy) 60%,#0a3730); border-radius:32px; padding:20px 60px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:space-between; gap:30px; flex-wrap:wrap; }
        .lp-root .cta-final::before{ content:''; position:absolute; width:420px; height:420px; border-radius:50%; background:radial-gradient(circle, rgba(0,199,177,.25), transparent 70%); top:-160px; right:0; }
        .lp-root .cta-final .txt{ position:relative; max-width:440px; padding:40px 0; }
        .lp-root .cta-final h2{ color:#fff; font-size:32px; }
        .lp-root .cta-final p{ color:rgba(255,255,255,.7); margin-top:12px; font-size:14.5px; }
        .lp-root .cta-final .hero-ctas{ margin-top:26px; }
        .lp-root .cta-final .phone{ margin-top:-40px; transform:scale(.85); }
        .lp-root .cta-final .held-photo{ width:300px; height:390px; margin:-56px 0 -56px; object-position:center 45%; transform:rotate(2deg); position:relative; }

        .lp-root footer{ padding:48px 0 34px; text-align:center; }
        .lp-root footer .logo{ justify-content:center; }
        .lp-root footer p{ color:var(--muted); font-size:12.5px; margin-top:10px; }

        @media (max-width:980px){
          .lp-root .hero-grid{ grid-template-columns:1fr; }
          .lp-root .hero{ padding:40px 0 60px; text-align:center; }
          .lp-root .hero h1{ font-size:36px; margin:0 auto; }
          .lp-root .hero p.lead{ margin:18px auto 0; }
          .lp-root .hero-ctas{ justify-content:center; }
          .lp-root .hero-visual{ margin-top:40px; }
          .lp-root .travel-stage{ min-height:540px; }
          .lp-root .icon-strip{ grid-template-columns:repeat(4,1fr); }
          .lp-root .split{ grid-template-columns:1fr; }
          .lp-root .mini-grid{ grid-template-columns:1fr 1fr; }
          .lp-root .screens-row{ grid-template-columns:repeat(2,1fr); }
          .lp-root .stats{ grid-template-columns:repeat(2,1fr); gap:22px 0; }
          .lp-root .pain-grid,.lp-root .steps{ grid-template-columns:1fr; }
          .lp-root .journey-showcase{ grid-template-columns:1fr; grid-template-rows:520px 360px auto; }
          .lp-root .journey-card.desert,.lp-root .journey-card.friends,.lp-root .journey-action{ grid-column:1; grid-row:auto; }
          .lp-root .stat{ border-right:none; border-bottom:1px solid var(--line); padding-bottom:16px; }
          .lp-root .cta-final{ flex-direction:column; text-align:center; padding:40px 26px; }
          .lp-root .cta-final .txt{ padding:0; max-width:100%; }
          .lp-root .cta-final .phone{ display:none; }
          .lp-root .cta-final .held-photo{ display:none; }
          .lp-root .nav-links a.link{ display:none; }
          .lp-root section{ padding:64px 0; }
          .lp-root .sec-head h2{ font-size:26px; }
          .lp-root .wrap{ padding:0 20px; }
        }
        @media (max-width:600px){
          .lp-root nav .wrap{ padding:0 12px; }
          .lp-root .logo{ gap:7px; }
          .lp-root .logo-tail{ display:none; }
          .lp-root .hero{ padding-top:24px; }
          .lp-root .hero h1{ font-size:34px; }
          .lp-root .hero p.lead{ font-size:15px; }
          .lp-root .travel-stage{ min-height:500px; border-radius:28px; }
          .lp-root .float-note.one{ top:24px; left:12px; }
          .lp-root .float-note.two{ right:10px; bottom:18px; }
          .lp-root .trust-line{ justify-content:center; }
          .lp-root .pain-card{ padding:30px 24px; }
          .lp-root .journey-showcase{ grid-template-rows:470px 330px auto; }
          .lp-root .journey-copy{ left:22px; right:22px; bottom:22px; }
          .lp-root .journey-copy h3{ font-size:23px; }
          .lp-root .mobile-cta{ position:fixed; display:flex; left:12px; right:12px; bottom:calc(10px + env(safe-area-inset-bottom)); z-index:120; background:rgba(6,40,36,.94); backdrop-filter:blur(16px); color:#fff; border-radius:18px; padding:8px 8px 8px 16px; align-items:center; justify-content:space-between; box-shadow:0 18px 50px rgba(6,30,26,.35); }
          .lp-root .mobile-cta span{ font-size:12px; font-weight:700; }
          .lp-root .mobile-cta button{ border:none; background:var(--teal); color:#fff; font-weight:800; border-radius:13px; min-height:42px; padding:0 16px; }
          .lp-root footer{ padding-bottom:96px; }
        }
      `}</style>

      <nav id="lp-nav">
        <div className="wrap row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="logo"><span className="mark"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 10l7 3 3 7 8-17Z" /></svg></span><span className="logo-name">Encorpei <span className="logo-tail" style={{ fontWeight: 500, opacity: .7 }}>na Trip</span></span></div>
          <div className="nav-links">
            <a className="link" href="#funcionalidades">Funcionalidades</a>
            <a className="link" href="#como-funciona">Como funciona</a>
            <a className="link" href="#duvidas">Dúvidas</a>
            <button className="btn btn-outline" onClick={onEntrar}>Entrar</button>
            <button className="btn btn-primary" onClick={onComecar}>Criar conta</button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="badge-pill"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>Sua viagem inteira, no mesmo lugar</div>
            <h1>Menos tempo organizando. <span>Mais viagem acontecendo.</span></h1>
            <p className="lead">Do primeiro plano ao último acerto de contas: roteiro, gastos, documentos, checklist e pessoas viajando juntas em um único app.</p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={onComecar}>Começar minha viagem <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
              <a href="#funcionalidades" className="btn btn-outline">Ver funcionalidades</a>
            </div>
            <div className="trust-line"><span><i /> Real e dólar</span><span><i /> Grupo sincronizado</span><span><i /> Acerto automático</span></div>
          </div>
          <div className="hero-visual">
            <div className="travel-stage">
              <div className="float-note one"><span>PRÓXIMO PASSEIO</span>Magic Kingdom · 9h</div>
              <div className="float-note two"><span>CONTAS DO GRUPO</span>Tudo certo ✓</div>
            </div>
          </div>
        </div>
      </header>

      <section id="funcionalidades" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="icon-strip">
            {FEATURES.map(([label, icon], i) => (
              <div className="it" key={i}>
                <span className="icon-box"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></span>
                <b>{label}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-reveal" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Viajar já dá trabalho demais</div>
            <h2>A organização não precisa dar</h2>
          </div>
          <div className="pain-grid">
            <div className="pain-card before">
              <div className="eyebrow" style={{ color: '#7C6C58' }}>Sem o app</div>
              <h3>Cada informação em um lugar</h3>
              <div className="pain-list">
                <div className="pain-item"><b>×</b><span>Roteiro perdido entre mensagens e prints</span></div>
                <div className="pain-item"><b>×</b><span>Planilha que ninguém atualiza durante a viagem</span></div>
                <div className="pain-item"><b>×</b><span>Contas confusas quando várias pessoas pagam</span></div>
              </div>
            </div>
            <div className="pain-card after">
              <div className="eyebrow" style={{ color: '#72E9DA' }}>Com Encorpei na Trip</div>
              <h3>Todo mundo viaja com a mesma informação</h3>
              <div className="pain-list">
                <div className="pain-item"><b>✓</b><span>Roteiro do dia, horários, lugares e mapa sempre à mão</span></div>
                <div className="pain-item"><b>✓</b><span>Orçamento e gastos atualizados em real e dólar</span></div>
                <div className="pain-item"><b>✓</b><span>Saldo líquido mostra quem deve para quem, sem confusão</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-reveal" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Toda viagem tem seu ritmo</div>
            <h2>Da estrada aberta aos melhores amigos</h2>
          </div>
          <div className="journey-showcase">
            <article className="journey-card desert">
              <img src="/landing-desert-motorhome.jpg" alt="Motorhome viajando por uma estrada entre formações rochosas no deserto" />
              <div className="journey-copy">
                <div className="over">Motorhome · Road trip</div>
                <h3>A liberdade da estrada com tudo planejado</h3>
                <p>Paradas, quilometragem, gastos, reservas e o diário da viagem reunidos para você aproveitar o caminho.</p>
                <div className="journey-tags"><span>Rota completa</span><span>Custo por km</span><span>Diário de bordo</span></div>
              </div>
            </article>
            <article className="journey-card friends">
              <img src="/landing-friends-trip.jpg" alt="Grupo de amigos reunido durante uma viagem de carro" />
              <div className="journey-copy">
                <div className="over">Amigos · Em grupo</div>
                <h3>Memórias compartilhadas. Contas resolvidas.</h3>
              </div>
            </article>
            <article className="journey-card journey-action">
              <div>
                <div className="route"><span>PARTIDA</span><i /><span>DESTINO</span></div>
                <h3>Uma central para qualquer aventura</h3>
                <p>Escolha o destino. Convide quem vai junto. O app cuida da organização.</p>
              </div>
              <button onClick={onComecar}>Planejar minha viagem →</button>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-reveal" style={{ paddingTop: 0 }}>
        <div className="wrap split">
          <div className="panel panel-dark">
            <div className="txt">
              <h3>Controle financeiro completo</h3>
              <p>Tenha o orçamento da viagem inteira na mão, gaste com tranquilidade.</p>
              <div className="check-list">
                {CHECKLIST_FINANCEIRO.map((t, i) => (
                  <div className="c" key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg>{t}</div>
                ))}
              </div>
            </div>
            <div className="tilt-wrap">
              <img className="held-photo" src="/landing-phone-roadtrip.jpg" alt="Viajante usando o aplicativo durante uma viagem de motorhome" />
            </div>
          </div>
          <div className="panel panel-light">
            <h3>Planejamento inteligente</h3>
            <p>Tudo que vocês precisam pra uma viagem organizada, sem imprevisto.</p>
            <div className="mini-grid">
              {PLANEJAMENTO.map(([t, d, icon], i) => (
                <div className="mini" key={i}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                  <b>{t}</b><span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="lp-reveal">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Simples desde o começo</div>
            <h2>Três passos até a viagem organizada</h2>
          </div>
          <div className="steps">
            {STEPS.map(([n, t, d]) => (
              <div className="step" key={n}><div className="num">{n}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-reveal">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Tudo que você precisa</div>
            <h2>Em um só lugar</h2>
          </div>
          <div className="screens-row">
            {SCREENS.map(([t, d, icon], i) => (
              <div className="screen-card" key={i}>
                <div className="top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></div>
                <div className="bot"><b>{t}</b><span>{d}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-reveal" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="tag-strip">
            <h3>Ideal para a viagem que você está planejando</h3>
            <div className="tags">
              {TAGS.map((t, i) => <span className="tag" key={i}>{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="stats">
            {STATS.map(([n, l], i) => (
              <div className="stat" key={i}><b>{n}</b><span>{l}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-reveal">
        <div className="wrap">
          <div className="cta-final">
            <div className="txt">
              <div className="eyebrow" style={{ color: '#8FF3E4' }}>Bora começar?</div>
              <h2>Sua próxima viagem começa aqui</h2>
              <p>Crie a viagem, convide a família, e organizem tudo juntos — em menos de um minuto.</p>
              <div className="hero-ctas">
                <button className="btn btn-primary" onClick={onComecar}>Criar minha conta</button>
                <button className="btn btn-outline on-dark" onClick={onEntrar}>Já tenho conta · Entrar</button>
              </div>
            </div>
            <img className="held-photo" src="/landing-phone-airport.jpg" alt="Viajante segurando o aplicativo no aeroporto" />
          </div>
        </div>
      </section>

      <section id="duvidas" className="lp-reveal" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Perguntas frequentes</div>
            <h2>Antes de fazer as malas</h2>
          </div>
          <div className="faq">
            {FAQS.map(([pergunta, resposta]) => (
              <details key={pergunta}><summary>{pergunta}</summary><p>{resposta}</p></details>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="logo"><span className="mark"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 10l7 3 3 7 8-17Z" /></svg></span>Encorpei na Trip</div>
          <p>Feito por quem viaja, pra quem viaja em família.</p>
        </div>
      </footer>
      <div className="mobile-cta"><span>Sua viagem em um só app</span><button onClick={onComecar}>Começar agora</button></div>
    </div>
  );
}

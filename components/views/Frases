'use client';
import { useState } from 'react';

// Conteúdo estático (offline, sem IA, sem dado de usuário).
const FRASES = [
  { id: 'geral', label: 'Básico', emoji: '👋', itens: [
    { en: 'Hi, how are you?', pt: 'Oi, tudo bem?', fon: 'rái, ráu ár iú' },
    { en: 'Thank you very much.', pt: 'Muito obrigado.', fon: 'tênk iú vêri mâtch' },
    { en: 'Excuse me.', pt: 'Com licença.', fon: 'ikskiúz mi' },
    { en: 'Do you speak Portuguese?', pt: 'Você fala português?', fon: 'dú iú spík pórtchuguíz' },
    { en: "I don't understand.", pt: 'Não entendi.', fon: 'ái dônt ânderstând' },
    { en: 'Can you help me?', pt: 'Você pode me ajudar?', fon: 'kén iú rélp mi' },
    { en: 'How much is it?', pt: 'Quanto custa?', fon: 'ráu mâtch íz it' },
    { en: "Where's the restroom?", pt: 'Onde fica o banheiro?', fon: 'uér z de réstrum' },
  ] },
  { id: 'restaurante', label: 'Restaurante', emoji: '🍽️', itens: [
    { en: 'A table for four, please.', pt: 'Uma mesa para quatro, por favor.', fon: 'a téibol for fór, plíz' },
    { en: 'Can I see the menu?', pt: 'Posso ver o cardápio?', fon: 'kén ái si de ményu' },
    { en: 'What do you recommend?', pt: 'O que você recomenda?', fon: 'uót du iú rekoménd' },
    { en: "I'll have this one.", pt: 'Vou querer este.', fon: 'áil rév dis uân' },
    { en: 'Can I get a beer/water?', pt: 'Pode trazer uma cerveja/água?', fon: 'kén ái guét a bír / uóter' },
    { en: 'The check, please.', pt: 'A conta, por favor.', fon: 'de tchék, plíz' },
    { en: 'Is the tip included?', pt: 'A gorjeta está incluída?', fon: 'íz de tip inklúdid' },
    { en: 'To go, please.', pt: 'Para viagem, por favor.', fon: 'tu gôu, plíz' },
  ] },
  { id: 'compras', label: 'Compras', emoji: '🛍️', itens: [
    { en: 'How much is this?', pt: 'Quanto custa isto?', fon: 'ráu mâtch íz dis' },
    { en: 'Do you have this in medium?', pt: 'Tem isto em tamanho médio?', fon: 'du iú rév dis in mídiam' },
    { en: 'Can I try it on?', pt: 'Posso experimentar?', fon: 'kén ái trái it ón' },
    { en: 'Do you take credit card?', pt: 'Aceita cartão de crédito?', fon: 'du iú téik krédit kard' },
    { en: "Where's the fitting room?", pt: 'Onde é o provador?', fon: 'uér z de fíting rum' },
    { en: "I'm just looking, thanks.", pt: 'Só estou olhando, obrigado.', fon: 'áim djâst lúking, tênks' },
  ] },
  { id: 'turismo', label: 'Turismo', emoji: '🗽', itens: [
    { en: 'Where is the entrance?', pt: 'Onde é a entrada?', fon: 'uér íz de éntrans' },
    { en: 'How much is a ticket?', pt: 'Quanto custa o ingresso?', fon: 'ráu mâtch íz a tíket' },
    { en: 'What time does it open/close?', pt: 'Que horas abre/fecha?', fon: 'uót táim dâz it ôupen / klôuz' },
    { en: 'Can I take photos here?', pt: 'Posso tirar fotos aqui?', fon: 'kén ái téik fôutous rír' },
    { en: 'Is there a guided tour?', pt: 'Tem um tour guiado?', fon: 'íz dér a gáided tur' },
    { en: 'How do I get to...?', pt: 'Como eu chego em...?', fon: 'ráu du ái guét tu' },
  ] },
  { id: 'transporte', label: 'Transporte', emoji: '🚗', itens: [
    { en: 'Fill it up, please.', pt: 'Completa o tanque, por favor.', fon: 'fíl it âp, plíz' },
    { en: "Where's the nearest gas station?", pt: 'Onde fica o posto mais próximo?', fon: 'uér z de níarest gés stêixon' },
    { en: 'Is there parking here?', pt: 'Tem estacionamento aqui?', fon: 'íz dér párking rír' },
    { en: 'How do I get to the highway?', pt: 'Como chego na rodovia?', fon: 'ráu du ái guét tu de ráiuei' },
    { en: 'Where can I return the car?', pt: 'Onde eu devolvo o carro?', fon: 'uér kén ái ritârn de kar' },
  ] },
  { id: 'hospedagem', label: 'Hospedagem', emoji: '🏨', itens: [
    { en: 'I have a reservation.', pt: 'Tenho uma reserva.', fon: 'ái rév a rezervêixon' },
    { en: 'What time is check-out?', pt: 'Que horas é o check-out?', fon: 'uót táim íz tchék-áut' },
    { en: 'Is breakfast included?', pt: 'O café da manhã está incluído?', fon: 'íz brékfâst inklúdid' },
    { en: 'Can I get more towels?', pt: 'Pode trazer mais toalhas?', fon: 'kén ái guét mór táuels' },
    { en: "What's the wifi password?", pt: 'Qual é a senha do wi-fi?', fon: 'uóts de uáifai pássuord' },
  ] },
  { id: 'parque', label: 'Parque', emoji: '🌳', itens: [
    { en: "Where's the entrance?", pt: 'Onde é a entrada?', fon: 'uér z de éntrans' },
    { en: 'Do you have a map?', pt: 'Vocês têm um mapa?', fon: 'du iú rév a mép' },
    { en: 'Where are the restrooms?', pt: 'Onde ficam os banheiros?', fon: 'uér ár de réstrums' },
    { en: 'How long is the trail?', pt: 'Qual a distância da trilha?', fon: 'ráu lóng íz de trêil' },
    { en: 'Is it kid-friendly?', pt: 'É bom para crianças?', fon: 'íz it kíd fréndli' },
  ] },
  { id: 'diversao', label: 'Diversão', emoji: '🎢', itens: [
    { en: 'How long is the wait?', pt: 'Quanto tempo de espera?', fon: 'ráu lóng íz de uêit' },
    { en: 'Where do we buy tickets?', pt: 'Onde compramos os ingressos?', fon: 'uér du ui bái tíkets' },
    { en: 'Is this ride ok for kids?', pt: 'Esse brinquedo é ok para crianças?', fon: 'íz dis ráid ôukêi for kids' },
    { en: "Where's the exit?", pt: 'Onde é a saída?', fon: 'uér z de éksit' },
  ] },
  { id: 'emergencia', label: 'Emergência', emoji: '🆘', itens: [
    { en: 'I need help.', pt: 'Preciso de ajuda.', fon: 'ái níd rélp' },
    { en: 'Please call a doctor.', pt: 'Por favor, chame um médico.', fon: 'plíz kól a dóktor' },
    { en: "Where's the nearest pharmacy?", pt: 'Onde fica a farmácia mais próxima?', fon: 'uér z de níarest fármaci' },
    { en: 'I lost my passport.', pt: 'Perdi meu passaporte.', fon: 'ái lóst mái pássport' },
    { en: 'Call the police.', pt: 'Chame a polícia.', fon: 'kól de polís' },
    { en: "I don't feel well.", pt: 'Não estou me sentindo bem.', fon: 'ái dônt fíl uél' },
  ] },
];

function falar(txt) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) { /* sem voz nesse aparelho */ }
}

export default function Frases({ ir, categoriaInicial }) {
  const inicial = FRASES.find((f) => f.id === categoriaInicial) ? categoriaInicial : 'geral';
  const [cat, setCat] = useState(inicial);
  const atual = FRASES.find((f) => f.id === cat) || FRASES[0];
  const card = { background: 'var(--ui-card)', borderRadius: 16, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('menu')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Conversar em inglês</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Frases prontas por situação · toque 🔊 pra ouvir</div>
        </div>
      </div>

      {/* categorias */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
        {FRASES.map((f) => {
          const on = cat === f.id;
          return (
            <button key={f.id} onClick={() => setCat(f.id)} style={{ flex: '0 0 auto', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: on ? 'var(--ui-teal)' : 'var(--ui-card)', color: on ? '#fff' : 'var(--ui-muted)', boxShadow: on ? 'none' : 'var(--ui-shadow)' }}>{f.emoji} {f.label}</button>
          );
        })}
      </div>

      {/* frases */}
      {atual.itens.map((fr, i) => (
        <div key={i} style={{ ...card, padding: 15, marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.2px' }}>{fr.en}</div>
            <div style={{ fontSize: 14, color: 'var(--ui-muted)', marginTop: 3 }}>{fr.pt}</div>
            <div style={{ fontSize: 12, color: 'var(--ui-faint)', marginTop: 4, fontStyle: 'italic' }}>{fr.fon}</div>
          </div>
          <button onClick={() => falar(fr.en)} aria-label="Ouvir" style={{ border: 'none', background: 'rgba(0,199,177,.14)', color: 'var(--ui-teal)', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>🔊</button>
        </div>
      ))}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useData } from '../DataProvider';
import { IDIOMAS, idioma, traduzir } from '../../lib/traduzir';
import { falar, carregarVozes, dicaInstalarVoz } from '../../lib/voz';
import Tradutor from './Tradutor';

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

const LS_IDIOMA = (viagemId) => `frases-idioma-${viagemId || 'geral'}`;
const lerLS = (k, padrao) => { try { return localStorage.getItem(k) || padrao; } catch (e) { return padrao; } };
const gravarLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export default function Frases({ ir, categoriaInicial }) {
  const { viagem, perguntasImigracao, adicionarPergunta, removerPergunta } = useData();
  const inicial = FRASES.find((f) => f.id === categoriaInicial) ? categoriaInicial : 'geral';
  const [aba, setAba] = useState(categoriaInicial === 'tradutor' ? 'tradutor' : 'frases'); // 'frases' | 'tradutor'
  const [cat, setCat] = useState(inicial);
  const [addForm, setAddForm] = useState(null); // { pergunta_pt, pergunta_en, resposta_pt, resposta_en }
  const atual = FRASES.find((f) => f.id === cat) || FRASES[0];

  // Idioma do destino: as frases prontas são em inglês; pra outro idioma, cada frase
  // é traduzida na hora (e guardada no aparelho). A fonética só existe em inglês.
  const [lang, setLangState] = useState(() => lerLS(LS_IDIOMA(viagem && viagem.id), 'en-US'));
  const setLang = (v) => { setLangState(v); gravarLS(LS_IDIOMA(viagem && viagem.id), v); };
  const emIngles = lang === 'en-US';
  const [trad, setTrad] = useState({}); // { [en]: texto no idioma escolhido }
  const [tradErro, setTradErro] = useState('');
  const [falando, setFalando] = useState(null); // texto que está sendo lido
  const [avisoVoz, setAvisoVoz] = useState('');
  const nomeIdioma = idioma(lang).nome;

  useEffect(() => {
    if (emIngles || aba !== 'frases') return;
    let cancel = false;
    (async () => {
      setTradErro('');
      for (const fr of atual.itens) {
        if (cancel) return;
        if (trad[lang + ':' + fr.en]) continue;
        try {
          const out = await traduzir(fr.en, 'en-US', lang);
          if (!cancel) setTrad((t) => ({ ...t, [lang + ':' + fr.en]: out }));
        } catch (e) { if (!cancel) setTradErro(e.message || 'Não deu pra traduzir agora.'); return; }
      }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, cat, aba]);

  const textoNoIdioma = (en) => (emIngles ? en : (trad[lang + ':' + en] || null));

  function ouvir(txt, langVoz) {
    const l = langVoz || idioma(lang).voz;
    const nome = langVoz ? 'inglês' : nomeIdioma.toLowerCase();
    setAvisoVoz('');
    falar(txt, l, (st) => {
      if (st === 'falando') setFalando(txt);
      else if (st === 'sem-voz' || st === 'erro') { setFalando(null); setAvisoVoz(dicaInstalarVoz(nome)); }
      else setFalando(null);
    });
  }
  const card = { background: 'var(--ui-card)', borderRadius: 16, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, background: 'var(--ui-bg)', color: 'var(--ui-ink)' };
  const naImigracao = cat === 'imigracao';

  function salvarPergunta() {
    if (!addForm || !addForm.pergunta_pt.trim()) { setAddForm(null); return; }
    adicionarPergunta(addForm);
    setAddForm(null);
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    carregarVozes();
    window.speechSynthesis.onvoiceschanged = carregarVozes;
    return () => { try { window.speechSynthesis.onvoiceschanged = null; } catch (e) {} };
  }, []);

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('menu')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Conversar em {nomeIdioma.toLowerCase()}</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>{aba === 'frases' ? 'Frases prontas por situação · toque 🔊 pra ouvir' : 'Digite ou fotografe — traduz na hora'}</div>
        </div>
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Idioma do destino" style={{ border: '1px solid var(--ui-line)', borderRadius: 12, padding: '8px 8px', fontSize: 13, fontWeight: 700, background: 'var(--ui-card)', color: 'var(--ui-ink)', flex: '0 0 auto' }}>
          {IDIOMAS.filter((i) => i.code !== 'pt-BR').map((i) => <option key={i.code} value={i.code}>{i.bandeira} {i.nome}</option>)}
        </select>
      </div>

      <div className="toggle" style={{ marginBottom: 14 }}>
        <button className={aba === 'frases' ? 'on' : ''} onClick={() => setAba('frases')}>💬 Frases prontas</button>
        <button className={aba === 'tradutor' ? 'on' : ''} onClick={() => setAba('tradutor')}>🔤 Tradutor</button>
      </div>

      {avisoVoz && <div style={{ fontSize: 12, color: '#B42318', margin: '0 4px 12px', lineHeight: 1.4 }}>🔇 {avisoVoz}</div>}

      {aba === 'tradutor' ? <Tradutor idiomaDestino={lang} /> : (<>

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
        {FRASES.map((f) => {
          const on = cat === f.id;
          return (
            <button key={f.id} onClick={() => setCat(f.id)} style={{ flex: '0 0 auto', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: on ? 'var(--ui-teal)' : 'var(--ui-card)', color: on ? '#fff' : 'var(--ui-muted)', boxShadow: on ? 'none' : 'var(--ui-shadow)' }}>{f.emoji} {f.label}</button>
          );
        })}
        <button onClick={() => setCat('imigracao')} style={{ flex: '0 0 auto', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: naImigracao ? 'var(--ui-teal)' : 'var(--ui-card)', color: naImigracao ? '#fff' : 'var(--ui-muted)', boxShadow: naImigracao ? 'none' : 'var(--ui-shadow)' }}>🛂 Migração</button>
      </div>

      {naImigracao && (
        <div style={{ fontSize: 12, color: 'var(--ui-faint)', margin: '0 4px 14px', lineHeight: 1.4 }}>
          🔒 Só a sua família vê essas respostas — ficam salvas no banco, não no código do app.
        </div>
      )}

      {naImigracao ? (
        <>
          {(perguntasImigracao || []).length === 0 && !addForm && (
            <div style={{ ...card, padding: 20, textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, marginBottom: 12 }}>
              Nenhuma pergunta adicionada ainda.
            </div>
          )}
          {(perguntasImigracao || []).map((p) => (
            <div key={p.id} style={{ ...card, padding: 15, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.pergunta_en}</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 2 }}>{p.pergunta_pt}</div>
                  {p.resposta_en && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--ui-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 10.5, color: 'var(--ui-faint)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700, marginBottom: 4 }}>Resposta</div>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.resposta_en}</div>
                      {p.resposta_pt && <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 3 }}>{p.resposta_pt}</div>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
                  {p.resposta_en && <button onClick={() => ouvir(p.resposta_en, 'en-US')} aria-label="Ouvir" style={{ border: 'none', background: falando === p.resposta_en ? 'var(--ui-teal)' : 'rgba(0,199,177,.14)', color: falando === p.resposta_en ? '#fff' : 'var(--ui-teal)', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>🔊</button>}
                  <button onClick={() => { if (window.confirm('Remover esta pergunta?')) removerPergunta(p.id); }} aria-label="Remover" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            </div>
          ))}
          {addForm ? (
            <div style={{ ...card, padding: 16, marginBottom: 20 }}>
              <input autoFocus value={addForm.pergunta_pt} onChange={(e) => setAddForm({ ...addForm, pergunta_pt: e.target.value })} placeholder="Pergunta em português" style={{ ...inp, marginBottom: 9 }} />
              <input value={addForm.pergunta_en} onChange={(e) => setAddForm({ ...addForm, pergunta_en: e.target.value })} placeholder="Pergunta em inglês" style={{ ...inp, marginBottom: 9 }} />
              <textarea value={addForm.resposta_pt} onChange={(e) => setAddForm({ ...addForm, resposta_pt: e.target.value })} placeholder="Sua resposta em português" style={{ ...inp, height: 60, resize: 'none', marginBottom: 9 }} />
              <textarea value={addForm.resposta_en} onChange={(e) => setAddForm({ ...addForm, resposta_en: e.target.value })} placeholder="Sua resposta em inglês" style={{ ...inp, height: 60, resize: 'none', marginBottom: 12 }} />
              <button onClick={salvarPergunta} style={{ width: '100%', border: 'none', borderRadius: 12, padding: 12, background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
              <button onClick={() => setAddForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, marginTop: 6, cursor: 'pointer' }}>fechar</button>
            </div>
          ) : (
            <button onClick={() => setAddForm({ pergunta_pt: '', pergunta_en: '', resposta_pt: '', resposta_en: '' })} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: 14, background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar pergunta</button>
          )}
        </>
      ) : (
        <>
          {tradErro && <div style={{ fontSize: 12, color: '#B42318', margin: '0 4px 10px' }}>{tradErro}</div>}
          {atual.itens.map((fr, i) => {
            const txt = textoNoIdioma(fr.en);
            const on = falando && txt && falando === txt;
            return (
              <div key={i} style={{ ...card, padding: 15, marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.2px', color: txt ? 'var(--ui-ink)' : 'var(--ui-faint)' }}>{txt || 'traduzindo…'}</div>
                  <div style={{ fontSize: 14, color: 'var(--ui-muted)', marginTop: 3 }}>{fr.pt}</div>
                  {emIngles && <div style={{ fontSize: 12, color: 'var(--ui-faint)', marginTop: 4, fontStyle: 'italic' }}>{fr.fon}</div>}
                </div>
                <button onClick={() => txt && ouvir(txt)} disabled={!txt} aria-label="Ouvir" style={{ border: 'none', background: on ? 'var(--ui-teal)' : 'rgba(0,199,177,.14)', color: on ? '#fff' : 'var(--ui-teal)', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer', flex: '0 0 auto', opacity: txt ? 1 : 0.5 }}>🔊</button>
              </div>
            );
          })}
        </>
      )}
      </>)}
    </div>
  );
}

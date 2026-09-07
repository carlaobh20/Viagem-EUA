'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../DataProvider';
import { fmtBRL, fmtUSD, usaDolar } from '../../lib/format';
import { Button, Field, PageHeader, EmptyState, Segmented, Reveal, SectionHeader, ProgressBar } from '../ui';
import { motion as motionTokens } from '../../lib/design-tokens';

// "Antes de embarcar" (🛫) só faz sentido pra quem vai de avião — viagem sem
// avião no transporte usa "Antes de sair" (🎒) no lugar, sem nada de avião.
const TEMAS = ['Documentos', 'Dinheiro', 'Saúde', 'Bagagem', 'Carro', 'Antes de embarcar', 'Antes de sair'];
const ICON_TEMA = { Documentos: '📄', Dinheiro: '💳', 'Saúde': '💊', Bagagem: '🧳', Carro: '🚗', 'Antes de embarcar': '🛫', 'Antes de sair': '🎒' };
const PRAZO_LABEL = { '30d': '30 dias', '7d': '7 dias', '1d': '1 dia' };
// Prazo é categoria, não estado: só o "1 dia" (mais urgente) ganha destaque teal,
// "7 dias" fica em atenção (dourado) e "30 dias" neutro.
const PRAZO_PILL = { '30d': 'ui-pill-neutral', '7d': 'ui-pill-warning', '1d': 'ui-pill-info' };

// Viagem sem avião marcado no transporte não deve ver nada de "embarcar"/avião.
// Viagem sem perfil de transporte definido ainda (todas as existentes até essa
// personalização existir) continua assumindo avião, igual sempre foi.
function deAviaoDaViagem(viagem) {
  const transporte = Array.isArray(viagem?.transporte) ? viagem.transporte : [];
  return transporte.length === 0 || transporte.includes('aviao');
}
function temaEmbarque(viagem) { return deAviaoDaViagem(viagem) ? 'Antes de embarcar' : 'Antes de sair'; }

// Quantidade de dias da viagem, a partir de data_ida/data_volta (perguntados
// no assistente de criação — ver NovaViagemWizard). null se ainda não souber.
function diasDaViagem(viagem) {
  if (!viagem || !viagem.data_ida || !viagem.data_volta) return null;
  const ini = new Date(viagem.data_ida + 'T00:00:00');
  const fim = new Date(viagem.data_volta + 'T00:00:00');
  const d = Math.round((fim - ini) / 86400000) + 1;
  return d > 0 ? d : null;
}

// Monta o checklist padrão de acordo com o perfil da viagem (nacional/internacional,
// meio de transporte e quantidade de dias — ver NovaViagemWizard). Viagem sem perfil
// definido ainda (tipo_viagem/transporte ausentes — todas as já existentes até essa
// personalização existir) cai no template completo de antes: nada some pra quem já
// usa o app, a redução só vale pra viagem nova que já respondeu o perfil.
function montarTemplate(viagem) {
  const nacional = viagem?.tipo_viagem === 'nacional';
  const transporte = Array.isArray(viagem?.transporte) ? viagem.transporte : [];
  const deCarro = transporte.includes('carro');
  const deAviao = deAviaoDaViagem(viagem);
  const tema = temaEmbarque(viagem);
  const dias = diasDaViagem(viagem);

  const t = [];
  if (!nacional) t.push(['Passaporte válido (6+ meses)', 'Documentos', '30d'], ['Visto / ESTA aprovado', 'Documentos', '30d'], ['CNH internacional (PID)', 'Documentos', '30d']);
  t.push(['Cópias dos documentos (papel e celular)', 'Documentos', '7d'], ['Reservas e ingressos salvos', 'Documentos', '7d']);

  if (!nacional) t.push(['Cartão internacional / dólar', 'Dinheiro', '30d'], ['Avisar o banco sobre a viagem', 'Dinheiro', '7d'], ['App de câmbio no celular', 'Dinheiro', '1d']);
  t.push(['Algum dinheiro em espécie', 'Dinheiro', '7d']);

  if (!nacional) t.push(['Vacinas em dia', 'Saúde', '30d']);
  t.push(['Remédios de uso contínuo', 'Saúde', '7d'], ['Kit de primeiros socorros', 'Saúde', '7d']);

  if (!nacional) t.push(['Adaptador de tomada', 'Bagagem', '7d'], ['Chip / eSIM internacional', 'Bagagem', '7d']);
  t.push(['Carregadores e power bank', 'Bagagem', '1d']);
  t.push([dias ? `Roupas pra ${dias} dia${dias === 1 ? '' : 's'}` : 'Roupas conforme o clima', 'Bagagem', '1d']);
  if (dias && dias >= 10) t.push(['Sabão / lavanderia pro meio da viagem', 'Bagagem', '7d']);

  // itens de carro valem pra qualquer viagem de carro, nacional ou não
  if (deCarro) {
    t.push(
      ['Pneus e estepe calibrados', 'Carro', '7d'],
      ['Revisão / óleo em dia', 'Carro', '7d'],
      ['Documentos do carro (CRLV)', 'Carro', '7d'],
      ['Seguro do carro em dia', 'Carro', '30d'],
      ['Kit de emergência (triângulo, macaco, cabo)', 'Carro', '7d'],
      ['Tanque cheio', 'Carro', '1d'],
    );
  }

  if (deAviao) t.push(['Check-in online feito', tema, '1d'], ['Bagagem dentro do peso', tema, '1d']);
  t.push(['Documentos na mão (não na mala)', tema, '1d'], ['Casa fechada (luz, água, gás)', tema, '1d']);

  return t;
}

// ===== Comprar (lista de compras pré-viagem — separada do Mercado do motorhome) =====
const COMPRAR_CATS = [
  ['bagagem', '🧳', 'Bagagem'],
  ['eletronicos', '🔌', 'Eletrônicos'],
  ['roupas', '👕', 'Roupas'],
  ['higiene', '🧴', 'Higiene'],
  ['viagem', '🗺️', 'Viagem'],
  ['outros', '📦', 'Outros'],
];
const COMPRAR_LABEL = Object.fromEntries(COMPRAR_CATS.map(([id, , l]) => [id, l]));
const COMPRAR_EMOJI = Object.fromEntries(COMPRAR_CATS.map(([id, e]) => [id, e]));
const COMPRAR_SUG = {
  bagagem: ['Mala', 'Mochila', 'Organizadores', 'Cadeado TSA', 'Etiqueta de mala', 'Necessaire'],
  eletronicos: ['Adaptador de tomada', 'Power bank', 'Carregador', 'eSIM / chip', 'Fones'],
  roupas: ['Casaco', 'Tênis confortável', 'Roupa de banho', 'Meias térmicas', 'Capa de chuva'],
  higiene: ['Protetor solar', 'Repelente', 'Remédios', 'Primeiros socorros', 'Escova de dente'],
  viagem: ['Seguro viagem', 'Dólar em espécie', 'Cartão internacional', 'Imprimir reservas'],
  outros: ['Travesseiro de pescoço', 'Garrafa de água', 'Snacks de viagem'],
};
// Sugestões de compra também seguem o perfil: viagem nacional não precisa de
// seguro viagem / dólar / cartão internacional (ver TEMPLATE/montarTemplate acima).
function sugestoesComprar(viagem) {
  if (viagem?.tipo_viagem !== 'nacional') return COMPRAR_SUG;
  return { ...COMPRAR_SUG, viagem: COMPRAR_SUG.viagem.filter((s) => s !== 'Seguro viagem' && s !== 'Dólar em espécie' && s !== 'Cartão internacional') };
}

// ===== Peças de lista (fora do componente da tela: se fossem definidas lá
// dentro, o React remontaria a cada render e o campo de valor perderia o foco) =====

// Bolinha de "feito": o desenho tem 24px, mas a área de toque é 44px.
// Pequeno "pop" ao marcar (initial={false} evita animar quando a lista só carrega).
function Marcar({ feito, onToggle }) {
  return (
    <button onClick={onToggle} aria-label={feito ? 'Desmarcar' : 'Marcar como feito'} aria-pressed={feito}
      style={{ width: 44, height: 44, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', cursor: 'pointer', padding: 0 }}>
      <motion.span initial={false} animate={feito ? { scale: [0.7, 1.18, 1] } : { scale: 1 }} transition={{ duration: 0.28, ease: motionTokens.easing }}
        style={{ width: 24, height: 24, borderRadius: '50%', border: feito ? 'none' : '2px solid var(--ui-line-strong)', background: feito ? 'var(--ui-teal)' : 'transparent', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {feito ? '✓' : ''}
      </motion.span>
    </button>
  );
}

// ✕ de apagar: desenho pequeno, alvo de 40px.
function Apagar({ onClick, label = 'Apagar' }) {
  return (
    <button onClick={onClick} aria-label={label} style={{ width: 40, height: 40, border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, padding: 0 }}>✕</button>
  );
}

const textoItem = (feito) => ({ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 500, lineHeight: 1.35, cursor: 'text', textDecoration: feito ? 'line-through' : 'none', color: feito ? 'var(--ui-faint)' : 'var(--ui-ink)' });

function LinhaTarefa({ it, onToggle, onEditar, onApagar }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', minHeight: 52 }}>
      <Marcar feito={!!it.feito} onToggle={onToggle} />
      <span onClick={onEditar} className="ui-wrap" style={textoItem(it.feito)}>{it.texto}</span>
      {it.prazo && <span className={`ui-pill ${PRAZO_PILL[it.prazo] || 'ui-pill-neutral'}`} style={{ flex: '0 0 auto' }}>{PRAZO_LABEL[it.prazo]}</span>}
      <Apagar onClick={onApagar} />
    </div>
  );
}

function LinhaCompra({ it, moeda, valorTexto, onToggle, onEditar, onApagar, onTrocarMoeda, onValor, onSalvarValor }) {
  const usd = moeda === 'USD';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', minHeight: 52 }}>
      <Marcar feito={!!it.feito} onToggle={onToggle} />
      <span onClick={onEditar} className="ui-wrap" style={textoItem(it.feito)}>{it.texto}</span>
      {/* moeda + valor: um controle só, rebaixado; tocar no R$/US$ troca a moeda do item */}
      <div className="ui-sunken" style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 6px 0 2px', flex: '0 0 auto', minHeight: 36 }}>
        <button onClick={onTrocarMoeda} title="Trocar R$ / US$" aria-label="Trocar moeda"
          style={{ border: 'none', background: usd ? 'var(--ui-teal-soft)' : 'transparent', borderRadius: 8, minHeight: 30, padding: '0 6px', fontSize: 11, color: usd ? 'var(--ui-teal-ink)' : 'var(--ui-muted)', fontWeight: 800, cursor: 'pointer' }}>{usd ? 'US$' : 'R$'}</button>
        <input
          inputMode="decimal"
          className="ui-num"
          value={valorTexto}
          onChange={onValor}
          onFocus={(e) => e.target.select()}
          onBlur={onSalvarValor}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          placeholder="0,00"
          aria-label={`Valor de ${it.texto}`}
          style={{ width: 58, border: 'none', outline: 'none', padding: '6px 0', fontSize: 13, fontWeight: 700, textAlign: 'right', background: 'transparent', color: 'var(--ui-ink)' }}
        />
      </div>
      <Apagar onClick={onApagar} />
    </div>
  );
}

// Botão tracejado de "+ Adicionar item" (superfície outlined do design system, inline com tokens)
function BotaoAdicionar({ onClick, children, style }) {
  return (
    <button onClick={onClick} className="ui-press" style={{ width: '100%', minHeight: 48, border: '1.5px dashed var(--ui-line-strong)', borderRadius: 16, background: 'transparent', color: 'var(--ui-teal-ink)', fontSize: 14, fontWeight: 700, cursor: 'pointer', ...style }}>{children}</button>
  );
}

// Cabeçalho de um grupo (tema ou categoria): emoji + nome + feitos/total (+ subtotal à direita)
function TituloGrupo({ emoji, nome, feitos, total, direita }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 8px', minWidth: 0 }}>
      <span style={{ fontSize: 16 }} aria-hidden="true">{emoji}</span>
      <span style={{ fontSize: 14.5, fontWeight: 700 }}>{nome}</span>
      <span className="ui-num" style={{ fontSize: 12, color: 'var(--ui-faint)' }}>{feitos}/{total}</span>
      {direita ? <span className="ui-num" style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, color: 'var(--ui-teal-ink)', whiteSpace: 'nowrap' }}>{direita}</span> : null}
    </div>
  );
}

export default function Checklist({ ir, abaInicial }) {
  const { viagem, perfil, checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist, semearChecklist, definirValorItem } = useData();
  const meu = perfil?.user_id;
  // Individual de verdade: só o que ESTA pessoa criou (o banco também bloqueia o
  // resto — ver supabase/migracao-checklist-individual.sql). Itens antigos sem dono
  // foram atribuídos ao criador da viagem na migração.
  const souDono = (i) => i.user_id === meu;
  // Viagem de carro (sem avião) não usa o tema "Antes de embarcar" (nem em
  // seção nem no seletor de novo item); viagem de avião não usa "Antes de sair".
  const temaAusente = deAviaoDaViagem(viagem) ? 'Antes de sair' : 'Antes de embarcar';
  const temasVisiveis = TEMAS.filter((t) => t !== temaAusente);
  const [filtro, setFiltro] = useState('todos');
  const [add, setAdd] = useState(null);
  const [aba, setAba] = useState(abaInicial === 'comprar' ? 'comprar' : 'tarefas'); // 'tarefas' | 'comprar'
  const [compForm, setCompForm] = useState(null); // { texto, cat }
  const [valorEdit, setValorEdit] = useState({}); // { [itemId]: texto sendo digitado no campo de valor }
  // Moeda padrão dos itens novos da lista de Compras (R$ ou US$) — guardada no aparelho
  const comDolar = usaDolar(viagem);
  const chaveMoeda = viagem ? `compras-moeda-${viagem.id}` : null;
  const [moedaPadrao, setMoedaPadraoState] = useState('BRL');
  useEffect(() => {
    if (!chaveMoeda || typeof window === 'undefined') return;
    const m = window.localStorage.getItem(chaveMoeda);
    if (m === 'USD' || m === 'BRL') setMoedaPadraoState(m);
  }, [chaveMoeda]);
  const setMoedaPadrao = (m) => { setMoedaPadraoState(m); try { window.localStorage.setItem(chaveMoeda, m); } catch (e) {} };
  const cambio = Number(viagem?.cotacao_usd) || 0;
  const moedaDe = (it) => (it.moeda === 'USD' ? 'USD' : 'BRL');
  // soma separada por moeda + estimativa em reais (se tiver câmbio)
  const somar = (lista) => lista.reduce((acc, i) => { if (i.valor != null) acc[moedaDe(i)] += Number(i.valor); return acc; }, { BRL: 0, USD: 0 });
  const fmtSoma = (t) => {
    const partes = [];
    if (t.BRL > 0) partes.push(fmtBRL(t.BRL));
    if (t.USD > 0) partes.push(fmtUSD(t.USD));
    return partes.join(' + ');
  };
  const emReais = (t) => t.BRL + (cambio > 0 ? t.USD * cambio : 0);

  // Escolha "sugestões prontas" x "montar do zero" — guardada no aparelho, por
  // viagem+pessoa, pra não perguntar de novo depois de decidido uma vez.
  // null = ainda não decidiu (ou ainda não terminou de checar o aparelho).
  const [decisao, setDecisaoState] = useState(null);
  const chaveDecisao = viagem && meu ? `checklist-decisao-${viagem.id}-${meu}` : null;
  useEffect(() => {
    if (!chaveDecisao || typeof window === 'undefined') return;
    setDecisaoState(window.localStorage.getItem(chaveDecisao) || null);
  }, [chaveDecisao]);

  const semeado = useRef(false);
  useEffect(() => {
    // Só semeia sozinho, sem perguntar, quando a pessoa já tinha escolhido "prontas"
    // antes (ex.: reabriu o app) — decisão "do zero" ou ainda pendente nunca semeia.
    if (semeado.current || !viagem || decisao !== 'pronto') return;
    const meusTemas = (checklist || []).filter((i) => TEMAS.includes(i.tema) && souDono(i));
    if (meusTemas.length === 0) {
      semeado.current = true;
      semearChecklist(montarTemplate(viagem).map(([texto, tema, prazo], i) => ({ texto, tema, prazo, ordem: i })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viagem?.id, meu, decisao]);

  function decidir(valor) {
    if (chaveDecisao && typeof window !== 'undefined') window.localStorage.setItem(chaveDecisao, valor);
    setDecisaoState(valor);
    if (valor === 'pronto') {
      semeado.current = true;
      semearChecklist(montarTemplate(viagem).map(([texto, tema, prazo], i) => ({ texto, tema, prazo, ordem: i })));
    }
  }

  const itens = (checklist || []).filter((i) => TEMAS.includes(i.tema) && souDono(i));
  const precisaDecidir = decisao == null && itens.length === 0;
  const visiveis = filtro === 'todos' ? itens : itens.filter((i) => i.prazo === filtro);
  const feitos = visiveis.filter((i) => i.feito).length;
  const total = visiveis.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const feitosGeral = itens.filter((i) => i.feito).length;

  // ----- Comprar -----
  const compras = (checklist || []).filter((i) => i.tema === 'Comprar' && souDono(i));
  const compFeitos = compras.filter((i) => i.feito).length;
  const compPct = compras.length > 0 ? Math.round((compFeitos / compras.length) * 100) : 0;
  function addCompra(texto, cat) {
    const t = (texto || '').trim();
    if (!t) return;
    if (compras.some((i) => (i.texto || '').toLowerCase() === t.toLowerCase())) return;
    adicionarChecklist({ texto: t, tema: 'Comprar', prazo: cat || 'outros', ordem: compras.length, moeda: moedaPadrao });
  }
  function salvarCompForm() {
    if (!compForm || !compForm.texto.trim()) { setCompForm(null); return; }
    addCompra(compForm.texto, compForm.cat);
    setCompForm({ texto: '', cat: compForm.cat });
  }
  function limparCompradas() {
    if (!window.confirm('Remover tudo que já foi comprado?')) return;
    compras.filter((i) => i.feito).forEach((i) => removerChecklist(i.id));
  }
  function parseBRL(s) {
    if (s == null) return null;
    let t = String(s).trim().replace(/[^\d.,]/g, '');
    if (!t) return null;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(t);
    return isNaN(n) ? null : n;
  }
  function salvarValorItem(id) {
    if (!(id in valorEdit)) return;
    definirValorItem(id, parseBRL(valorEdit[id]));
    setValorEdit((v) => { const n = { ...v }; delete n[id]; return n; });
  }
  // toque no "R$"/"US$" do item troca a moeda daquele item (o número fica igual)
  function alternarMoedaItem(it) { definirValorItem(it.id, it.valor, moedaDe(it) === 'USD' ? 'BRL' : 'USD'); }
  const totalGeral = somar(compras);
  const temTotal = totalGeral.BRL > 0 || totalGeral.USD > 0;

  function novoItem() {
    if (!add || !add.texto.trim()) { setAdd(null); return; }
    const ordem = itens.length;
    adicionarChecklist({ texto: add.texto.trim(), tema: add.tema, prazo: add.prazo || null, ordem });
    setAdd(null);
  }
  function editar(it) { const t = window.prompt('Editar item', it.texto); if (t && t.trim()) editarChecklist(it.id, t.trim()); }
  function apagarItem(it) { if (window.confirm('Apagar este item?')) removerChecklist(it.id); }

  // Subtítulo do cabeçalho: o que importa agora, em uma linha
  const subtitulo = aba === 'tarefas'
    ? (precisaDecidir || itens.length === 0 ? 'Pra não esquecer nada' : `${feitosGeral} de ${itens.length} feita${itens.length === 1 ? '' : 's'}`)
    : (compras.length === 0 ? 'O que comprar antes de viajar' : `${compFeitos} de ${compras.length} comprado${compras.length === 1 ? '' : 's'}${temTotal ? ` · ${fmtSoma(totalGeral)}` : ''}`);

  const sugestoes = sugestoesComprar(viagem);
  const naLista = new Set(compras.map((i) => (i.texto || '').toLowerCase()));

  return (
    <div className="ui-screen ui-theme">
      <PageHeader titulo="Checklist" subtitulo={subtitulo} onVoltar={() => ir('resumo')} />

      {/* abas Tarefas / Comprar */}
      <Segmented opcoes={[{ id: 'tarefas', label: 'Tarefas' }, { id: 'comprar', label: 'Comprar' }]} valor={aba} onChange={setAba} style={{ marginBottom: 16 }} />

      {/* ================= TAREFAS ================= */}
      {aba === 'tarefas' && precisaDecidir && (
        <EmptyState
          icone="📝"
          titulo="Como você quer montar seu checklist?"
          texto="Pode começar com sugestões prontas pro perfil dessa viagem (dá pra editar e apagar depois) ou montar do zero, item por item."
          cta="✨ Começar com sugestões prontas"
          onCta={() => decidir('pronto')}
          secundario={<Button variant="secondary" full onClick={() => decidir('zero')}>📋 Montar do zero, do meu jeito</Button>}
        />
      )}

      {aba === 'tarefas' && !precisaDecidir && (
        <Reveal>
          {itens.length === 0 ? (add ? null : (
            <EmptyState
              icone="✅"
              titulo="Seu checklist ainda está vazio."
              texto="Comece com as sugestões ou adicione o primeiro item."
              cta="+ Adicionar item"
              onCta={() => setAdd({ texto: '', tema: 'Documentos', prazo: '' })}
              secundario={<Button variant="ghost" onClick={() => decidir('pronto')}>✨ Usar sugestões prontas</Button>}
            />
          )) : (
            <>
              {/* o bloco de destaque: progresso */}
              <div className="ui-card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
                  {/* o cabeçalho já diz "X de Y feitas"; aqui entra o que falta */}
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>
                    {total > 0 && feitos === total ? 'Tudo pronto! 🎉' : `${total - feitos} por fazer`}
                    {filtro !== 'todos' ? <span className="ui-muted" style={{ fontWeight: 500 }}> · prazo de {PRAZO_LABEL[filtro]}</span> : null}
                  </span>
                  <span className="ui-num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--ui-teal-ink)' }}>{pct}%</span>
                </div>
                <ProgressBar pct={pct} />
              </div>

              {/* filtro por prazo */}
              <div className="ui-chips-scroll" style={{ marginBottom: 8 }}>
                {[['todos', 'Tudo'], ['30d', '30 dias'], ['7d', '7 dias'], ['1d', '1 dia']].map(([id, l]) => (
                  <button key={id} onClick={() => setFiltro(id)} className={`ui-chipbtn${filtro === id ? ' on' : ''}`} aria-pressed={filtro === id}>{l}</button>
                ))}
              </div>

              {/* seções por tema: lista simples dentro de um card por tema */}
              {temasVisiveis.map((tema) => {
                const lista = visiveis.filter((i) => i.tema === tema);
                if (lista.length === 0) return null;
                return (
                  <div key={tema} style={{ marginBottom: 18 }}>
                    <TituloGrupo emoji={ICON_TEMA[tema]} nome={tema} feitos={lista.filter((i) => i.feito).length} total={lista.length} />
                    <div className="ui-card ui-list" style={{ padding: '4px 8px' }}>
                      {lista.map((it) => (
                        <LinhaTarefa key={it.id} it={it} onToggle={() => alternarChecklist(it.id, !it.feito)} onEditar={() => editar(it)} onApagar={() => apagarItem(it)} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {total === 0 && <EmptyState compacto icone="🗓️" titulo="Nada nesse prazo." texto="Troque o filtro pra ver os outros itens." />}
            </>
          )}

          {/* adicionar: 1 toque abre o campo com foco; Enter salva */}
          {add ? (
            <Reveal>
              <div className="ui-card" style={{ padding: 16 }}>
                <Field label="Novo item">
                  <input className="ui-input" autoFocus value={add.texto} onChange={(e) => setAdd({ ...add, texto: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && novoItem()} placeholder="O que não pode esquecer?" />
                </Field>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Field label="Tema" style={{ flex: 1, minWidth: 0 }}>
                    <select className="ui-input" value={add.tema} onChange={(e) => setAdd({ ...add, tema: e.target.value })}>{temasVisiveis.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                  </Field>
                  <Field label="Prazo" style={{ width: 128, flex: '0 0 auto' }}>
                    <select className="ui-input" value={add.prazo} onChange={(e) => setAdd({ ...add, prazo: e.target.value })}><option value="">sem prazo</option><option value="30d">30 dias</option><option value="7d">7 dias</option><option value="1d">1 dia</option></select>
                  </Field>
                </div>
                <Button full onClick={novoItem} disabled={!add.texto.trim()}>Adicionar</Button>
                <Button variant="ghost" full onClick={() => setAdd(null)} style={{ marginTop: 6, color: 'var(--ui-muted)' }}>Cancelar</Button>
              </div>
            </Reveal>
          ) : itens.length > 0 ? (
            <BotaoAdicionar onClick={() => setAdd({ texto: '', tema: 'Documentos', prazo: '' })}>+ Adicionar item</BotaoAdicionar>
          ) : null}
        </Reveal>
      )}

      {/* ================= COMPRAR ================= */}
      {aba === 'comprar' && (
        <Reveal>
          {compras.length === 0 ? (
            <EmptyState
              icone="🛍️"
              titulo="Sua lista de compras ainda está vazia."
              texto="Toque numa sugestão abaixo ou adicione o primeiro item."
              cta="+ Adicionar item"
              onCta={() => setCompForm({ texto: '', cat: 'bagagem' })}
            />
          ) : (
            <div className="ui-card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{compFeitos === compras.length ? 'Tudo comprado! 🎉' : `${compras.length - compFeitos} por comprar`}</span>
                <span className="ui-num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--ui-teal-ink)' }}>{compPct}%</span>
              </div>
              <ProgressBar pct={compPct} />
              {temTotal && (
                <div className="ui-caption" style={{ marginTop: 10 }}>
                  Total da lista: <b className="ui-num" style={{ color: 'var(--ui-ink)' }}>{fmtSoma(totalGeral)}</b>
                  {totalGeral.USD > 0 && totalGeral.BRL > 0 && cambio > 0 && <span className="ui-num"> · ≈ {fmtBRL(emReais(totalGeral))}</span>}
                  {totalGeral.USD > 0 && cambio <= 0 && <span className="ui-faint"> · defina o câmbio no Resumo pra somar tudo em reais</span>}
                </div>
              )}
              {compFeitos > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Button variant="ghost" size="sm" onClick={limparCompradas} style={{ color: 'var(--ui-muted)', padding: 0 }}>Remover {compFeitos} comprado{compFeitos === 1 ? '' : 's'}</Button>
                </div>
              )}
            </div>
          )}

          {/* moeda padrão dos itens novos — controle secundário, discreto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 2px 4px' }}>
            <span className="ui-caption" style={{ flex: 1, minWidth: 0 }}>Itens novos em</span>
            <Segmented opcoes={[{ id: 'BRL', label: 'R$' }, { id: 'USD', label: 'US$' }]} valor={moedaPadrao} onChange={setMoedaPadrao} style={{ width: 150, flex: '0 0 auto' }} />
          </div>
          <div className="ui-hint" style={{ margin: '0 2px 14px' }}>Pra trocar a moeda de um item, toque no R$ / US$ ao lado do valor.{comDolar ? ' Compra feita lá nos EUA? Deixa em US$.' : ''}</div>

          {/* seções por categoria */}
          {COMPRAR_CATS.map(([catId]) => {
            const lista = compras.filter((i) => (i.prazo || 'outros') === catId);
            if (lista.length === 0) return null;
            const subtotalCat = somar(lista);
            return (
              <div key={catId} style={{ marginBottom: 16 }}>
                <TituloGrupo emoji={COMPRAR_EMOJI[catId]} nome={COMPRAR_LABEL[catId]} feitos={lista.filter((i) => i.feito).length} total={lista.length} direita={(subtotalCat.BRL > 0 || subtotalCat.USD > 0) ? fmtSoma(subtotalCat) : null} />
                <div className="ui-card ui-list" style={{ padding: '4px 8px' }}>
                  {lista.map((it) => (
                    <LinhaCompra
                      key={it.id}
                      it={it}
                      moeda={moedaDe(it)}
                      valorTexto={it.id in valorEdit ? valorEdit[it.id] : (it.valor != null ? Number(it.valor).toFixed(2).replace('.', ',') : '')}
                      onToggle={() => alternarChecklist(it.id, !it.feito)}
                      onEditar={() => editar(it)}
                      onApagar={() => apagarItem(it)}
                      onTrocarMoeda={() => alternarMoedaItem(it)}
                      onValor={(e) => { const v = e.target.value; setValorEdit((s) => ({ ...s, [it.id]: v })); }}
                      onSalvarValor={() => salvarValorItem(it.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* adicionar manual */}
          {compForm ? (
            <Reveal>
              <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
                <Field label="O que comprar?">
                  <input className="ui-input" autoFocus value={compForm.texto} onChange={(e) => setCompForm({ ...compForm, texto: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarCompForm()} placeholder="Ex.: mala de bordo" />
                </Field>
                <Field label="Categoria">
                  <select className="ui-input" value={compForm.cat} onChange={(e) => setCompForm({ ...compForm, cat: e.target.value })}>{COMPRAR_CATS.map(([id, e, l]) => <option key={id} value={id}>{e} {l}</option>)}</select>
                </Field>
                <Button full onClick={salvarCompForm} disabled={!compForm.texto.trim()}>Adicionar</Button>
                <Button variant="ghost" full onClick={() => setCompForm(null)} style={{ marginTop: 6, color: 'var(--ui-muted)' }}>Fechar</Button>
              </div>
            </Reveal>
          ) : compras.length > 0 ? (
            <BotaoAdicionar onClick={() => setCompForm({ texto: '', cat: 'bagagem' })} style={{ marginBottom: 8 }}>+ Adicionar item</BotaoAdicionar>
          ) : null}

          {/* sugestões: chips discretos, toque adiciona */}
          <SectionHeader title="Sugestões · toque pra adicionar" style={{ marginTop: 16 }} />
          {COMPRAR_CATS.map(([catId, emoji, label]) => {
            const chips = (sugestoes[catId] || []).filter((s) => !naLista.has(s.toLowerCase()));
            if (chips.length === 0) return null;
            return (
              <div key={catId} style={{ marginBottom: 12 }}>
                <div className="ui-caption" style={{ fontWeight: 700, margin: '0 4px 6px' }}>{emoji} {label}</div>
                <div className="chips">
                  {chips.map((s) => (
                    <button key={s} className="chip ui-press" onClick={() => addCompra(s, catId)}>+ {s}</button>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="ui-caption ui-faint" style={{ padding: '10px 4px 0', lineHeight: 1.5 }}>
            Lista do que comprar antes de viajar — equipamento, bagagem, eletrônicos. 🔒 É só sua: cada pessoa da viagem tem a própria lista. (Os mantimentos do supermercado ficam na aba Mercado, dentro do Motorhome, e essa sim é do grupo.)
          </p>
        </Reveal>
      )}
    </div>
  );
}

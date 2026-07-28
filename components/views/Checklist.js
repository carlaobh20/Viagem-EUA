'use client';
import { useEffect, useState, useRef } from 'react';
import { useData } from '../DataProvider';
import { fmtBRL } from '../../lib/format';

const TEMAS = ['Documentos', 'Dinheiro', 'Saúde', 'Bagagem', 'Carro', 'Antes de embarcar'];
const ICON_TEMA = { Documentos: '📄', Dinheiro: '💳', 'Saúde': '💊', Bagagem: '🧳', Carro: '🚗', 'Antes de embarcar': '🛫' };
const PRAZO_LABEL = { '30d': '30 dias', '7d': '7 dias', '1d': '1 dia' };
const PRAZO_COR = { '30d': '#2F6FE4', '7d': '#E0A22B', '1d': '#00C7B1' };

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
  const semPerfilTransporte = transporte.length === 0;
  const deCarro = transporte.includes('carro');
  const deAviao = semPerfilTransporte || transporte.includes('aviao');
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

  if (deAviao) t.push(['Check-in online feito', 'Antes de embarcar', '1d'], ['Bagagem dentro do peso', 'Antes de embarcar', '1d']);
  t.push(['Documentos na mão (não na mala)', 'Antes de embarcar', '1d'], ['Casa fechada (luz, água, gás)', 'Antes de embarcar', '1d']);

  return t;
}

// ===== Comprar (lista de compras pré-viagem — separada do Mercado do motorhome) =====
const COMPRAR_CATS = [
  ['bagagem', '🧳', 'Bagagem'],
  ['eletronicos', '🔌', 'Eletrônicos'],
  ['roupas', '👕', 'Roupas'],
  ['higiene', '🧴', 'Higiene'],
  ['viagem', '✈️', 'Viagem'],
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

export default function Checklist({ ir, abaInicial }) {
  const { viagem, perfil, checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist, semearChecklist, definirValorItem } = useData();
  const meu = perfil?.user_id;
  const souDono = (i) => i.user_id === meu || i.user_id == null; // meus itens + itens antigos (compartilhados)
  const [filtro, setFiltro] = useState('todos');
  const [add, setAdd] = useState(null);
  const [aba, setAba] = useState(abaInicial === 'comprar' ? 'comprar' : 'tarefas'); // 'tarefas' | 'comprar'
  const [compForm, setCompForm] = useState(null); // { texto, cat }
  const [valorEdit, setValorEdit] = useState({}); // { [itemId]: texto sendo digitado no campo de valor }

  const semeado = useRef(false);
  useEffect(() => {
    if (semeado.current || !viagem) return;
    const meusTemas = (checklist || []).filter((i) => TEMAS.includes(i.tema) && souDono(i));
    if (meusTemas.length === 0) {
      semeado.current = true;
      semearChecklist(montarTemplate(viagem).map(([texto, tema, prazo], i) => ({ texto, tema, prazo, ordem: i })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viagem?.id, meu]);

  const itens = (checklist || []).filter((i) => TEMAS.includes(i.tema) && souDono(i));
  const visiveis = filtro === 'todos' ? itens : itens.filter((i) => i.prazo === filtro);
  const feitos = visiveis.filter((i) => i.feito).length;
  const total = visiveis.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;

  // ----- Comprar -----
  const compras = (checklist || []).filter((i) => i.tema === 'Comprar' && souDono(i));
  const compFeitos = compras.filter((i) => i.feito).length;
  const compPct = compras.length > 0 ? Math.round((compFeitos / compras.length) * 100) : 0;
  function addCompra(texto, cat) {
    const t = (texto || '').trim();
    if (!t) return;
    if (compras.some((i) => (i.texto || '').toLowerCase() === t.toLowerCase())) return;
    adicionarChecklist({ texto: t, tema: 'Comprar', prazo: cat || 'outros', ordem: compras.length });
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
  const totalGeral = compras.reduce((s, i) => s + (i.valor != null ? Number(i.valor) : 0), 0);

  function novoItem() {
    if (!add || !add.texto.trim()) { setAdd(null); return; }
    const ordem = itens.length;
    adicionarChecklist({ texto: add.texto.trim(), tema: add.tema, prazo: add.prazo || null, ordem });
    setAdd(null);
  }
  function editar(it) { const t = window.prompt('Editar item', it.texto); if (t && t.trim()) editarChecklist(it.id, t.trim()); }

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 28px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('resumo')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Checklist</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Pra não esquecer nada</div>
        </div>
      </div>

      {/* abas Tarefas / Comprar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['tarefas', 'Tarefas'], ['comprar', 'Comprar']].map(([id, lbl]) => (
          <button key={id} onClick={() => setAba(id)} style={{ flex: 1, border: 'none', borderRadius: 14, padding: '10px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: aba === id ? 'var(--ui-teal)' : 'var(--ui-card)', color: aba === id ? '#fff' : 'var(--ui-muted)', boxShadow: aba === id ? 'none' : 'var(--ui-shadow)' }}>{lbl}</button>
        ))}
      </div>

      {aba === 'tarefas' && (<>
      {/* progresso */}
      <div style={{ ...card, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{feitos} de {total} prontos</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--ui-teal)' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 5, background: 'var(--ui-line)', overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', borderRadius: 5, background: 'var(--ui-teal)', transition: 'width .3s' }} /></div>
      </div>

      {/* filtro por prazo */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, overflowX: 'auto' }}>
        {[['todos', 'Tudo'], ['30d', '30 dias'], ['7d', '7 dias'], ['1d', '1 dia']].map(([id, l]) => (
          <button key={id} onClick={() => setFiltro(id)} style={{ flex: '0 0 auto', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: filtro === id ? 'var(--ui-teal)' : 'var(--ui-card)', color: filtro === id ? '#fff' : 'var(--ui-muted)', boxShadow: filtro === id ? 'none' : 'var(--ui-shadow)' }}>{l}</button>
        ))}
      </div>

      {/* seções por tema */}
      {TEMAS.map((tema) => {
        const lista = visiveis.filter((i) => i.tema === tema);
        if (lista.length === 0) return null;
        return (
          <div key={tema} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 9px' }}>
              <span style={{ fontSize: 16 }}>{ICON_TEMA[tema]}</span>
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>{tema}</span>
              <span style={{ fontSize: 12, color: 'var(--ui-faint)' }}>{lista.filter((i) => i.feito).length}/{lista.length}</span>
            </div>
            <div style={{ ...card, padding: '4px 14px' }}>
              {lista.map((it, idx) => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 0', borderTop: idx > 0 ? '1px solid var(--ui-line)' : 'none' }}>
                  <button onClick={() => alternarChecklist(it.id, !it.feito)} aria-label="Marcar" style={{ width: 24, height: 24, borderRadius: '50%', flex: '0 0 auto', cursor: 'pointer', border: it.feito ? 'none' : '2px solid var(--ui-line)', background: it.feito ? 'var(--ui-teal)' : 'transparent', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.feito ? '✓' : ''}</button>
                  <span onClick={() => editar(it)} style={{ flex: 1, minWidth: 0, fontSize: 14, cursor: 'text', textDecoration: it.feito ? 'line-through' : 'none', color: it.feito ? 'var(--ui-faint)' : 'var(--ui-ink)' }}>{it.texto}</span>
                  {it.prazo && <span style={{ fontSize: 10.5, fontWeight: 600, color: PRAZO_COR[it.prazo], background: PRAZO_COR[it.prazo] + '1A', padding: '3px 7px', borderRadius: 7, flex: '0 0 auto' }}>{PRAZO_LABEL[it.prazo]}</span>}
                  <button onClick={() => { if (window.confirm('Apagar este item?')) removerChecklist(it.id); }} aria-label="Apagar" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {total === 0 && <div style={{ ...card, padding: 24, textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, marginBottom: 14 }}>Nada por aqui {filtro !== 'todos' ? 'nesse prazo' : 'ainda'}.</div>}

      {/* adicionar */}
      {add ? (
        <div style={{ ...card, padding: 16 }}>
          <input autoFocus value={add.texto} onChange={(e) => setAdd({ ...add, texto: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && novoItem()} placeholder="O que não pode esquecer?" style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, marginBottom: 9, background: 'var(--ui-bg)', color: 'var(--ui-ink)' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 11 }}>
            <select value={add.tema} onChange={(e) => setAdd({ ...add, tema: e.target.value })} style={{ flex: 1, border: '1px solid var(--ui-line)', borderRadius: 12, padding: '10px', fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)' }}>{TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <select value={add.prazo} onChange={(e) => setAdd({ ...add, prazo: e.target.value })} style={{ width: 110, border: '1px solid var(--ui-line)', borderRadius: 12, padding: '10px', fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)' }}><option value="">sem prazo</option><option value="30d">30 dias</option><option value="7d">7 dias</option><option value="1d">1 dia</option></select>
          </div>
          <button onClick={novoItem} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
          <button onClick={() => setAdd(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, marginTop: 8, cursor: 'pointer' }}>Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAdd({ texto: '', tema: 'Documentos', prazo: '' })} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: '14px', background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar item</button>
      )}
      </>)}

      {aba === 'comprar' && (<>
        {/* progresso compras */}
        <div style={{ ...card, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{compFeitos} de {compras.length} comprados</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--ui-teal)' }}>{compPct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 5, background: 'var(--ui-line)', overflow: 'hidden' }}><div style={{ width: compPct + '%', height: '100%', borderRadius: 5, background: 'var(--ui-teal)', transition: 'width .3s' }} /></div>
          {totalGeral > 0 && <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 10 }}>Total da lista: <b style={{ color: 'var(--ui-ink)' }}>{fmtBRL(totalGeral)}</b></div>}
          {compFeitos > 0 && <button onClick={limparCompradas} style={{ width: '100%', marginTop: 10, border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 12.5, cursor: 'pointer' }}>Remover {compFeitos} comprado{compFeitos === 1 ? '' : 's'}</button>}
        </div>

        {/* seções por categoria */}
        {COMPRAR_CATS.map(([catId]) => {
          const lista = compras.filter((i) => (i.prazo || 'outros') === catId);
          if (lista.length === 0) return null;
          const subtotalCat = lista.reduce((s, i) => s + (i.valor != null ? Number(i.valor) : 0), 0);
          return (
            <div key={catId} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 9px' }}>
                <span style={{ fontSize: 16 }}>{COMPRAR_EMOJI[catId]}</span>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{COMPRAR_LABEL[catId]}</span>
                <span style={{ fontSize: 12, color: 'var(--ui-faint)' }}>{lista.filter((i) => i.feito).length}/{lista.length}</span>
                {subtotalCat > 0 && <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, color: 'var(--ui-teal)' }}>{fmtBRL(subtotalCat)}</span>}
              </div>
              <div style={{ ...card, padding: '4px 14px' }}>
                {lista.map((it, idx) => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 0', borderTop: idx > 0 ? '1px solid var(--ui-line)' : 'none' }}>
                    <button onClick={() => alternarChecklist(it.id, !it.feito)} aria-label="Marcar" style={{ width: 24, height: 24, borderRadius: '50%', flex: '0 0 auto', cursor: 'pointer', border: it.feito ? 'none' : '2px solid var(--ui-line)', background: it.feito ? 'var(--ui-teal)' : 'transparent', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.feito ? '✓' : ''}</button>
                    <span onClick={() => { const t = window.prompt('Editar item', it.texto); if (t && t.trim()) editarChecklist(it.id, t.trim()); }} style={{ flex: 1, minWidth: 0, fontSize: 14, cursor: 'text', textDecoration: it.feito ? 'line-through' : 'none', color: it.feito ? 'var(--ui-faint)' : 'var(--ui-ink)' }}>{it.texto}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, border: '1px solid var(--ui-line)', borderRadius: 9, background: 'var(--ui-bg)', padding: '0 8px', flex: '0 0 auto' }}>
                      <span style={{ fontSize: 11, color: 'var(--ui-faint)', fontWeight: 700 }}>R$</span>
                      <input
                        inputMode="decimal"
                        value={it.id in valorEdit ? valorEdit[it.id] : (it.valor != null ? Number(it.valor).toFixed(2).replace('.', ',') : '')}
                        onChange={(e) => setValorEdit((v) => ({ ...v, [it.id]: e.target.value }))}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => salvarValorItem(it.id)}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        placeholder="0,00"
                        aria-label={`Valor de ${it.texto}`}
                        style={{ width: 58, border: 'none', outline: 'none', padding: '7px 0', fontSize: 12.5, fontWeight: 600, textAlign: 'right', background: 'transparent', color: 'var(--ui-ink)' }}
                      />
                    </div>
                    <button onClick={() => { if (window.confirm('Apagar este item?')) removerChecklist(it.id); }} aria-label="Apagar" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {compras.length === 0 && <div style={{ ...card, padding: 24, textAlign: 'center', color: 'var(--ui-faint)', fontSize: 13, marginBottom: 14 }}>Nada na lista ainda. Toque numa sugestão ou adicione um item.</div>}

        {/* adicionar manual */}
        {compForm ? (
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <input autoFocus value={compForm.texto} onChange={(e) => setCompForm({ ...compForm, texto: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && salvarCompForm()} placeholder="O que comprar?" style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, marginBottom: 9, background: 'var(--ui-bg)', color: 'var(--ui-ink)' }} />
            <select value={compForm.cat} onChange={(e) => setCompForm({ ...compForm, cat: e.target.value })} style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '10px', fontSize: 13, background: 'var(--ui-bg)', color: 'var(--ui-ink)', marginBottom: 11 }}>{COMPRAR_CATS.map(([id, e, l]) => <option key={id} value={id}>{e} {l}</option>)}</select>
            <button onClick={salvarCompForm} style={{ width: '100%', border: 'none', borderRadius: 12, padding: '12px', background: 'var(--ui-teal)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
            <button onClick={() => setCompForm(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, marginTop: 8, cursor: 'pointer' }}>Fechar</button>
          </div>
        ) : (
          <button onClick={() => setCompForm({ texto: '', cat: 'bagagem' })} style={{ width: '100%', border: '1.5px dashed var(--ui-line)', borderRadius: 14, padding: '14px', background: 'transparent', color: 'var(--ui-teal)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>+ Adicionar item</button>
        )}

        {/* sugestões */}
        <div style={{ fontSize: 11, color: 'var(--ui-faint)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600, margin: '0 2px 8px' }}>Sugestões — toque para adicionar</div>
        {COMPRAR_CATS.map(([catId, emoji, label]) => {
          const naLista = new Set(compras.map((i) => (i.texto || '').toLowerCase()));
          const sugestoes = sugestoesComprar(viagem);
          const chips = (sugestoes[catId] || []).filter((s) => !naLista.has(s.toLowerCase()));
          if (chips.length === 0) return null;
          return (
            <div key={catId} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ui-muted)', margin: '0 2px 6px' }}>{emoji} {label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {chips.map((s) => (
                  <button key={s} onClick={() => addCompra(s, catId)} style={{ border: 'none', background: 'var(--ui-card)', boxShadow: 'var(--ui-shadow)', borderRadius: 16, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, color: 'var(--ui-muted)', cursor: 'pointer' }}>+ {s}</button>
                ))}
              </div>
            </div>
          );
        })}

        <p style={{ fontSize: 11, color: 'var(--ui-faint)', lineHeight: 1.5, padding: '10px 4px 0' }}>
          Lista do que comprar antes de viajar — equipamento, bagagem, eletrônicos. É compartilhada com o grupo. (Os mantimentos do supermercado ficam na aba Mercado, dentro do Motorhome.)
        </p>
      </>)}

    </div>
  );
}

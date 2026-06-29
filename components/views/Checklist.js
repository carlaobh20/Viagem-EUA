'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';
import { fmtBRL } from '../../lib/format';

const TEMAS = ['Documentos', 'Dinheiro', 'Saúde', 'Bagagem', 'Antes de embarcar'];
const ICON_TEMA = { Documentos: '📄', Dinheiro: '💳', 'Saúde': '💊', Bagagem: '🧳', 'Antes de embarcar': '🛫' };
const PRAZO_LABEL = { '30d': '30 dias', '7d': '7 dias', '1d': '1 dia' };
const PRAZO_COR = { '30d': '#2F6FE4', '7d': '#E0A22B', '1d': '#00C7B1' };

const TEMPLATE = [
  ['Passaporte válido (6+ meses)', 'Documentos', '30d'],
  ['Visto / ESTA aprovado', 'Documentos', '30d'],
  ['Seguro viagem contratado', 'Documentos', '30d'],
  ['CNH internacional (PID)', 'Documentos', '30d'],
  ['Cópias dos documentos (papel e celular)', 'Documentos', '7d'],
  ['Reservas e ingressos salvos', 'Documentos', '7d'],
  ['Cartão internacional / dólar', 'Dinheiro', '30d'],
  ['Avisar o banco sobre a viagem', 'Dinheiro', '7d'],
  ['Algum dinheiro em espécie', 'Dinheiro', '7d'],
  ['App de câmbio no celular', 'Dinheiro', '1d'],
  ['Vacinas em dia', 'Saúde', '30d'],
  ['Remédios de uso contínuo', 'Saúde', '7d'],
  ['Kit de primeiros socorros', 'Saúde', '7d'],
  ['Adaptador de tomada (EUA)', 'Bagagem', '7d'],
  ['Chip / eSIM internacional', 'Bagagem', '7d'],
  ['Carregadores e power bank', 'Bagagem', '1d'],
  ['Roupas conforme o clima', 'Bagagem', '1d'],
  ['Check-in online feito', 'Antes de embarcar', '1d'],
  ['Bagagem dentro do peso', 'Antes de embarcar', '1d'],
  ['Documentos na mão (não na mala)', 'Antes de embarcar', '1d'],
  ['Casa fechada (luz, água, gás)', 'Antes de embarcar', '1d'],
];

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

export default function Checklist({ ir, abaInicial }) {
  const { viagem, checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist, semearChecklist, definirValorCompra } = useData();
  const [filtro, setFiltro] = useState('todos');
  const [add, setAdd] = useState(null);
  const [aba, setAba] = useState(abaInicial === 'comprar' ? 'comprar' : 'tarefas'); // 'tarefas' | 'comprar'
  const [compForm, setCompForm] = useState(null); // { texto, cat }
  const [precoBox, setPrecoBox] = useState(null); // { id, valor } — caixa de valor ao marcar comprado

  useEffect(() => {
    if (viagem && !viagem.checklist_seed && (checklist || []).filter((i) => TEMAS.includes(i.tema)).length === 0) {
      semearChecklist(TEMPLATE.map(([texto, tema, prazo], i) => ({ texto, tema, prazo, ordem: i })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viagem?.checklist_seed]);

  const itens = (checklist || []).filter((i) => TEMAS.includes(i.tema));
  const visiveis = filtro === 'todos' ? itens : itens.filter((i) => i.prazo === filtro);
  const feitos = visiveis.filter((i) => i.feito).length;
  const total = visiveis.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;

  // ----- Comprar -----
  const compras = (checklist || []).filter((i) => i.tema === 'Comprar');
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
  function confirmarCompra() {
    if (!precoBox) return;
    definirValorCompra(precoBox.id, true, parseBRL(precoBox.valor));
    setPrecoBox(null);
  }
  const totalComprado = compras.filter((i) => i.feito && i.valor != null).reduce((s, i) => s + Number(i.valor || 0), 0);

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
          {totalComprado > 0 && <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 10 }}>Total comprado: <b style={{ color: 'var(--ui-ink)' }}>{fmtBRL(totalComprado)}</b></div>}
          {compFeitos > 0 && <button onClick={limparCompradas} style={{ width: '100%', marginTop: 10, border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 12.5, cursor: 'pointer' }}>Remover {compFeitos} comprado{compFeitos === 1 ? '' : 's'}</button>}
        </div>

        {/* seções por categoria */}
        {COMPRAR_CATS.map(([catId]) => {
          const lista = compras.filter((i) => (i.prazo || 'outros') === catId);
          if (lista.length === 0) return null;
          return (
            <div key={catId} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 9px' }}>
                <span style={{ fontSize: 16 }}>{COMPRAR_EMOJI[catId]}</span>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{COMPRAR_LABEL[catId]}</span>
                <span style={{ fontSize: 12, color: 'var(--ui-faint)' }}>{lista.filter((i) => i.feito).length}/{lista.length}</span>
              </div>
              <div style={{ ...card, padding: '4px 14px' }}>
                {lista.map((it, idx) => (
                  <div key={it.id} style={{ borderTop: idx > 0 ? '1px solid var(--ui-line)' : 'none', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <button onClick={() => it.feito ? definirValorCompra(it.id, false, it.valor) : setPrecoBox({ id: it.id, valor: it.valor != null ? String(it.valor) : '' })} aria-label="Marcar" style={{ width: 24, height: 24, borderRadius: '50%', flex: '0 0 auto', cursor: 'pointer', border: it.feito ? 'none' : '2px solid var(--ui-line)', background: it.feito ? 'var(--ui-teal)' : 'transparent', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{it.feito ? '✓' : ''}</button>
                      <span onClick={() => { const t = window.prompt('Editar item', it.texto); if (t && t.trim()) editarChecklist(it.id, t.trim()); }} style={{ flex: 1, minWidth: 0, fontSize: 14, cursor: 'text', textDecoration: it.feito ? 'line-through' : 'none', color: it.feito ? 'var(--ui-faint)' : 'var(--ui-ink)' }}>{it.texto}</span>
                      {it.feito && it.valor != null && <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ui-teal)', background: 'rgba(0,199,177,.12)', padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', flex: '0 0 auto' }}>{fmtBRL(it.valor)}</span>}
                      <button onClick={() => { if (window.confirm('Apagar este item?')) removerChecklist(it.id); }} aria-label="Apagar" style={{ border: 'none', background: 'none', color: 'var(--ui-faint)', fontSize: 14, cursor: 'pointer', flex: '0 0 auto' }}>✕</button>
                    </div>
                    {precoBox && precoBox.id === it.id && (
                      <div style={{ marginTop: 11, background: 'var(--ui-bg)', borderRadius: 13, padding: 12 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginBottom: 7 }}>Quanto você pagou? <span style={{ color: 'var(--ui-faint)' }}>(opcional)</span></div>
                        <input autoFocus inputMode="decimal" value={precoBox.valor} onChange={(e) => setPrecoBox({ ...precoBox, valor: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && confirmarCompra()} placeholder="R$ 0,00" style={{ width: '100%', border: '1px solid var(--ui-line)', borderRadius: 11, padding: '10px 12px', fontSize: 15, background: 'var(--ui-card)', color: 'var(--ui-ink)', marginBottom: 10 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={confirmarCompra} style={{ flex: 1, border: 'none', borderRadius: 11, padding: '11px', background: 'var(--ui-teal)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>✓ Comprei</button>
                          <button onClick={() => { if (window.confirm('Apagar este item da lista?')) { removerChecklist(it.id); setPrecoBox(null); } }} style={{ border: '1px solid var(--ui-line)', borderRadius: 11, padding: '11px 14px', background: 'var(--ui-card)', color: '#C0392B', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', flex: '0 0 auto' }}>🗑 Desisti</button>
                        </div>
                        <button onClick={() => setPrecoBox(null)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 12.5, marginTop: 7, cursor: 'pointer' }}>cancelar</button>
                      </div>
                    )}
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
          const chips = (COMPRAR_SUG[catId] || []).filter((s) => !naLista.has(s.toLowerCase()));
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

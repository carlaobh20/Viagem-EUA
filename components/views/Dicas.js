'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

const CATS = [
  { id: 'cartao', label: 'Cartão & câmbio', emoji: '💳', cor: '#2D66A8', bg: 'rgba(45,102,168,.12)' },
  { id: 'postos', label: 'Postos', emoji: '⛽', cor: '#0F9D6B', bg: 'rgba(16,185,129,.12)' },
  { id: 'compras', label: 'Compras', emoji: '🛍️', cor: '#7C3AED', bg: 'rgba(124,58,237,.12)' },
  { id: 'comida', label: 'Alimentação', emoji: '🍔', cor: '#C2410C', bg: 'rgba(234,88,12,.12)' },
  { id: 'apps', label: 'Apps & internet', emoji: '📱', cor: '#0E7C9C', bg: 'rgba(14,124,156,.12)' },
  { id: 'passeios', label: 'Passeios', emoji: '🎢', cor: '#D4537E', bg: 'rgba(212,83,126,.12)' },
  { id: 'outros', label: 'Outros', emoji: '📌', cor: '#57534E', bg: 'rgba(87,83,78,.12)' },
];
const catDe = (id) => CATS.find((c) => c.id === id) || CATS[CATS.length - 1];

// Dicas sugeridas (checadas em jul/2026). A família pode adicionar e editar.
const SUGESTOES = [
  { categoria: 'cartao', titulo: 'Conte o IOF de 3,5% no custo', texto: 'Compra internacional no crédito ou débito tem IOF de 3,5% (2026). Cartão pré-pago de viagem cobra o mesmo. Já soma isso na hora de comparar preço com o Brasil.' },
  { categoria: 'cartao', titulo: 'Sempre pague em DÓLAR, nunca em real', texto: 'Se a maquininha perguntar "dólar ou reais?", escolha dólar. Pagar em real no exterior (DCC) embute um câmbio ruim e sai mais caro.' },
  { categoria: 'cartao', titulo: 'Avise a viagem no app do banco', texto: 'Registre aviso de viagem antes de embarcar pra não bloquearem o cartão na primeira compra nos EUA. Leve mais de um cartão.' },
  { categoria: 'postos', titulo: 'Ache o posto mais barato no GasBuddy', texto: 'O preço da gasolina muda muito de um posto pro outro. O app GasBuddy mostra o mais barato perto de você.' },
  { categoria: 'postos', titulo: 'Cashback de gasolina com o Upside', texto: 'O app Upside devolve alguns centavos por galão em postos parceiros. É de graça, ativa antes de abastecer.' },
  { categoria: 'postos', titulo: 'Gasolina de Costco/Sam’s é mais barata', texto: 'Postos dentro de Costco e Sam’s Club costumam ter o menor preço (precisa ser membro do clube).' },
  { categoria: 'postos', titulo: 'Veja o "cash price"', texto: 'Muitos postos cobram mais no cartão. Se houver preço à vista (cash) menor, compensa pagar em dinheiro.' },
  { categoria: 'compras', titulo: 'Nos EUA NÃO existe tax free pra turista', texto: 'Diferente da Europa, os EUA não devolvem imposto pro turista (só programas raros em Louisiana e Texas). Não conte com reembolso no aeroporto.' },
  { categoria: 'compras', titulo: 'Compre em estado sem sales tax', texto: 'Sem imposto sobre vendas: Delaware, Oregon, Montana e New Hampshire (e Alaska, com exceções locais). Eletrônico e roupa saem bem mais baratos lá.' },
  { categoria: 'compras', titulo: 'Pegue o cupom VIP dos outlets', texto: 'Nos Premium Outlets dá pra pegar o "VIP Coupon Book" (no site ou no guest services) com descontos extras nas lojas.' },
  { categoria: 'compras', titulo: 'A etiqueta não inclui o imposto', texto: 'Fora os estados sem sales tax, o imposto (~4% a 10%) entra só no caixa. O total sempre vem um pouco maior que o preço da etiqueta.' },
  { categoria: 'comida', titulo: 'Gorjeta de 15–20% é esperada', texto: 'Em restaurante com garçom a gorjeta (tip) de 15–20% é praticamente obrigatória e não vem no preço do cardápio. Confira se já veio como "gratuity" na conta.' },
  { categoria: 'comida', titulo: 'Água da torneira é grátis', texto: 'Peça "tap water" no restaurante: é grátis e potável, evita pagar por garrafa a cada refeição.' },
  { categoria: 'apps', titulo: 'eSIM sai bem mais barato que roaming', texto: 'Um eSIM de viagem (ex.: Airalo e similares) custa muito menos que o roaming da operadora. Compre e ative antes de embarcar.' },
  { categoria: 'apps', titulo: 'Baixe o mapa offline', texto: 'No Google Maps, baixe a região offline antes de sair. Funciona sem internet e economiza dados.' },
  { categoria: 'passeios', titulo: 'Compre ingresso online e com antecedência', texto: 'Parques e atrações saem mais baratos e sem fila comprando online antes. Compare o preço em sites de ingresso além do oficial.' },
];

export default function Dicas({ ir }) {
  const { dicas, adicionarDica, editarDica, removerDica, semearDicas } = useData();
  const [filtro, setFiltro] = useState('todos');
  const [form, setForm] = useState(null); // { id?, categoria, titulo, texto, link }
  const [verSugestoes, setVerSugestoes] = useState(false);

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, background: 'var(--ui-bg)', color: 'var(--ui-ink)', boxSizing: 'border-box' };

  const todas = dicas || [];
  const catsComItem = CATS.filter((c) => todas.some((d) => (d.categoria || 'outros') === c.id));
  const lista = todas.filter((d) => filtro === 'todos' || (d.categoria || 'outros') === filtro);
  const grupos = catsComItem
    .map((c) => ({ cat: c, itens: lista.filter((d) => (d.categoria || 'outros') === c.id) }))
    .filter((g) => g.itens.length);

  function abrirNova() { setForm({ id: null, categoria: 'cartao', titulo: '', texto: '', link: '' }); }
  function abrirEdicao(d) { setForm({ id: d.id, categoria: d.categoria || 'outros', titulo: d.titulo || '', texto: d.texto || '', link: d.link || '' }); }
  function salvar() {
    if (!form || !form.titulo.trim()) { setForm(null); return; }
    if (form.id) editarDica(form.id, { categoria: form.categoria, titulo: form.titulo.trim(), texto: form.texto.trim() || null, link: form.link.trim() || null });
    else adicionarDica({ categoria: form.categoria, titulo: form.titulo, texto: form.texto, link: form.link });
    setForm(null);
  }
  function excluir(d) { if (window.confirm(`Excluir a dica "${d.titulo}"?`)) removerDica(d.id); }

  const jaExiste = (t) => todas.some((d) => (d.titulo || '').trim().toLowerCase() === t.trim().toLowerCase());
  const sugestoesRestantes = SUGESTOES.filter((s) => !jaExiste(s.titulo));

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => ir('menu')} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>Dicas imperdíveis</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>Descontos e bônus da viagem, por setor</div>
        </div>
      </div>

      {/* form de adicionar / editar */}
      {form ? (
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{form.id ? 'Editar dica' : 'Nova dica'}</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--ui-muted)', display: 'block', marginBottom: 5 }}>Setor</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inp}>
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--ui-muted)', display: 'block', marginBottom: 5 }}>Título</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Cashback de gasolina" style={inp} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--ui-muted)', display: 'block', marginBottom: 5 }}>Detalhe (opcional)</label>
            <textarea value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="Como funciona, onde usar…" style={{ ...inp, minHeight: 70, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--ui-muted)', display: 'block', marginBottom: 5 }}>Link (opcional)</label>
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={salvar} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, background: 'var(--ui-teal)', color: '#fff', cursor: 'pointer' }}>{form.id ? 'Salvar' : 'Adicionar'}</button>
            <button onClick={() => setForm(null)} style={{ flex: '0 0 auto', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '12px 18px', fontSize: 14, fontWeight: 600, background: 'var(--ui-card)', color: 'var(--ui-muted)', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={abrirNova} style={{ width: '100%', border: '1px dashed var(--ui-line)', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, background: 'var(--ui-card)', color: 'var(--ui-teal)', cursor: 'pointer', marginBottom: 16 }}>+ Nova dica</button>
      )}

      {/* estado vazio: oferece as sugeridas */}
      {todas.length === 0 && !form && (
        <div style={{ ...card, padding: 18, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Comece com nossas dicas prontas 💡</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 14 }}>{SUGESTOES.length} dicas checadas de desconto e bônus pra viagem aos EUA. Você edita ou apaga depois.</div>
          <button onClick={() => semearDicas(SUGESTOES)} style={{ border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 700, background: 'var(--ui-teal)', color: '#fff', cursor: 'pointer' }}>Adicionar as {SUGESTOES.length} dicas sugeridas</button>
        </div>
      )}

      {/* filtro por setor */}
      {catsComItem.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
          {[{ id: 'todos', label: 'Todas' }, ...catsComItem].map((c) => (
            <button key={c.id} onClick={() => setFiltro(c.id)} style={{ flex: '0 0 auto', border: 'none', borderRadius: 12, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: filtro === c.id ? 'var(--ui-teal)' : 'var(--ui-card)', color: filtro === c.id ? '#fff' : 'var(--ui-muted)', boxShadow: filtro === c.id ? 'none' : 'var(--ui-shadow)' }}>{c.emoji ? c.emoji + ' ' : ''}{c.label}</button>
          ))}
        </div>
      )}

      {/* lista agrupada por setor */}
      {grupos.map((g) => (
        <div key={g.cat.id} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 10px' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: g.cat.bg, color: g.cat.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flex: '0 0 auto' }}>{g.cat.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.5px', color: 'var(--ui-muted)' }}>{g.cat.label.toUpperCase()}</span>
          </div>
          <div style={{ ...card, padding: '4px 16px' }}>
            {g.itens.map((d, i) => (
              <div key={d.id} style={{ padding: '14px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ui-ink)' }}>{d.titulo}</div>
                {d.texto && <div style={{ fontSize: 13.5, color: 'var(--ui-muted)', marginTop: 3, lineHeight: 1.45 }}>{d.texto}</div>}
                {d.link && <a href={d.link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--ui-teal)', display: 'inline-block', marginTop: 6, wordBreak: 'break-all' }}>🔗 abrir link</a>}
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <button onClick={() => abrirEdicao(d)} style={{ border: 'none', background: 'none', padding: 0, fontSize: 13, fontWeight: 600, color: 'var(--ui-muted)', cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => excluir(d)} style={{ border: 'none', background: 'none', padding: 0, fontSize: 13, fontWeight: 600, color: '#C2410C', cursor: 'pointer' }}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* sugestões prontas (sempre disponíveis pra adicionar as que faltam) */}
      {sugestoesRestantes.length > 0 && todas.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setVerSugestoes((v) => !v)} style={{ width: '100%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', cursor: 'pointer', color: 'var(--ui-muted)' }}>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.5px' }}>SUGESTÕES PRONTAS ({sugestoesRestantes.length})</span>
            <span style={{ fontSize: 16 }}>{verSugestoes ? '▾' : '▸'}</span>
          </button>
          {verSugestoes && (
            <div style={{ ...card, padding: '4px 16px', marginTop: 6 }}>
              {sugestoesRestantes.map((s, i) => {
                const c = catDe(s.categoria);
                return (
                  <div key={s.titulo} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 0', borderTop: i > 0 ? '1px solid var(--ui-line)' : 'none' }}>
                    <span style={{ fontSize: 16, marginTop: 1, flex: '0 0 auto' }}>{c.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.titulo}</div>
                      {s.texto && <div style={{ fontSize: 12.5, color: 'var(--ui-muted)', marginTop: 2, lineHeight: 1.4 }}>{s.texto}</div>}
                    </div>
                    <button onClick={() => adicionarDica(s)} style={{ flex: '0 0 auto', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 13, fontWeight: 700, background: 'var(--ui-teal)', color: '#fff', cursor: 'pointer' }}>+ Add</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

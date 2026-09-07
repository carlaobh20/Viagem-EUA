'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '../DataProvider';
import { PageHeader, Button, Field, EmptyState, Reveal, Expand, Skeleton } from '../ui';

// Temas: o emoji já diferencia — sem cor por tema (paleta do app só).
const CATS = [
  { id: 'cartao', label: 'Cartão & câmbio', emoji: '💳' },
  { id: 'postos', label: 'Postos', emoji: '⛽' },
  { id: 'compras', label: 'Compras', emoji: '🛍️' },
  { id: 'comida', label: 'Alimentação', emoji: '🍔' },
  { id: 'apps', label: 'Apps & internet', emoji: '📱' },
  { id: 'passeios', label: 'Passeios', emoji: '🎢' },
  { id: 'outros', label: 'Outros', emoji: '📌' },
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

function reduzImg(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1400;
      let w = img.width, h = img.height;
      if (w > max || h > max) { if (w >= h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob((blob) => { URL.revokeObjectURL(url); blob ? resolve(new File([blob], 'dica.jpg', { type: 'image/jpeg' })) : reject(new Error('falha ao processar')); }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem inválida')); };
    img.src = url;
  });
}

// ação secundária em texto com alvo de 44px
const acaoTxt = { background: 'none', border: 'none', minHeight: 44, padding: '0 6px', fontSize: 13.5, fontWeight: 700, color: 'var(--ui-teal-ink)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4 };
// Imagem da dica na lista: acompanha o texto, não domina — toque abre em tamanho real.
const IMG_LISTA = { display: 'block', width: '100%', maxHeight: 176, objectFit: 'cover', objectPosition: 'top', borderRadius: 12, background: 'var(--ui-sunken)' };

export default function Dicas({ ir }) {
  const { dicas, adicionarDica, editarDica, removerDica, semearDicas, subirImagemDica, urlImagemDica } = useData();
  const [filtro, setFiltro] = useState('todos');
  const [form, setForm] = useState(null);
  const [formErro, setFormErro] = useState('');
  const [verSugestoes, setVerSugestoes] = useState(false);
  const [imgUrls, setImgUrls] = useState({});
  const fileRef = useRef(null);

  const todas = dicas || [];

  useEffect(() => {
    let cancel = false;
    (async () => {
      for (const d of todas) {
        if (d.imagem && !(d.id in imgUrls)) {
          const u = await urlImagemDica(d.imagem);
          if (!cancel) setImgUrls((prev) => ({ ...prev, [d.id]: u }));
        }
      }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dicas]);

  const catsComItem = CATS.filter((c) => todas.some((d) => (d.categoria || 'outros') === c.id));
  const lista = todas.filter((d) => filtro === 'todos' || (d.categoria || 'outros') === filtro);
  const grupos = catsComItem
    .map((c) => ({ cat: c, itens: lista.filter((d) => (d.categoria || 'outros') === c.id) }))
    .filter((g) => g.itens.length);

  function abrirNova() { setFormErro(''); setForm({ id: null, categoria: filtro !== 'todos' ? filtro : 'cartao', titulo: '', texto: '', link: '', imagem: null, imgPreview: null, subindo: false }); }
  function abrirEdicao(d) { setFormErro(''); setForm({ id: d.id, categoria: d.categoria || 'outros', titulo: d.titulo || '', texto: d.texto || '', link: d.link || '', imagem: d.imagem || null, imgPreview: imgUrls[d.id] || null, subindo: false }); }

  async function aoEscolherImagem(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFormErro('');
    setForm((f) => ({ ...f, subindo: true }));
    try {
      const reduzida = await reduzImg(file);
      const path = await subirImagemDica(reduzida);
      if (!path) throw new Error('upload falhou');
      const preview = URL.createObjectURL(reduzida);
      setForm((f) => ({ ...f, imagem: path, imgPreview: preview, subindo: false }));
    } catch (err) {
      setForm((f) => ({ ...f, subindo: false }));
      setFormErro('Não consegui subir a imagem: ' + err.message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  function removerImagemDoForm() { setForm((f) => ({ ...f, imagem: null, imgPreview: null })); }

  function salvar() {
    if (!form) return;
    const temTitulo = form.titulo.trim();
    if (!temTitulo && !form.imagem) { setFormErro('Escreva um título ou adicione uma imagem.'); return; }
    if (form.subindo) { setFormErro('Espere a imagem terminar de subir.'); return; }
    setFormErro('');
    const campos = { categoria: form.categoria, titulo: temTitulo || null, texto: form.texto.trim() || null, link: form.link.trim() || null, imagem: form.imagem || null };
    if (form.id) editarDica(form.id, campos);
    else adicionarDica(campos);
    setForm(null);
  }
  function excluir(d) { if (window.confirm('Excluir esta dica?')) removerDica(d.id); }

  const jaExiste = (t) => todas.some((d) => (d.titulo || '').trim().toLowerCase() === t.trim().toLowerCase());
  const sugestoesRestantes = SUGESTOES.filter((s) => !jaExiste(s.titulo));

  const previewSrc = form ? (form.imgPreview || (form.id ? imgUrls[form.id] : null)) : null;

  const subtitulo = todas.length === 0
    ? 'Descontos e bônus da viagem, por tema'
    : `${todas.length} ${todas.length === 1 ? 'dica' : 'dicas'} em ${catsComItem.length} ${catsComItem.length === 1 ? 'tema' : 'temas'}`;

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="Dicas imperdíveis"
        subtitulo={subtitulo}
        onVoltar={() => (form ? setForm(null) : ir('menu'))}
        acao={!form ? <Button variant="soft" size="sm" onClick={abrirNova} style={{ minHeight: 40 }}>+ Dica</Button> : null}
      />

      {form ? (
        <Reveal>
          <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="ui-h2" style={{ marginBottom: 14 }}>{form.id ? 'Editar dica' : 'Nova dica'}</div>
            <Field label="Tema">
              <select className="ui-input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATS.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
            </Field>
            <Field label="Título" hint={form.imagem ? undefined : 'Pode ficar vazio se você colocar uma imagem.'}>
              <input className="ui-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex.: Cashback de gasolina" autoFocus={!form.id} />
            </Field>
            <Field label="Detalhe" opcional>
              <textarea className="ui-input" value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="Como funciona, onde usar…" style={{ minHeight: 84 }} />
            </Field>

            <Field label="Imagem ou print" opcional>
              <input ref={fileRef} type="file" accept="image/*" onChange={aoEscolherImagem} style={{ display: 'none' }} />
              {previewSrc ? (
                <div>
                  <img src={previewSrc} alt="Imagem da dica" style={{ display: 'block', width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 12, background: 'var(--ui-sunken)' }} />
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <button type="button" onClick={() => fileRef.current && fileRef.current.click()} disabled={form.subindo} style={acaoTxt}>Trocar</button>
                    <button type="button" onClick={removerImagemDoForm} style={{ ...acaoTxt, color: 'var(--ui-debit)' }}>Remover</button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="secondary" full onClick={() => fileRef.current && fileRef.current.click()} disabled={form.subindo} style={{ borderStyle: 'dashed' }}>{form.subindo ? 'Subindo imagem…' : '📷 Adicionar imagem / print'}</Button>
              )}
            </Field>

            <Field label="Link" opcional><input className="ui-input" type="url" inputMode="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" /></Field>

            {formErro && <div className="ui-error">{formErro}</div>}
            <Button size="lg" full onClick={salvar} disabled={form.subindo}>{form.id ? 'Salvar dica' : 'Adicionar dica'}</Button>
            <Button variant="ghost" full style={{ marginTop: 6 }} onClick={() => setForm(null)}>Cancelar</Button>
          </div>
        </Reveal>
      ) : (
        <>
          {todas.length === 0 && (
            <EmptyState
              icone="💡"
              titulo="Comece com nossas dicas prontas."
              texto={`${SUGESTOES.length} dicas checadas de desconto e bônus pra viagem aos EUA. Você edita ou apaga depois.`}
              cta={`Adicionar as ${SUGESTOES.length} dicas`}
              onCta={() => semearDicas(SUGESTOES)}
              secundario={<button onClick={abrirNova} style={acaoTxt}>ou escreva a sua primeira dica</button>}
            />
          )}

          {/* navegação por tema: chips roláveis */}
          {catsComItem.length > 1 && (
            <div className="ui-chips-scroll" style={{ marginBottom: 6 }}>
              {[{ id: 'todos', label: 'Todas', emoji: '' }, ...catsComItem].map((c) => (
                <button key={c.id} onClick={() => setFiltro(c.id)} className={`ui-chipbtn${filtro === c.id ? ' on' : ''}`} aria-pressed={filtro === c.id}>{c.emoji ? c.emoji + ' ' : ''}{c.label}</button>
              ))}
            </div>
          )}

          {grupos.map((g, gi) => (
            <Reveal key={g.cat.id} delay={Math.min(gi, 4) * 0.04}>
              <div className="ui-section" style={{ marginTop: gi === 0 ? 12 : 22 }}><span>{g.cat.emoji} {g.cat.label}</span></div>
              <div className="ui-card" style={{ padding: '2px 16px' }}>
                <div className="ui-list">
                  {g.itens.map((d) => (
                    <article key={d.id} style={{ padding: '16px 0 8px' }}>
                      {d.titulo && <h3 className="ui-wrap" style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.2px', lineHeight: 1.3, margin: 0 }}>{d.titulo}</h3>}
                      {d.texto && <p className="ui-wrap" style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--ui-ink)', marginTop: d.titulo ? 6 : 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{d.texto}</p>}
                      {d.imagem && (
                        <div style={{ marginTop: 10 }}>
                          {imgUrls[d.id] ? (
                            <a href={imgUrls[d.id]} target="_blank" rel="noreferrer" style={{ display: 'block' }} aria-label="Abrir imagem em tamanho real">
                              <img src={imgUrls[d.id]} alt={d.titulo || 'Imagem da dica'} style={IMG_LISTA} />
                              <span className="ui-caption" style={{ display: 'block', marginTop: 4, color: 'var(--ui-faint)' }}>toque pra ampliar</span>
                            </a>
                          ) : (
                            <Skeleton height={120} radiusPx={12} />
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 6, flexWrap: 'wrap' }}>
                        {d.link && <a href={d.link} target="_blank" rel="noreferrer" style={{ ...acaoTxt, padding: '0 6px 0 0', textDecoration: 'none' }}>🔗 abrir link</a>}
                        <span style={{ flex: 1 }} />
                        <button onClick={() => abrirEdicao(d)} style={{ ...acaoTxt, color: 'var(--ui-muted)' }}>Editar</button>
                        <button onClick={() => excluir(d)} style={{ ...acaoTxt, color: 'var(--ui-debit)', paddingRight: 0 }}>Excluir</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}

          {todas.length > 0 && lista.length === 0 && (
            <EmptyState compacto icone={catDe(filtro).emoji} titulo={`Nada em ${catDe(filtro).label.toLowerCase()} ainda.`} texto="Escreva uma dica nesse tema ou veja todas." cta="Nova dica" onCta={abrirNova} secundario={<button onClick={() => setFiltro('todos')} style={acaoTxt}>ver todas</button>} />
          )}

          {sugestoesRestantes.length > 0 && todas.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <button onClick={() => setVerSugestoes((v) => !v)} aria-expanded={verSugestoes} className="ui-section" style={{ width: '100%', margin: '0 0 8px', background: 'none', border: 'none', minHeight: 44, cursor: 'pointer' }}>
                <span>Sugestões prontas · {sugestoesRestantes.length}</span>
                <span aria-hidden="true" style={{ fontSize: 14, transform: verSugestoes ? 'rotate(180deg)' : 'none', transition: 'transform .18s var(--ease)' }}>▾</span>
              </button>
              <Expand aberto={verSugestoes}>
                <div className="ui-card" style={{ padding: '2px 16px' }}>
                  <div className="ui-list">
                    {sugestoesRestantes.map((s) => {
                      const c = catDe(s.categoria);
                      return (
                        <div key={s.titulo} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 0' }}>
                          <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--ui-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: '0 0 auto' }}>{c.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ui-wrap" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{s.titulo}</div>
                            {s.texto && <div className="ui-wrap" style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 3, lineHeight: 1.45 }}>{s.texto}</div>}
                          </div>
                          <Button variant="soft" size="sm" onClick={() => adicionarDica(s)} style={{ flex: '0 0 auto', minHeight: 40 }}>+ Add</Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Expand>
            </div>
          )}
        </>
      )}
    </div>
  );
}

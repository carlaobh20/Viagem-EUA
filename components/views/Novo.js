'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { CATEGORIAS, hojeLocal, usaDolar, fmtBRL, fmtUSD } from '../../lib/format';
import { PageHeader, Button, Field, Expand } from '../ui';

// Novo gasto / editar gasto. Feito pra ser rápido: valor → descrição → categoria,
// com defaults (hoje, moeda da viagem, quem pagou = eu, dividir = eu). Data, ponto do
// roteiro e visibilidade ficam atrás de "+ mais detalhes" quando não são usados.
// O comprovante (com leitura por IA) fica no topo, compacto. Tudo que existia continua aqui.

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dataCurta(iso) {
  if (!iso) return '';
  if (iso === hojeLocal()) return 'hoje';
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return iso;
  const dt = new Date(a, m - 1, d);
  return `${DIAS[dt.getDay()]}, ${d} ${MESES[m - 1]}`;
}

// Estilos fixos (fora do componente: nada remonta a cada render)
const VALOR_INPUT = { fontSize: 30, fontWeight: 800, letterSpacing: '-0.8px', minHeight: 60, padding: '8px 14px', fontVariantNumeric: 'tabular-nums' };
const PESSOA_BTN = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 64, padding: '8px 4px', borderRadius: 14, cursor: 'pointer', transition: 'background .15s ease, border-color .15s ease' };
const BARRA_FIXA = { position: 'sticky', bottom: 0, margin: '16px -18px 0', padding: '10px 18px calc(12px + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--ui-bg) 78%, transparent)' };

export default function Novo({ ir }) {
  const { viagem, perfis, pontos, perfil, divisoes, gastoVistoPor, salvarGasto, atualizarGasto, gastoEditando, setGastoEditando, urlRecibo } = useData();
  const ed = gastoEditando;
  const inputCamera = useRef(null);
  const inputGaleria = useRef(null);
  const comDolar = usaDolar(viagem);
  const cambio = Number(viagem?.cotacao_usd) || 0;

  const [descricao, setDescricao] = useState(ed ? (ed.descricao || '') : '');
  const [valor, setValor] = useState(ed ? String(ed.valor).replace('.', ',') : '');
  const [moeda, setMoeda] = useState(ed ? ed.moeda : (comDolar ? 'USD' : 'BRL'));
  const [categoria, setCategoria] = useState(ed ? ed.categoria : 'comida');
  const [pagoPor, setPagoPor] = useState(ed ? ed.pago_por : (perfil?.id || (perfis[0] && perfis[0].id)));
  const [pontoId, setPontoId] = useState(ed ? (ed.ponto_id || '') : '');
  const [data, setData] = useState(ed ? ed.data : hoje());
  const [privado, setPrivado] = useState(ed ? !!ed.privado : false);
  const [compartilhadoCom, setCompartilhadoCom] = useState(() =>
    ed ? gastoVistoPor.filter((v) => v.gasto_id === ed.id).map((v) => v.perfil_id) : []
  );
  const [partes, setPartes] = useState(() => {
    const init = {};
    perfis.forEach((p) => { init[p.id] = (!ed && perfil && p.id === perfil.id) ? 1 : 0; });
    if (ed) { divisoes.filter((d) => d.gasto_id === ed.id).forEach((d) => { init[d.perfil_id] = Number(d.partes) || 1; }); }
    return init;
  });
  // "+ mais detalhes" já vem aberto quando algum opcional está em uso (edição)
  const [detalhes, setDetalhes] = useState(() => !!(ed && (ed.ponto_id || ed.privado || (ed.data && ed.data !== hoje()))));
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');
  // Comprovante: foto nova (blob) ou a já salva (recibo_url → link assinado)
  const [reciboBlob, setReciboBlob] = useState(null);
  const [reciboBase64, setReciboBase64] = useState(null);
  const [reciboPreview, setReciboPreview] = useState(null);
  const [reciboAtualUrl, setReciboAtualUrl] = useState(null);
  const [removerRecibo, setRemoverRecibo] = useState(false);
  const [lendoRecibo, setLendoRecibo] = useState(false);
  const [avisoRecibo, setAvisoRecibo] = useState('');
  useEffect(() => {
    let vivo = true;
    if (ed && ed.recibo_url) urlRecibo(ed.recibo_url).then((u) => { if (vivo) setReciboAtualUrl(u); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ed && ed.recibo_url]);

  function togglePessoa(id) { setPartes((prev) => ({ ...prev, [id]: prev[id] > 0 ? 0 : 1 })); }
  function toggleVeQuem(id) { setCompartilhadoCom((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  const outrasPessoas = perfis.filter((p) => p.id !== (perfil && perfil.id));
  const participantes = perfis.filter((p) => (partes[p.id] || 0) > 0).map((p) => ({ id: p.id, partes: partes[p.id] }));
  const totalPartes = participantes.reduce((s, p) => s + p.partes, 0);
  const valorNum = parseFloat((valor || '').replace(',', '.'));
  const valido = valorNum > 0 && pagoPor && participantes.length > 0;
  const falta = !(valorNum > 0) ? 'Falta o valor.' : !pagoPor ? 'Escolhe quem pagou.' : participantes.length === 0 ? 'Marca pelo menos uma pessoa em "Dividir entre".' : '';
  const fmt = (v, m) => (m === 'USD' ? fmtUSD(v) : fmtBRL(v));
  // conversão aproximada, só informativa (mesmo câmbio da viagem)
  const conversao = comDolar && cambio > 0 && valorNum > 0 ? (moeda === 'USD' ? `≈ ${fmtBRL(valorNum * cambio)}` : `≈ ${fmtUSD(valorNum / cambio)}`) : '';

  function preencher(d) {
    if (d.valor != null) setValor(String(d.valor).replace('.', ','));
    if (d.moeda) setMoeda(d.moeda === 'BRL' ? 'BRL' : 'USD');
    if (d.data) { setData(d.data); if (d.data !== hoje()) setDetalhes(true); }
    if (d.estabelecimento) setDescricao(d.estabelecimento);
    if (d.categoria && CATEGORIAS.some((c) => c.id === d.categoria)) setCategoria(d.categoria);
  }

  async function aoEscolherRecibo(e) {
    const file = e.target.files && e.target.files[0];
    const input = e.target;
    if (!file) return;
    setAvisoRecibo('');
    try {
      const { blob, base64 } = await reduzirImagem(file);
      setReciboBlob(blob); setReciboBase64(base64);
      setReciboPreview(URL.createObjectURL(blob));
      setRemoverRecibo(false);
    } catch (err) {
      setAvisoRecibo('Não consegui abrir essa imagem: ' + err.message);
    } finally { if (input) input.value = ''; }
  }
  function tirarComprovante() {
    setReciboBlob(null); setReciboBase64(null); setReciboPreview(null);
    setRemoverRecibo(true); setAvisoRecibo('');
  }
  // Opcional: a IA lê a foto e preenche valor, data, loja e categoria (a pessoa confere antes de salvar)
  async function lerComIA() {
    if (!reciboBase64) return;
    setLendoRecibo(true); setAvisoRecibo('');
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess && sess.session ? sess.session.access_token : null;
      const r = await fetch('/api/ia', { method: 'POST', headers: { 'content-type': 'application/json', authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ modo: 'recibo', base64: reciboBase64, mime: 'image/jpeg' }) });
      const j = await r.json().catch(() => null);
      if (j && j.ok && j.dados && (j.dados.valor || j.dados.estabelecimento)) {
        preencher(j.dados);
        setAvisoRecibo('✓ Preenchi pelo comprovante — confere os valores antes de salvar.');
      } else setAvisoRecibo('Não consegui ler os dados dessa foto. Preenche à mão. ' + ((j && j.erro) || ''));
    } catch (err) { setAvisoRecibo('Sem resposta da IA agora. Preenche à mão.'); }
    finally { setLendoRecibo(false); }
  }

  function voltar() { setGastoEditando(null); ir(ed ? 'gastos' : 'resumo'); }

  async function salvar() {
    if (!valido || salvando || salvo) return;
    setSalvando(true); setErro('');
    try {
      const payload = { descricao: descricao.trim() || nomeDe(categoria), valor: valorNum, moeda, categoria, pagoPor, pontoId, data, participantes, reciboFile: reciboBlob, privado, compartilhadoCom };
      if (ed) await atualizarGasto({ id: ed.id, ...payload, reciboUrlAtual: ed.recibo_url, removerRecibo, userIdAtual: ed.user_id });
      else await salvarGasto(payload);
      // feedback rápido de sucesso antes de trocar de tela
      setSalvo(true);
      setTimeout(() => { setGastoEditando(null); ir('gastos'); }, 550);
    } catch (e) { setErro('Não consegui salvar: ' + e.message); setSalvando(false); }
  }

  const mostrando = reciboPreview || (!removerRecibo && reciboAtualUrl);
  const temSalvo = !!(ed && ed.recibo_url) && !removerRecibo && !reciboPreview;
  const resumoDetalhes = [
    dataCurta(data),
    pontoId ? (pontos.find((p) => p.id === pontoId)?.nome || 'ponto do roteiro') : null,
    privado ? '🔒 restrito' : 'todo mundo vê',
  ].filter(Boolean).join(' · ');

  return (
    <div className="ui-screen" style={{ paddingBottom: 12 }}>
      <PageHeader
        titulo={ed ? 'Editar gasto' : 'Novo gasto'}
        subtitulo={ed ? 'Mexe no que precisar e salva.' : 'Valor, descrição e pronto — o resto é opcional.'}
        onVoltar={voltar}
        compacto
      />

      <input ref={inputCamera} type="file" accept="image/*" capture="environment" onChange={aoEscolherRecibo} style={{ display: 'none' }} />
      <input ref={inputGaleria} type="file" accept="image/*" onChange={aoEscolherRecibo} style={{ display: 'none' }} />

      {/* Comprovante (compacto): quem racha o gasto vê a foto na lista (📎). Com foto, a IA pode preencher o resto. */}
      <div className="ui-card-tight" style={{ padding: '12px 14px', marginBottom: 16 }}>
        {mostrando ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <a href={mostrando} target="_blank" rel="noreferrer" aria-label="Abrir comprovante em tamanho grande" style={{ flex: '0 0 auto', display: 'block' }}>
              <img src={mostrando} alt="Comprovante" style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 12, display: 'block', background: 'var(--ui-sunken)' }} />
            </a>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ui-label" style={{ margin: '0 0 6px' }}>Comprovante{temSalvo ? ' · salvo' : ''}</div>
              {reciboBase64 && (
                <Button variant="soft" full onClick={lerComIA} disabled={lendoRecibo} style={{ marginBottom: 6 }}>{lendoRecibo ? 'Lendo a foto…' : '✨ Preencher pela foto'}</Button>
              )}
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="ui-btn ui-btn-ghost" style={{ flex: 1, minHeight: 40, fontSize: 13 }} onClick={() => inputGaleria.current && inputGaleria.current.click()}>🔄 Trocar</button>
                <button className="ui-btn ui-btn-ghost" style={{ flex: 1, minHeight: 40, fontSize: 13, color: 'var(--ui-muted)' }} onClick={tirarComprovante}>✕ Remover</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 130px', minWidth: 0 }}>
              <div className="ui-label" style={{ margin: 0 }}>Comprovante <span style={{ fontWeight: 500, color: 'var(--ui-faint)', letterSpacing: 0 }}>· opcional</span></div>
              <div className="ui-caption" style={{ marginTop: 2 }}>{perfis.length > 1 ? 'Quem racha vê a foto. A IA preenche os campos pra você.' : 'A IA lê a nota e preenche os campos.'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
              <Button variant="secondary" onClick={() => inputCamera.current && inputCamera.current.click()} aria-label="Tirar foto do comprovante">📷 Foto</Button>
              <Button variant="secondary" onClick={() => inputGaleria.current && inputGaleria.current.click()} aria-label="Escolher comprovante da galeria">🖼️ Galeria</Button>
            </div>
          </div>
        )}
        {avisoRecibo && <div className={avisoRecibo.startsWith('✓') ? 'ui-success' : 'ui-error'} style={{ margin: '10px 0 0' }}>{avisoRecibo}</div>}
      </div>

      {/* 1. Valor (+ moeda) — o campo que a pessoa mais quer preencher */}
      <Field label="Valor" hint={conversao || undefined}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input className="ui-input ui-num" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" autoFocus={!ed} aria-label="Valor" style={{ ...VALOR_INPUT, flex: 1, minWidth: 0 }} />
          {comDolar && (
            <div className="ui-seg" role="tablist" aria-label="Moeda" style={{ flex: '0 0 auto', width: 132, alignItems: 'stretch' }}>
              <button role="tab" aria-selected={moeda === 'USD'} className={moeda === 'USD' ? 'on' : ''} onClick={() => setMoeda('USD')} style={{ minHeight: 0 }}>US$</button>
              <button role="tab" aria-selected={moeda === 'BRL'} className={moeda === 'BRL' ? 'on' : ''} onClick={() => setMoeda('BRL')} style={{ minHeight: 0 }}>R$</button>
            </div>
          )}
        </div>
      </Field>

      {/* 2. Descrição */}
      <Field label="Descrição">
        <input className="ui-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={`Ex.: Jantar no restaurante (vazio = "${nomeDe(categoria)}")`} />
      </Field>

      {/* 3. Categoria */}
      <Field label="Categoria">
        <select className="ui-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>))}
        </select>
      </Field>

      {/* 4. Quem pagou (default: eu) */}
      <div className="ui-field">
        <label className="ui-label">Quem pagou</label>
        <div className="ui-chips-scroll" role="radiogroup" aria-label="Quem pagou" style={{ paddingBottom: 2 }}>
          {perfis.map((p) => (
            <button key={p.id} role="radio" aria-checked={pagoPor === p.id} className={'ui-chipbtn' + (pagoPor === p.id ? ' on' : '')} onClick={() => setPagoPor(p.id)}>
              {p.nome}{perfil && p.id === perfil.id ? ' (você)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Dividir entre (default: eu) */}
      <div className="ui-field">
        <label className="ui-label">Dividir entre</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 8 }}>
          {perfis.map((p) => {
            const n = partes[p.id] || 0;
            const ativo = n > 0;
            return (
              <button key={p.id} type="button" onClick={() => togglePessoa(p.id)} aria-pressed={ativo} className="ui-press" style={{
                ...PESSOA_BTN,
                background: ativo ? 'var(--ui-teal-soft)' : 'var(--ui-card)',
                border: ativo ? '1px solid transparent' : '1px solid var(--ui-line-strong)',
                color: ativo ? 'var(--ui-teal-ink)' : 'var(--ui-ink)',
              }}>
                <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', background: ativo ? 'var(--ui-teal)' : (p.cor || 'var(--ui-faint)'), color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{ativo ? '✓' : p.nome.slice(0, 2).toUpperCase()}</span>
                <span className="ui-clamp1" style={{ fontSize: 11.5, fontWeight: 700, maxWidth: '100%', lineHeight: 1.15 }}>{p.nome}{n > 1 ? ` ×${n}` : ''}</span>
              </button>
            );
          })}
        </div>
        <div className="ui-hint">
          {participantes.length === 0
            ? 'Toque em quem participa desse gasto.'
            : participantes.length === 1
              ? (perfil && participantes[0].id === perfil.id ? 'Só você. Toque em quem mais participa — a divisão é igual entre os marcados.' : 'Uma pessoa só. Toque em quem mais participa.')
              : `${participantes.length} pessoas${valorNum > 0 && totalPartes > 0 ? ` · ${fmt(valorNum / totalPartes, moeda)} por parte` : ''}.`}
        </div>
      </div>

      {/* Opcionais: data, ponto do roteiro, visibilidade */}
      <button type="button" onClick={() => setDetalhes((v) => !v)} aria-expanded={detalhes} className="ui-btn ui-btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '0 4px', borderRadius: 12 }}>
        <span style={{ flex: '0 0 auto' }}>{detalhes ? '− menos detalhes' : '+ mais detalhes'}</span>
        {!detalhes && <span className="ui-caption ui-clamp1" style={{ fontWeight: 500, flex: '1 1 0', minWidth: 0, textAlign: 'right' }}>{resumoDetalhes}</span>}
      </button>
      <Expand aberto={detalhes}>
        <div style={{ paddingTop: 10 }}>
          <Field label="Data">
            <input className="ui-input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          {pontos.length > 0 && (
            <Field label="Ponto do roteiro" opcional>
              <select className="ui-input" value={pontoId} onChange={(e) => setPontoId(e.target.value)}>
                <option value="">Nenhum</option>
                {pontos.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
              </select>
            </Field>
          )}
          <div className="ui-field">
            <label className="ui-label">Visibilidade</label>
            <div className="ui-seg" role="tablist" aria-label="Visibilidade">
              <button role="tab" aria-selected={!privado} className={!privado ? 'on' : ''} onClick={() => setPrivado(false)}>👥 Todo mundo vê</button>
              <button role="tab" aria-selected={privado} className={privado ? 'on' : ''} onClick={() => setPrivado(true)}>🔒 Restrito</button>
            </div>
            <Expand aberto={privado}>
              <div style={{ paddingTop: 10 }}>
                <div className="ui-caption" style={{ marginBottom: 8 }}>Só você vê por padrão. Toque em quem mais pode ver esse gasto:</div>
                {outrasPessoas.length === 0 && <div className="ui-caption ui-faint">Não tem mais ninguém nessa viagem ainda.</div>}
                <div className="chips">
                  {outrasPessoas.map((p) => {
                    const ativo = compartilhadoCom.includes(p.id);
                    return (
                      <button key={p.id} className={'chip' + (ativo ? ' on' : '')} aria-pressed={ativo} onClick={() => toggleVeQuem(p.id)}>{ativo ? '✓ ' : ''}{p.nome}</button>
                    );
                  })}
                </div>
              </div>
            </Expand>
          </div>
        </div>
      </Expand>

      {/* Ação primária fixa no rodapé (essa tela não tem barra de navegação) */}
      <div style={BARRA_FIXA}>
        {erro && <div className="ui-error" role="alert" style={{ margin: '0 0 8px' }}>{erro}</div>}
        <Button size="lg" full onClick={salvar} disabled={!valido || salvando || salvo} style={salvo ? { background: 'var(--ui-credit)', opacity: 1 } : undefined}>
          {salvo ? '✓ Salvo!' : salvando ? 'Salvando…' : ed ? 'Salvar alterações' : 'Salvar gasto'}
        </Button>
        {!valido && !salvo && <div className="ui-caption" style={{ textAlign: 'center', marginTop: 8 }}>{falta}</div>}
      </div>
    </div>
  );
}

function reduzirImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1200;
      let w = img.width, h = img.height;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => { resolve({ blob, base64: String(reader.result).split(',')[1], mediaType: 'image/jpeg' }); URL.revokeObjectURL(url); };
        reader.onerror = () => reject(new Error('Falha ao ler imagem'));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.7);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Formato de imagem não suportado')); };
    img.src = url;
  });
}
function hoje() { return hojeLocal(); }
function nomeDe(catId) { const c = CATEGORIAS.find((x) => x.id === catId); return c ? c.nome : 'Gasto'; }

'use client';
import { useState, useRef, useEffect } from 'react';
import { useData } from '../DataProvider';
import { supabase } from '../../lib/supabaseClient';
import { CATEGORIAS, hojeLocal, usaDolar } from '../../lib/format';

export default function Novo({ ir }) {
  const { viagem, perfis, pontos, perfil, divisoes, gastoVistoPor, salvarGasto, atualizarGasto, gastoEditando, setGastoEditando, urlRecibo } = useData();
  const ed = gastoEditando;
  const inputCamera = useRef(null);
  const inputGaleria = useRef(null);
  const comDolar = usaDolar(viagem);

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
  const [salvando, setSalvando] = useState(false);
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
  const valorNum = parseFloat((valor || '').replace(',', '.'));
  const valido = valorNum > 0 && pagoPor && participantes.length > 0;

  function preencher(d) {
    if (d.valor != null) setValor(String(d.valor).replace('.', ','));
    if (d.moeda) setMoeda(d.moeda === 'BRL' ? 'BRL' : 'USD');
    if (d.data) setData(d.data);
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
    if (!valido) return;
    setSalvando(true);
    try {
      const payload = { descricao: descricao.trim() || nomeDe(categoria), valor: valorNum, moeda, categoria, pagoPor, pontoId, data, participantes, reciboFile: reciboBlob, privado, compartilhadoCom };
      if (ed) await atualizarGasto({ id: ed.id, ...payload, reciboUrlAtual: ed.recibo_url, removerRecibo, userIdAtual: ed.user_id });
      else await salvarGasto(payload);
      setGastoEditando(null);
      ir('gastos');
    } catch (e) { alert('Não consegui salvar: ' + e.message); setSalvando(false); }
  }

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back"><button onClick={voltar} aria-label="Voltar">←</button><span className="ttl">{ed ? 'Editar gasto' : 'Novo gasto'}</span></div>

        <input ref={inputCamera} type="file" accept="image/*" capture="environment" onChange={aoEscolherRecibo} style={{ display: 'none' }} />
        <input ref={inputGaleria} type="file" accept="image/*" onChange={aoEscolherRecibo} style={{ display: 'none' }} />

        {/* Comprovante: quem racha o gasto vê a foto na lista (📎) e sabe o que foi pago de fato */}
        {(() => {
          const mostrando = reciboPreview || (!removerRecibo && reciboAtualUrl);
          const temSalvo = !!(ed && ed.recibo_url) && !removerRecibo && !reciboPreview;
          return (
            <div className="field">
              <label>Comprovante (recibo / nota) — {perfis.length > 1 ? 'quem racha vê a foto' : 'opcional'}</label>
              {mostrando ? (
                <div style={{ border: '0.5px solid var(--line)', borderRadius: 12, padding: 8, background: 'var(--surface)' }}>
                  <a href={mostrando} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                    <img src={mostrando} alt="Comprovante" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, display: 'block' }} />
                  </a>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button className="btn-outline" style={{ flex: 1, height: 40, fontSize: 13, minWidth: 120 }} onClick={() => inputGaleria.current && inputGaleria.current.click()}>🔄 Trocar foto</button>
                    {reciboBase64 && <button className="btn-outline" style={{ flex: 1, height: 40, fontSize: 13, minWidth: 120 }} onClick={lerComIA} disabled={lendoRecibo}>{lendoRecibo ? 'Lendo…' : '✨ Preencher pela foto'}</button>}
                    <button className="btn-outline" style={{ flex: '0 0 auto', height: 40, fontSize: 13, color: 'var(--faint)', borderColor: 'var(--line-strong)' }} onClick={tirarComprovante}>✕ Remover</button>
                  </div>
                  {temSalvo && <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 6 }}>Comprovante já salvo neste gasto. Toque na imagem pra abrir em tamanho grande.</p>}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => inputCamera.current && inputCamera.current.click()}>📷 Tirar foto</button>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => inputGaleria.current && inputGaleria.current.click()}>🖼️ Da galeria</button>
                </div>
              )}
              {avisoRecibo && <p style={{ fontSize: 12, marginTop: 8, color: avisoRecibo.startsWith('✓') ? 'var(--credit, #0F9D6B)' : 'var(--debit, #C2410C)' }}>{avisoRecibo}</p>}
            </div>
          );
        })()}

        <div className="field"><label>Descrição</label>
          <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Jantar no restaurante" /></div>
        <div className="field"><label>Valor</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={{ flex: 1 }} />
            {comDolar && (
              <div className="toggle" style={{ width: 150 }}>
                <button className={moeda === 'USD' ? 'on' : ''} onClick={() => setMoeda('USD')}>USD</button>
                <button className={moeda === 'BRL' ? 'on' : ''} onClick={() => setMoeda('BRL')}>BRL</button>
              </div>
            )}
          </div>
        </div>
        <div className="field"><label>Categoria</label>
          <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>))}
          </select></div>
        <div className="field"><label>Quem pagou</label>
          <select className="select" value={pagoPor} onChange={(e) => setPagoPor(e.target.value)}>
            {perfis.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
          </select></div>
        {pontos.length > 0 && (
          <div className="field"><label>Ponto do roteiro (opcional)</label>
            <select className="select" value={pontoId} onChange={(e) => setPontoId(e.target.value)}>
              <option value="">—</option>
              {pontos.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
            </select></div>
        )}
        <div className="field"><label>Data</label>
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div className="field"><label>Dividir entre (toque para incluir)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {perfis.map((p) => {
              const ativo = (partes[p.id] || 0) > 0;
              return (
                <div key={p.id} onClick={() => togglePessoa(p.id)} style={{
                  borderRadius: 10, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '7px 3px',
                  background: ativo ? 'var(--credit)' : 'var(--surface)',
                  border: ativo ? '1px solid var(--credit)' : '0.5px solid var(--line-strong)',
                  transition: 'background .15s, border-color .15s'
                }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: ativo ? 'rgba(255,255,255,.28)' : (p.cor || 'var(--brand)'), color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>{p.nome.slice(0, 2).toUpperCase()}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ativo ? '#fff' : 'var(--ink)', textAlign: 'center', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.nome}</span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 10 }}>Por padrão só você fica marcado. Toque em quem mais participa desse gasto — a divisão é igual entre os selecionados.</p>
        </div>
        <div className="field"><label>Visibilidade</label>
          <div className="toggle">
            <button className={!privado ? 'on' : ''} onClick={() => setPrivado(false)}>👥 Todo mundo vê</button>
            <button className={privado ? 'on' : ''} onClick={() => setPrivado(true)}>🔒 Restrito</button>
          </div>
          {privado && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--faint)', marginBottom: 8 }}>Só você vê por padrão. Toque em quem mais da viagem pode ver esse gasto (opcional):</p>
              {outrasPessoas.length === 0 && <p style={{ fontSize: 12, color: 'var(--faint)' }}>Não tem mais ninguém nessa viagem ainda.</p>}
              {outrasPessoas.map((p) => {
                const ativo = compartilhadoCom.includes(p.id);
                return (
                  <button key={p.id} className={'chip' + (ativo ? ' on' : '')} onClick={() => toggleVeQuem(p.id)} style={{ marginRight: 8, marginBottom: 8 }}>
                    {ativo ? '✓ ' : ''}{p.nome}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={salvar} disabled={!valido || salvando}>{salvando ? 'Salvando…' : ed ? 'Salvar alterações' : 'Salvar gasto'}</button>
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

'use client';
import { useState, useRef } from 'react';
import { useData } from '../DataProvider';
import { CATEGORIAS } from '../../lib/format';

export default function Novo({ ir }) {
  const { perfis, pontos, perfil, divisoes, salvarGasto, atualizarGasto, gastoEditando, setGastoEditando } = useData();
  const ed = gastoEditando;
  const inputRecibo = useRef(null);

  const [descricao, setDescricao] = useState(ed ? (ed.descricao || '') : '');
  const [valor, setValor] = useState(ed ? String(ed.valor).replace('.', ',') : '');
  const [moeda, setMoeda] = useState(ed ? ed.moeda : 'USD');
  const [categoria, setCategoria] = useState(ed ? ed.categoria : 'comida');
  const [pagoPor, setPagoPor] = useState(ed ? ed.pago_por : (perfil?.id || (perfis[0] && perfis[0].id)));
  const [pontoId, setPontoId] = useState(ed ? (ed.ponto_id || '') : '');
  const [data, setData] = useState(ed ? ed.data : hoje());
  const [partes, setPartes] = useState(() => {
    const init = {};
    perfis.forEach((p) => { init[p.id] = ed ? 0 : 1; });
    if (ed) { divisoes.filter((d) => d.gasto_id === ed.id).forEach((d) => { init[d.perfil_id] = Number(d.partes) || 1; }); }
    return init;
  });
  const [salvando, setSalvando] = useState(false);
  const [reciboBlob, setReciboBlob] = useState(null);
  const [reciboPreview, setReciboPreview] = useState(null);
  const [lendoRecibo, setLendoRecibo] = useState(false);

  function togglePessoa(id) { setPartes((prev) => ({ ...prev, [id]: prev[id] > 0 ? 0 : 1 })); }
  function mudarPartes(id, delta) { setPartes((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) })); }
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
    if (!file) return;
    setLendoRecibo(true);
    try {
      const { blob, base64, mediaType } = await reduzirImagem(file);
      setReciboBlob(blob);
      setReciboPreview(URL.createObjectURL(blob));
      const r = await fetch('/api/recibo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ imageBase64: base64, mediaType }) });
      const j = await r.json();
      if (j.ok && j.dados) preencher(j.dados);
      else alert('A foto foi anexada, mas não consegui ler os dados. Preencha à mão. ' + (j.erro || ''));
    } catch (err) {
      alert('Erro ao processar a foto: ' + err.message);
    } finally {
      setLendoRecibo(false);
      if (inputRecibo.current) inputRecibo.current.value = '';
    }
  }

  function voltar() { setGastoEditando(null); ir(ed ? 'gastos' : 'resumo'); }

  async function salvar() {
    if (!valido) return;
    setSalvando(true);
    try {
      const payload = { descricao: descricao.trim() || nomeDe(categoria), valor: valorNum, moeda, categoria, pagoPor, pontoId, data, participantes, reciboFile: reciboBlob };
      if (ed) await atualizarGasto({ id: ed.id, ...payload, reciboUrlAtual: ed.recibo_url });
      else await salvarGasto(payload);
      setGastoEditando(null);
      ir('gastos');
    } catch (e) { alert('Não consegui salvar: ' + e.message); setSalvando(false); }
  }

  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back"><button onClick={voltar} aria-label="Voltar">←</button><span className="ttl">{ed ? 'Editar gasto' : 'Novo gasto'}</span></div>

        <input ref={inputRecibo} type="file" accept="image/*" capture="environment" onChange={aoEscolherRecibo} style={{ display: 'none' }} />
        <button className="btn-outline" style={{ marginBottom: 16 }} onClick={() => inputRecibo.current && inputRecibo.current.click()} disabled={lendoRecibo}>
          {lendoRecibo ? 'Lendo o recibo…' : '📷 Ler recibo com foto'}
        </button>
        {reciboPreview && <div style={{ marginBottom: 16 }}><img src={reciboPreview} alt="Recibo" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 10, border: '0.5px solid var(--line)' }} /></div>}
        {!reciboPreview && ed && ed.recibo_url && <p style={{ fontSize: 12, marginBottom: 16 }}><a href={ed.recibo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>📎 Ver recibo anexado</a></p>}

        <div className="field"><label>Descrição</label>
          <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Jantar no restaurante" /></div>
        <div className="field"><label>Valor</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={{ flex: 1 }} />
            <div className="toggle" style={{ width: 150 }}>
              <button className={moeda === 'USD' ? 'on' : ''} onClick={() => setMoeda('USD')}>USD</button>
              <button className={moeda === 'BRL' ? 'on' : ''} onClick={() => setMoeda('BRL')}>BRL</button>
            </div>
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
        <div className="field"><label>Dividir entre (toque para incluir, ajuste as partes)</label>
          {perfis.map((p) => {
            const ativo = (partes[p.id] || 0) > 0;
            return (
              <div className="partes" key={p.id}>
                <button className={'chip' + (ativo ? ' on' : '')} onClick={() => togglePessoa(p.id)} style={{ minWidth: 120, textAlign: 'left' }}>{p.nome}</button>
                {ativo && (<div className="stepper"><button onClick={() => mudarPartes(p.id, -1)} aria-label="Menos">−</button><span className="n">{partes[p.id]}</span><button onClick={() => mudarPartes(p.id, 1)} aria-label="Mais">+</button></div>)}
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: 'var(--faint)', marginTop: 8 }}>Partes diferentes = divisão proporcional. Ex.: 2 e 1 = um paga o dobro do outro.</p>
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
function hoje() { return new Date().toISOString().slice(0, 10); }
function nomeDe(catId) { const c = CATEGORIAS.find((x) => x.id === catId); return c ? c.nome : 'Gasto'; }

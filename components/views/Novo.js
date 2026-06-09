'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { CATEGORIAS } from '../../lib/format';
export default function Novo({ ir }) {
  const { perfis, pontos, perfil, salvarGasto } = useData();
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [moeda, setMoeda] = useState('USD');
  const [categoria, setCategoria] = useState('comida');
  const [pagoPor, setPagoPor] = useState(perfil?.id || (perfis[0] && perfis[0].id));
  const [pontoId, setPontoId] = useState('');
  const [data, setData] = useState(hoje());
  const [partes, setPartes] = useState(() => { const init = {}; perfis.forEach((p) => { init[p.id] = 1; }); return init; });
  const [salvando, setSalvando] = useState(false);
  function togglePessoa(id) { setPartes((prev) => ({ ...prev, [id]: prev[id] > 0 ? 0 : 1 })); }
  function mudarPartes(id, delta) { setPartes((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) })); }
  const participantes = perfis.filter((p) => (partes[p.id] || 0) > 0).map((p) => ({ id: p.id, partes: partes[p.id] }));
  const valorNum = parseFloat((valor || '').replace(',', '.'));
  const valido = valorNum > 0 && pagoPor && participantes.length > 0;
  async function salvar() {
    if (!valido) return;
    setSalvando(true);
    try {
      await salvarGasto({ descricao: descricao.trim() || nomeDe(categoria), valor: valorNum, moeda, categoria, pagoPor, pontoId, data, participantes });
      ir('gastos');
    } catch (e) { alert('Não consegui salvar: ' + e.message); setSalvando(false); }
  }
  return (
    <div className="app">
      <div className="screen" style={{ paddingTop: 18 }}>
        <div className="fab-back"><button onClick={() => ir('resumo')} aria-label="Voltar">←</button><span className="ttl">Novo gasto</span></div>
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
        <button className="btn-primary" onClick={salvar} disabled={!valido || salvando}>{salvando ? 'Salvando…' : 'Salvar gasto'}</button>
      </div>
    </div>
  );
}
function hoje() { return new Date().toISOString().slice(0, 10); }
function nomeDe(catId) { const c = CATEGORIAS.find((x) => x.id === catId); return c ? c.nome : 'Gasto'; }

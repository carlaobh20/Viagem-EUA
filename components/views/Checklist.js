'use client';
import { useEffect, useState } from 'react';
import { useData } from '../DataProvider';

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

export default function Checklist({ ir }) {
  const { viagem, checklist, adicionarChecklist, alternarChecklist, editarChecklist, removerChecklist, semearChecklist } = useData();
  const [filtro, setFiltro] = useState('todos');
  const [add, setAdd] = useState(null);

  useEffect(() => {
    if (viagem && !viagem.checklist_seed && (checklist || []).length === 0) {
      semearChecklist(TEMPLATE.map(([texto, tema, prazo], i) => ({ texto, tema, prazo, ordem: i })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viagem?.checklist_seed]);

  const itens = checklist || [];
  const visiveis = filtro === 'todos' ? itens : itens.filter((i) => i.prazo === filtro);
  const feitos = visiveis.filter((i) => i.feito).length;
  const total = visiveis.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;

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

    </div>
  );
}

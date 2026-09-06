'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

// Passagem aérea da viagem: ida, volta (e trechos extras, se houver). Tudo o que
// a pessoa precisa no aeroporto num lugar só — localizador, número do pedido,
// voo, horário, assentos e o 0800 da companhia (toca pra ligar).
// Compartilhado: todo mundo da viagem vê e pode editar.

const SENTIDOS = [
  { id: 'ida', label: 'Ida', emoji: '🛫' },
  { id: 'volta', label: 'Volta', emoji: '🛬' },
  { id: 'outro', label: 'Outro trecho', emoji: '✈️' },
];
const nomeSentido = (id) => (SENTIDOS.find((s) => s.id === id) || SENTIDOS[2]);

const VAZIO = { sentido: 'ida', companhia: '', telefone: '', origem: '', destino: '', data: '', hora: '', hora_chegada: '', voo: '', localizador: '', pedido: '', passageiros: '', assentos: '', obs: '' };

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dataBonita(iso) {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return iso;
  const dt = new Date(a, m - 1, d);
  return `${DIAS[dt.getDay()]}, ${d} ${MESES[m - 1]} ${a}`;
}
function diasAte(iso) {
  if (!iso) return null;
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(a, m - 1, d) - hoje) / 86400000);
}
const soDigitos = (t) => String(t || '').replace(/[^\d+]/g, '');

async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch (e) {}
  try {
    const ta = document.createElement('textarea'); ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); return true;
  } catch (e) { return false; }
}

// Fora do componente de propósito: definido lá dentro, o React trataria como
// componente novo a cada tecla e o campo perderia o foco.
const rotulo = { fontSize: 11.5, fontWeight: 700, color: 'var(--ui-muted)', margin: '0 2px 5px', letterSpacing: '.3px' };
const Campo = ({ label, children, meio }) => (
  <div style={{ marginBottom: 12, flex: meio ? 1 : undefined, minWidth: 0 }}><div style={rotulo}>{label}</div>{children}</div>
);

export default function Passagens({ ir }) {
  const { viagem, passagens, adicionarPassagem, editarPassagem, removerPassagem } = useData();
  const [form, setForm] = useState(null);   // null | { id?, ...campos }
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');

  const card = { background: 'var(--ui-card)', borderRadius: 18, boxShadow: 'var(--ui-shadow)' };
  const inp = { width: '100%', border: '1px solid var(--ui-line)', borderRadius: 12, padding: '11px 13px', fontSize: 15, background: 'var(--ui-bg)', color: 'var(--ui-ink)' };

  const lista = passagens || [];
  const ida = lista.filter((p) => p.sentido === 'ida');
  const volta = lista.filter((p) => p.sentido === 'volta');
  const outros = lista.filter((p) => p.sentido !== 'ida' && p.sentido !== 'volta');

  function abrirNova(sentido) {
    // repete companhia e telefone da última cadastrada — quase sempre é a mesma cia na volta
    const ult = lista[lista.length - 1];
    setErro('');
    setForm({ ...VAZIO, sentido, companhia: ult ? ult.companhia || '' : '', telefone: ult ? ult.telefone || '' : '', passageiros: ult ? ult.passageiros || '' : '',
      // na volta, o natural é inverter origem/destino da ida
      origem: sentido === 'volta' && ida[0] ? ida[0].destino || '' : '', destino: sentido === 'volta' && ida[0] ? ida[0].origem || '' : '' });
  }
  function abrirEdicao(p) {
    setErro('');
    const f = { id: p.id };
    for (const k of Object.keys(VAZIO)) f[k] = p[k] == null ? '' : String(p[k]);
    setForm(f);
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function salvar() {
    if (!form) return;
    if (!form.companhia.trim() && !form.localizador.trim() && !form.origem.trim()) { setErro('Preenche pelo menos a companhia, o trecho ou o localizador.'); return; }
    setSalvando(true); setErro('');
    const { id, ...campos } = form;
    const r = id ? await editarPassagem(id, campos) : await adicionarPassagem(campos);
    setSalvando(false);
    if (r && r.erro) { setErro(r.erro); return; }
    setForm(null);
  }
  async function apagar() {
    if (!form || !form.id) return;
    if (!window.confirm('Apagar esta passagem?')) return;
    await removerPassagem(form.id);
    setForm(null);
  }
  async function copiarCampo(valor, chave) {
    if (!valor) return;
    if (await copiar(valor)) { setCopiado(chave); setTimeout(() => setCopiado(''), 1500); }
  }

  const Cartao = ({ p }) => {
    const s = nomeSentido(p.sentido);
    const faltam = diasAte(p.data);
    const tel = soDigitos(p.telefone);
    const Linha = ({ label, valor, chave, mono }) => valor ? (
      <button onClick={() => copiarCampo(valor, chave)} title="Toque pra copiar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', border: 'none', background: 'var(--ui-bg)', borderRadius: 12, padding: '9px 12px', cursor: 'pointer', textAlign: 'left', color: 'var(--ui-ink)' }}>
        <span style={{ fontSize: 11.5, color: 'var(--ui-muted)', fontWeight: 700, flex: '0 0 auto' }}>{label}</span>
        <span style={{ fontSize: mono ? 17 : 14, fontWeight: mono ? 800 : 600, letterSpacing: mono ? '1.5px' : 0, fontFamily: mono ? 'ui-monospace, Menlo, Consolas, monospace' : 'inherit', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{valor}</span>
        <span style={{ fontSize: 11, color: copiado === chave ? 'var(--ui-teal)' : 'var(--ui-faint)', flex: '0 0 auto', minWidth: 46, textAlign: 'right' }}>{copiado === chave ? 'copiado ✓' : 'copiar'}</span>
      </button>
    ) : null;
    return (
      <div style={{ ...card, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22, flex: '0 0 auto' }}>{s.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)' }}>{s.label.toUpperCase()}{p.companhia ? ` · ${p.companhia}` : ''}{p.voo ? ` · voo ${p.voo}` : ''}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ui-muted)', marginTop: 2 }}>
              {dataBonita(p.data)}{p.hora ? ` · ${p.hora}` : ''}{p.hora_chegada ? ` → ${p.hora_chegada}` : ''}
              {faltam != null && faltam >= 0 && <span style={{ marginLeft: 6, fontSize: 11.5, fontWeight: 700, color: faltam <= 1 ? '#C2410C' : 'var(--ui-teal)' }}>{faltam === 0 ? 'é hoje!' : faltam === 1 ? 'é amanhã' : `faltam ${faltam} dias`}</span>}
            </div>
          </div>
          <button onClick={() => abrirEdicao(p)} aria-label="Editar" style={{ border: 'none', background: 'var(--ui-bg)', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 15, flex: '0 0 auto' }}>✏️</button>
        </div>

        {(p.origem || p.destino) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.origem || '—'}</div>
              {p.hora && <div style={{ fontSize: 12, color: 'var(--ui-muted)' }}>sai {p.hora}</div>}
            </div>
            <div style={{ flex: '0 0 auto', color: 'var(--ui-faint)', fontSize: 18 }}>✈︎ →</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.destino || '—'}</div>
              {p.hora_chegada && <div style={{ fontSize: 12, color: 'var(--ui-muted)' }}>chega {p.hora_chegada}</div>}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: 6 }}>
          <Linha label="Localizador" valor={p.localizador} chave={`loc-${p.id}`} mono />
          <Linha label="Nº do pedido" valor={p.pedido} chave={`ped-${p.id}`} mono />
          <Linha label="Passageiros" valor={p.passageiros} chave={`pax-${p.id}`} />
          <Linha label="Assentos" valor={p.assentos} chave={`ass-${p.id}`} />
        </div>
        {p.obs && <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 10, whiteSpace: 'pre-wrap' }}>{p.obs}</div>}

        {p.telefone && (
          <a href={tel ? `tel:${tel}` : undefined} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, borderRadius: 12, padding: '11px 12px', background: 'var(--ui-teal)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            📞 Ligar pra {p.companhia || 'companhia'} · {p.telefone}
          </a>
        )}
      </div>
    );
  };

  const Secao = ({ sentido, itens }) => {
    const s = nomeSentido(sentido);
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 10px' }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--ui-muted)' }}>{s.emoji} {s.label.toUpperCase()}</span>
          {itens.length > 0 && <button onClick={() => abrirNova(sentido)} style={{ border: 'none', background: 'none', color: 'var(--ui-teal)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ outra</button>}
        </div>
        {itens.map((p) => <Cartao key={p.id} p={p} />)}
        {itens.length === 0 && (
          <button onClick={() => abrirNova(sentido)} style={{ ...card, width: '100%', border: '1.5px dashed var(--ui-line)', boxShadow: 'none', background: 'transparent', padding: '18px 14px', cursor: 'pointer', color: 'var(--ui-muted)', fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
            + Adicionar passagem de {s.label.toLowerCase()}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--ui-bg)', minHeight: '100%', padding: '14px 18px 96px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: 'var(--ui-ink)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 2px 16px' }}>
        <button onClick={() => (form ? setForm(null) : ir('menu'))} aria-label="Voltar" style={{ border: 'none', background: 'var(--ui-card)', width: 34, height: 34, borderRadius: 11, boxShadow: 'var(--ui-shadow)', fontSize: 18, cursor: 'pointer', flex: '0 0 auto' }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px' }}>{form ? (form.id ? 'Editar passagem' : 'Nova passagem') : 'Passagem aérea'}</div>
          <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginTop: 1 }}>{form ? 'Copia do e-mail da companhia' : `Ida e volta de ${viagem?.nome || 'toda a família'} · todos veem`}</div>
        </div>
      </div>

      {form ? (
        <div style={{ ...card, padding: 16 }}>
          <div style={rotulo}>TRECHO</div>
          <div className="toggle" style={{ marginBottom: 14 }}>
            {SENTIDOS.map((s) => (
              <button key={s.id} onClick={() => setForm((f) => ({ ...f, sentido: s.id }))} style={form.sentido === s.id ? { background: 'var(--ui-teal)', color: '#fff', fontWeight: 700 } : {}}>{s.emoji} {s.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Campo label="COMPANHIA" meio><input style={inp} value={form.companhia} onChange={set('companhia')} placeholder="LATAM, Azul, Gol…" /></Campo>
            <Campo label="VOO" meio><input style={inp} value={form.voo} onChange={set('voo')} placeholder="LA 8084" /></Campo>
          </div>
          <Campo label="0800 / TELEFONE DA COMPANHIA"><input style={inp} type="tel" value={form.telefone} onChange={set('telefone')} placeholder="0800 123 4567" /></Campo>

          <div style={{ display: 'flex', gap: 10 }}>
            <Campo label="DE ONDE" meio><input style={inp} value={form.origem} onChange={set('origem')} placeholder="GRU · São Paulo" /></Campo>
            <Campo label="PRA ONDE" meio><input style={inp} value={form.destino} onChange={set('destino')} placeholder="MCO · Orlando" /></Campo>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Campo label="DATA" meio><input style={inp} type="date" value={form.data} onChange={set('data')} /></Campo>
            <Campo label="SAÍDA" meio><input style={inp} type="time" value={form.hora} onChange={set('hora')} /></Campo>
            <Campo label="CHEGADA" meio><input style={inp} type="time" value={form.hora_chegada} onChange={set('hora_chegada')} /></Campo>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Campo label="LOCALIZADOR" meio><input style={{ ...inp, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }} value={form.localizador} onChange={(e) => setForm((f) => ({ ...f, localizador: e.target.value.toUpperCase() }))} placeholder="ABC123" autoCapitalize="characters" /></Campo>
            <Campo label="Nº DO PEDIDO" meio><input style={inp} value={form.pedido} onChange={set('pedido')} placeholder="123456789" /></Campo>
          </div>
          <Campo label="PASSAGEIROS"><input style={inp} value={form.passageiros} onChange={set('passageiros')} placeholder="Carlos, Ana, Pedro" /></Campo>
          <Campo label="ASSENTOS"><input style={inp} value={form.assentos} onChange={set('assentos')} placeholder="12A, 12B, 12C" /></Campo>
          <Campo label="OBSERVAÇÕES"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.obs} onChange={set('obs')} placeholder="Bagagem despachada, conexão, terminal…" /></Campo>

          {erro && <div style={{ color: '#C2410C', fontSize: 13, marginBottom: 10 }}>{erro}</div>}
          <button onClick={salvar} disabled={salvando} style={{ width: '100%', border: 'none', borderRadius: 14, padding: 14, background: 'var(--ui-teal)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>{salvando ? 'Salvando…' : 'Salvar passagem'}</button>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={() => setForm(null)} style={{ flex: 1, border: '1px solid var(--ui-line)', borderRadius: 14, padding: 12, background: 'transparent', color: 'var(--ui-muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            {form.id && <button onClick={apagar} style={{ flex: 1, border: 'none', borderRadius: 14, padding: 12, background: 'rgba(194,65,12,.1)', color: '#C2410C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Apagar</button>}
          </div>
        </div>
      ) : (
        <>
          <Secao sentido="ida" itens={ida} />
          <Secao sentido="volta" itens={volta} />
          {outros.length > 0 && <Secao sentido="outro" itens={outros} />}
          {outros.length === 0 && (
            <button onClick={() => abrirNova('outro')} style={{ border: 'none', background: 'none', color: 'var(--ui-muted)', fontSize: 13, cursor: 'pointer', padding: '4px 4px 0' }}>+ tem conexão ou outro trecho? adicionar</button>
          )}
          <div style={{ fontSize: 12, color: 'var(--ui-faint)', marginTop: 18, padding: '0 4px', lineHeight: 1.4 }}>Toque no localizador ou no nº do pedido pra copiar. O botão de telefone liga direto pra companhia.</div>
        </>
      )}
    </div>
  );
}

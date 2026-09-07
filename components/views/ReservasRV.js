'use client';
import { useState, useRef } from 'react';
import { useData } from '../DataProvider';
import { fmtBRL, fmtUSD, dataLocal } from '../../lib/format';

// Aba "RV Parks" do Motorhome: uma reserva por camping, noite a noite, com o
// comprovante anexado (o arquivo também aparece em Menu → Documentos, tipo
// Motorhome). Mostra quais noites do período do motorhome ainda estão sem reserva.

const STATUS = [
  { id: 'a_reservar', nome: 'A reservar', cor: '#A32D2D', bg: '#FCEBEB' },
  { id: 'reservado', nome: 'Reservado', cor: '#854F0B', bg: '#FAEEDA' },
  { id: 'pago', nome: 'Pago', cor: '#0F6E56', bg: '#E1F5EE' },
];
const st = (id) => STATUS.find((s) => s.id === id) || STATUS[1];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function d(iso) { const [a, m, dd] = String(iso || '').slice(0, 10).split('-').map(Number); return a && m && dd ? new Date(a, m - 1, dd) : null; }
function fmtD(iso) { const x = d(iso); return x ? `${DIAS[x.getDay()]} ${String(x.getDate()).padStart(2, '0')}/${MESES[x.getMonth()]}` : '—'; }
function somar(iso, n) { const x = d(iso); if (!x) return ''; x.setDate(x.getDate() + n); return dataLocal(x); }
function noites(a, b) { const x = d(a), y = d(b); return x && y ? Math.max(0, Math.round((y - x) / 86400000)) : 0; }
const soDigitos = (t) => String(t || '').replace(/[^\d+]/g, '');
const urlMaps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const TAM_MAX = 20 * 1024 * 1024;
const ehPdf = (m) => m === 'application/pdf';
const ehImagem = (m) => /^image\//.test(m || '');
function fmtTamanho(b) { if (!b) return ''; return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`; }
function reduzirImagem(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1800; const esc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error('imagem')); }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Formato não suportado')); };
    img.src = url;
  });
}
async function copiar(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }

const VAZIO = { nome: '', checkin: '', checkout: '', endereco: '', telefone: '', confirmacao: '', valor: '', moeda: 'USD', status: 'reservado', obs: '', pendentes: [] };

export default function ReservasRV() {
  const { viagem, reservasRv, documentos, adicionarReservaRv, editarReservaRv, removerReservaRv, removerArquivoDocumento, urlArquivoDocumento } = useData();
  const inputArq = useRef(null);
  const inputFoto = useRef(null);
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');
  const [abrindo, setAbrindo] = useState('');

  const lista = (reservasRv || []).slice().sort((a, b) => String(a.checkin || '9') < String(b.checkin || '9') ? -1 : 1);
  const docDe = (r) => (documentos || []).find((x) => x.id === r.documento_id);
  const arquivosDe = (r) => (docDe(r) || {}).arquivos || [];

  // ---- noites do período do motorhome (ou da viagem) e quais estão cobertas ----
  const ini = viagem.mh_retirada || viagem.data_ida;
  const fim = viagem.mh_entrega || viagem.data_volta;
  const totalNoites = ini && fim ? noites(ini, fim) : 0;
  const cobertura = [];
  for (let i = 0; i < totalNoites; i++) {
    const noite = somar(ini, i);
    const r = lista.find((x) => x.checkin && x.checkout && x.checkin <= noite && noite < x.checkout);
    cobertura.push({ noite, r });
  }
  const cobertas = cobertura.filter((n) => n.r).length;
  // buracos agrupados em faixas (ex.: 25/09 → 27/09, 2 noites)
  const buracos = [];
  cobertura.forEach((n) => {
    if (n.r) return;
    const ult = buracos[buracos.length - 1];
    if (ult && somar(ult.ate, 1) === n.noite) ult.ate = n.noite; else buracos.push({ de: n.noite, ate: n.noite });
  });
  const custo = lista.reduce((acc, r) => { if (r.valor != null) acc[r.moeda === 'BRL' ? 'BRL' : 'USD'] += Number(r.valor); return acc; }, { USD: 0, BRL: 0 });

  function abrirNovo(de, ate) { setErro(''); setForm({ ...VAZIO, checkin: de || '', checkout: ate ? somar(ate, 1) : (de ? somar(de, 1) : '') }); }
  function abrirEdicao(r) {
    setErro('');
    const f = { id: r.id, pendentes: [] };
    for (const k of Object.keys(VAZIO)) if (k !== 'pendentes') f[k] = r[k] == null ? '' : String(r[k]);
    f.moeda = r.moeda === 'BRL' ? 'BRL' : 'USD'; f.status = r.status || 'reservado';
    setForm(f);
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function aoEscolher(e) {
    const files = Array.from(e.target.files || []); const input = e.target;
    if (!files.length) return;
    const novos = [], recusados = [];
    for (const file of files) {
      try {
        let blob = file, mime = file.type || '';
        if (ehImagem(mime)) { blob = await reduzirImagem(file); mime = 'image/jpeg'; }
        else if (!ehPdf(mime)) { recusados.push(file.name); continue; }
        if (blob.size > TAM_MAX) { recusados.push(file.name + ' (>20 MB)'); continue; }
        novos.push({ file: blob, mime, nome: file.name || 'reserva.pdf', chave: Math.random().toString(36).slice(2) });
      } catch (err) { recusados.push(file.name); }
    }
    setErro(recusados.length ? 'Não entrou (só PDF ou foto): ' + recusados.join(', ') : '');
    setForm((f) => ({ ...f, pendentes: [...f.pendentes, ...novos] }));
    if (input) input.value = '';
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Dá o nome do RV park.'); return; }
    if (form.checkin && form.checkout && form.checkout <= form.checkin) { setErro('O check-out tem que ser depois do check-in.'); return; }
    setSalvando(true); setErro('');
    const { id, pendentes, ...campos } = form;
    const r = id ? await editarReservaRv(id, campos, pendentes) : await adicionarReservaRv(campos, pendentes);
    setSalvando(false);
    if (r && r.erro) { setErro(r.erro); return; }
    if (r && r.aviso) window.alert(r.aviso);
    setForm(null);
  }
  async function apagar(r) {
    if (!window.confirm(`Apagar a reserva "${r.nome}"${arquivosDe(r).length ? ' e o documento anexado' : ''}?`)) return;
    await removerReservaRv(r); setForm(null);
  }
  async function abrir(a, baixar) {
    setAbrindo(a.id + (baixar ? 'b' : 'a'));
    const aba = !baixar && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    const u = await urlArquivoDocumento(a, baixar);
    setAbrindo('');
    if (!u) { if (aba) aba.close(); window.alert('Não consegui abrir o arquivo agora.'); return; }
    if (aba) aba.location.href = u; else window.location.href = u;
  }
  async function copiarConf(r) { if (r.confirmacao && await copiar(r.confirmacao)) { setCopiado(r.id); setTimeout(() => setCopiado(''), 1500); } }

  const inp = { width: '100%', border: '0.5px solid var(--line-strong)', borderRadius: 10, padding: '10px 12px', fontSize: 14, background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit' };
  const rot = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 };
  const chip = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' };

  const Arquivos = ({ r, podeRemover }) => {
    const arqs = arquivosDe(r);
    if (!arqs.length) return null;
    return (
      <div style={{ marginTop: 8, borderTop: '0.5px solid var(--line)', paddingTop: 6 }}>
        {arqs.map((a) => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, padding: '5px 0' }}>
            <span style={{ fontSize: 16 }}>{ehPdf(a.mime) ? '📕' : '🖼️'}</span>
            <div style={{ minWidth: 0 }}>
              <div onClick={() => abrir(a, false)} style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere', cursor: 'pointer', lineHeight: 1.25 }}>{a.nome || 'reserva'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>{ehPdf(a.mime) ? 'PDF' : 'foto'}{a.tamanho ? ` · ${fmtTamanho(a.tamanho)}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => abrir(a, false)} style={{ ...chip, background: 'var(--brand)', color: '#fff', padding: '5px 10px' }}>{abrindo === a.id + 'a' ? '…' : 'Abrir'}</button>
              <button onClick={() => abrir(a, true)} aria-label="Baixar" style={{ ...chip, background: 'var(--brand-soft)', color: 'var(--brand)', padding: '5px 9px' }}>⬇</button>
              {podeRemover && <button onClick={() => { if (window.confirm('Remover este arquivo?')) removerArquivoDocumento(a); }} aria-label="Remover" style={{ border: 'none', background: 'none', color: 'var(--faint)', fontSize: 13, cursor: 'pointer', padding: '0 2px' }}>✕</button>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (form) {
    const docEd = form.id ? lista.find((x) => x.id === form.id) : null;
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{form.id ? 'Editar reserva' : 'Nova reserva de RV park'}</div>
        <div className="field"><label style={rot}>RV park / camping</label><input style={inp} value={form.nome} onChange={set('nome')} placeholder="Ex.: Orlando / Kissimmee KOA" /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="field" style={{ flex: 1 }}><label style={rot}>Check-in</label><input style={inp} type="date" value={form.checkin} onChange={set('checkin')} /></div>
          <div className="field" style={{ flex: 1 }}><label style={rot}>Check-out</label><input style={inp} type="date" value={form.checkout} onChange={set('checkout')} /></div>
        </div>
        {form.checkin && form.checkout && noites(form.checkin, form.checkout) > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: -6, marginBottom: 12 }}>{noites(form.checkin, form.checkout)} noite{noites(form.checkin, form.checkout) === 1 ? '' : 's'}</div>}
        <div className="field"><label style={rot}>Status</label>
          <div className="toggle">{STATUS.map((s) => <button key={s.id} onClick={() => setForm({ ...form, status: s.id })} className={form.status === s.id ? 'on' : ''} style={form.status === s.id ? { background: s.cor, color: '#fff', fontWeight: 700 } : {}}>{s.nome}</button>)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="field" style={{ flex: 1 }}><label style={rot}>Valor</label><input style={inp} inputMode="decimal" value={form.valor} onChange={set('valor')} placeholder="0,00" /></div>
          <div className="field" style={{ width: 130 }}><label style={rot}>Moeda</label>
            <div className="toggle"><button className={form.moeda === 'USD' ? 'on' : ''} onClick={() => setForm({ ...form, moeda: 'USD' })}>US$</button><button className={form.moeda === 'BRL' ? 'on' : ''} onClick={() => setForm({ ...form, moeda: 'BRL' })}>R$</button></div>
          </div>
        </div>
        <div className="field"><label style={rot}>Nº da reserva / confirmação</label><input style={inp} value={form.confirmacao} onChange={set('confirmacao')} placeholder="Ex.: KOA-4821903" /></div>
        <div className="field"><label style={rot}>📍 Endereço (pro GPS)</label><input style={inp} value={form.endereco} onChange={set('endereco')} placeholder="Como no Google Maps: rua, número, cidade" /></div>
        <div className="field"><label style={rot}>Telefone do parque</label><input style={inp} type="tel" value={form.telefone} onChange={set('telefone')} placeholder="+1 407 …" /></div>
        <div className="field"><label style={rot}>Observações</label><textarea style={{ ...inp, minHeight: 60 }} value={form.obs} onChange={set('obs')} placeholder="Site nº, hookups, horário de chegada, o que levar…" /></div>

        <div className="field"><label style={rot}>Documento da reserva{docEd && arquivosDe(docEd).length ? ` (${arquivosDe(docEd).length} anexado${arquivosDe(docEd).length === 1 ? '' : 's'})` : ''}</label>
          {docEd && <Arquivos r={docEd} podeRemover />}
          {form.pendentes.map((p) => (
            <div key={p.chave} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, padding: '5px 0' }}>
              <span style={{ fontSize: 16 }}>{ehPdf(p.mime) ? '📕' : '🖼️'}</span>
              <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{p.nome}</div><div style={{ fontSize: 10.5, color: 'var(--brand)' }}>novo · {fmtTamanho(p.file.size)}</div></div>
              <button onClick={() => setForm((f) => ({ ...f, pendentes: f.pendentes.filter((x) => x.chave !== p.chave) }))} style={{ border: 'none', background: 'none', color: 'var(--faint)', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn-outline" style={{ flex: 1, height: 42, fontSize: 13 }} onClick={() => inputArq.current && inputArq.current.click()}>📎 PDF / imagem</button>
            <button className="btn-outline" style={{ flex: 1, height: 42, fontSize: 13 }} onClick={() => inputFoto.current && inputFoto.current.click()}>📷 Tirar foto</button>
          </div>
          <input ref={inputArq} type="file" accept="application/pdf,image/*" multiple onChange={aoEscolher} style={{ display: 'none' }} />
          <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={aoEscolher} style={{ display: 'none' }} />
        </div>

        {erro && <div style={{ color: 'var(--debit)', fontSize: 13, marginBottom: 10 }}>{erro}</div>}
        <button className="btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : form.id ? 'Salvar alterações' : 'Salvar reserva'}</button>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setForm(null)}>Cancelar</button>
          {docEd && <button className="btn-ghost" style={{ flex: 1, color: 'var(--debit)' }} onClick={() => apagar(docEd)}>Apagar reserva</button>}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* resumo das noites */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{totalNoites > 0 ? `${cobertas} de ${totalNoites} noites reservadas` : 'Noites do motorhome'}</div>
          {totalNoites > 0 && <span style={{ fontSize: 18, fontWeight: 800, color: cobertas === totalNoites ? 'var(--credit)' : 'var(--brand)' }}>{Math.round((cobertas / totalNoites) * 100)}%</span>}
        </div>
        {totalNoites > 0 ? (
          <>
            <div style={{ height: 8, borderRadius: 5, background: 'var(--line)', overflow: 'hidden', marginTop: 8 }}><div style={{ width: `${(cobertas / totalNoites) * 100}%`, height: '100%', background: cobertas === totalNoites ? 'var(--credit)' : 'var(--brand)', transition: 'width .3s' }} /></div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{fmtD(ini)} → {fmtD(fim)}{(custo.USD > 0 || custo.BRL > 0) ? ` · total ${[custo.USD > 0 ? fmtUSD(custo.USD) : '', custo.BRL > 0 ? fmtBRL(custo.BRL) : ''].filter(Boolean).join(' + ')}` : ''}</div>
            {buracos.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--debit)', marginBottom: 6 }}>⚠️ Sem reserva ainda:</div>
                {buracos.map((b) => {
                  const n = noites(b.de, somar(b.ate, 1));
                  return (
                    <div key={b.de} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 10px', borderRadius: 10, background: 'var(--debit-soft)', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{b.de === b.ate ? `Noite de ${fmtD(b.de)}` : `${fmtD(b.de)} → ${fmtD(b.ate)}`} <span style={{ color: 'var(--muted)' }}>· {n} noite{n === 1 ? '' : 's'}</span></span>
                      <button onClick={() => abrirNovo(b.de, b.ate)} style={{ ...chip, background: 'var(--debit)', color: '#fff', padding: '5px 10px' }}>+ reservar</button>
                    </div>
                  );
                })}
              </div>
            )}
            {buracos.length === 0 && lista.length > 0 && <div style={{ fontSize: 12.5, color: 'var(--credit)', marginTop: 8, fontWeight: 600 }}>✓ Todas as noites têm onde parar.</div>}
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Defina retirada e entrega do motorhome (aba Custos → editar período) pra eu mostrar quais noites faltam reservar.</div>
        )}
      </div>

      <button className="btn-outline" style={{ marginBottom: 14 }} onClick={() => abrirNovo(buracos[0] ? buracos[0].de : '', buracos[0] ? buracos[0].ate : '')}>+ Nova reserva de RV park</button>

      {lista.length === 0 && <div className="card" style={{ marginBottom: 14 }}><div className="empty">Nenhuma reserva ainda. Cadastra cada camping com as datas e anexa o PDF da confirmação — no dia, é só abrir aqui.</div></div>}

      {lista.map((r) => {
        const s = st(r.status);
        const n = noites(r.checkin, r.checkout);
        const arqs = arquivosDe(r);
        const tel = soDigitos(r.telefone);
        return (
          <div key={r.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, overflowWrap: 'anywhere' }}>🏕️ {r.nome}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>{fmtD(r.checkin)} → {fmtD(r.checkout)}{n ? ` · ${n} noite${n === 1 ? '' : 's'}` : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: '0 0 auto' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: s.bg, color: s.cor, fontWeight: 700, whiteSpace: 'nowrap' }}>{s.nome}</span>
                {r.valor != null && <span style={{ fontSize: 13.5, fontWeight: 700 }}>{r.moeda === 'BRL' ? fmtBRL(r.valor) : fmtUSD(r.valor)}</span>}
              </div>
            </div>
            {r.confirmacao && (
              <button onClick={() => copiarConf(r)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', border: 'none', background: 'var(--bg)', borderRadius: 8, padding: '7px 10px', marginTop: 8, cursor: 'pointer', color: 'var(--ink)' }}>
                <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>Nº reserva</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '.5px', fontFamily: 'ui-monospace, Menlo, monospace' }}>{r.confirmacao}</span>
                <span style={{ fontSize: 11, color: copiado === r.id ? 'var(--credit)' : 'var(--faint)' }}>{copiado === r.id ? 'copiado ✓' : 'copiar'}</span>
              </button>
            )}
            {r.endereco && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>📍 {r.endereco}</div>}
            {r.obs && <div style={{ fontSize: 12.5, color: 'var(--ink)', marginTop: 6, whiteSpace: 'pre-wrap', background: 'var(--bg)', borderRadius: 8, padding: '6px 10px' }}>{r.obs}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {r.endereco && <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.endereco)}&travelmode=driving`} target="_blank" rel="noopener noreferrer" style={{ ...chip, background: 'var(--brand)', color: '#fff' }}>🧭 Ir com GPS</a>}
              {r.endereco && <a href={urlMaps(r.endereco)} target="_blank" rel="noopener noreferrer" style={{ ...chip, background: 'var(--brand-soft)', color: 'var(--brand)' }}>Ver no Maps</a>}
              {tel && <a href={`tel:${tel}`} style={{ ...chip, background: 'var(--brand-soft)', color: 'var(--brand)' }}>📞 Ligar</a>}
              <span style={{ flex: 1 }} />
              <button onClick={() => abrirEdicao(r)} style={{ ...chip, background: 'var(--bg)', color: 'var(--ink)' }}>✏️ Editar</button>
            </div>
            <Arquivos r={r} podeRemover={false} />
            {arqs.length === 0 && <button onClick={() => abrirEdicao(r)} style={{ border: 'none', background: 'none', color: 'var(--brand)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '8px 0 0' }}>📎 anexar documento da reserva</button>}
          </div>
        );
      })}

      <p style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.5, padding: '0 4px' }}>
        Compartilhado com todo mundo da viagem. O documento anexado também aparece em Menu → Documentos (tipo Motorhome). Dica: baixa os PDFs antes de pegar a estrada — muito RV park não tem sinal.
      </p>
    </>
  );
}

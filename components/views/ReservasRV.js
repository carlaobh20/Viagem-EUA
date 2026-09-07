'use client';
import { useState, useRef } from 'react';
import { useData } from '../DataProvider';
import { fmtBRL, fmtUSD, dataLocal } from '../../lib/format';
import { Button, Field, EmptyState, Segmented, Expand, ProgressBar } from '../ui';

// Aba "RV Parks" do Motorhome: uma reserva por camping, noite a noite, com o
// comprovante anexado (o arquivo também aparece em Menu → Documentos, tipo
// Motorhome). Mostra quais noites do período do motorhome ainda estão sem reserva.

// Estado da reserva → tom da pílula (cor só quando comunica estado)
const STATUS = [
  { id: 'a_reservar', nome: 'A reservar', pill: 'ui-pill-danger' },
  { id: 'reservado', nome: 'Reservado', pill: 'ui-pill-warning' },
  { id: 'pago', nome: 'Pago', pill: 'ui-pill-success' },
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
// Campos que ficam escondidos atrás de "+ mais detalhes" no formulário
const DETALHES = ['confirmacao', 'endereco', 'telefone', 'obs'];

// Link em forma de botão pequeno (GPS, Maps, ligar) — mesma cara do .ui-btn.
const linkBtn = { textDecoration: 'none' };

// Faixa de aviso inline (substitui os alert() antigos). 'erro' usa .ui-error;
// 'atencao' usa o tom dourado — não existe .ui-warning no design system, por isso inline.
function Aviso({ aviso, onFechar }) {
  const atencao = aviso.tipo === 'atencao';
  return (
    <div className={atencao ? '' : 'ui-error'} style={{ display: 'flex', alignItems: 'center', gap: 8, ...(atencao ? { fontSize: 13, color: 'var(--ui-gold)', background: 'var(--ui-gold-soft)', borderRadius: 12, padding: '10px 12px', margin: '4px 0 12px' } : null) }}>
      <span style={{ flex: 1 }}>{aviso.texto}</span>
      <button onClick={onFechar} aria-label="Fechar" style={{ border: 'none', background: 'transparent', color: 'inherit', fontSize: 14, width: 32, height: 32, marginRight: -8, borderRadius: 8 }}>✕</button>
    </div>
  );
}

// Fora do componente da tela de propósito: definido lá dentro, o React o
// trataria como componente novo a cada render (e remontaria os botões).
function Arquivos({ arqs, podeRemover, abrindo, onAbrir, onRemover }) {
  if (!arqs.length) return null;
  return (
    <div className="ui-list" style={{ marginTop: 10, borderTop: '1px solid var(--ui-line)' }}>
      {arqs.map((a) => (
        <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, padding: '8px 0', minHeight: 52 }}>
          <span style={{ fontSize: 18 }}>{ehPdf(a.mime) ? '📕' : '🖼️'}</span>
          <div style={{ minWidth: 0 }}>
            <div onClick={() => onAbrir(a, false)} className="ui-wrap" style={{ fontSize: 13.5, fontWeight: 600, cursor: 'pointer', lineHeight: 1.25 }}>{a.nome || 'reserva'}</div>
            <div className="ui-caption" style={{ fontSize: 11 }}>{ehPdf(a.mime) ? 'PDF' : 'foto'}{a.tamanho ? ` · ${fmtTamanho(a.tamanho)}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Button size="sm" onClick={() => onAbrir(a, false)}>{abrindo === a.id + 'a' ? '…' : 'Abrir'}</Button>
            <Button size="sm" variant="soft" aria-label="Baixar" onClick={() => onAbrir(a, true)}>{abrindo === a.id + 'b' ? '…' : '⬇'}</Button>
            {podeRemover && <button onClick={() => { if (window.confirm('Remover este arquivo?')) onRemover(a); }} aria-label="Remover" style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--ui-faint)', fontSize: 14, borderRadius: 10 }}>✕</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReservasRV() {
  const { viagem, reservasRv, documentos, adicionarReservaRv, editarReservaRv, removerReservaRv, removerArquivoDocumento, urlArquivoDocumento } = useData();
  const inputArq = useRef(null);
  const inputFoto = useRef(null);
  const [form, setForm] = useState(null);
  const [maisDetalhes, setMaisDetalhes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState(null); // { tipo: 'atencao'|'erro', texto } — no lugar de alert()
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
  const pct = totalNoites > 0 ? Math.round((cobertas / totalNoites) * 100) : 0;
  const completo = totalNoites > 0 && cobertas === totalNoites;
  // buracos agrupados em faixas (ex.: 25/09 → 27/09, 2 noites)
  const buracos = [];
  cobertura.forEach((n) => {
    if (n.r) return;
    const ult = buracos[buracos.length - 1];
    if (ult && somar(ult.ate, 1) === n.noite) ult.ate = n.noite; else buracos.push({ de: n.noite, ate: n.noite });
  });
  const custo = lista.reduce((acc, r) => { if (r.valor != null) acc[r.moeda === 'BRL' ? 'BRL' : 'USD'] += Number(r.valor); return acc; }, { USD: 0, BRL: 0 });
  const txtCusto = [custo.USD > 0 ? fmtUSD(custo.USD) : '', custo.BRL > 0 ? fmtBRL(custo.BRL) : ''].filter(Boolean).join(' + ');

  function abrirNovo(de, ate) { setErro(''); setAviso(null); setMaisDetalhes(false); setForm({ ...VAZIO, checkin: de || '', checkout: ate ? somar(ate, 1) : (de ? somar(de, 1) : '') }); }
  function abrirEdicao(r) {
    setErro(''); setAviso(null);
    const f = { id: r.id, pendentes: [] };
    for (const k of Object.keys(VAZIO)) if (k !== 'pendentes') f[k] = r[k] == null ? '' : String(r[k]);
    f.moeda = r.moeda === 'BRL' ? 'BRL' : 'USD'; f.status = r.status || 'reservado';
    // já tem endereço/telefone/nº/obs? abre os detalhes expandidos
    setMaisDetalhes(DETALHES.some((k) => f[k] && f[k].trim()));
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
    // aviso (ex.: reserva salva mas arquivo não subiu) fica na lista, sem alert
    setAviso(r && r.aviso ? { tipo: 'atencao', texto: r.aviso } : null);
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
    if (!u) { if (aba) aba.close(); setAviso({ tipo: 'erro', texto: 'Não consegui abrir o arquivo agora. Tenta de novo daqui a pouco.' }); return; }
    if (aba) aba.location.href = u; else window.location.href = u;
  }
  async function copiarConf(r) { if (r.confirmacao && await copiar(r.confirmacao)) { setCopiado(r.id); setTimeout(() => setCopiado(''), 1500); } }

  // ================= formulário =================
  if (form) {
    const docEd = form.id ? lista.find((x) => x.id === form.id) : null;
    const arqsEd = docEd ? arquivosDe(docEd) : [];
    const nNoites = form.checkin && form.checkout ? noites(form.checkin, form.checkout) : 0;
    return (
      <div className="ui-card ui-in" style={{ padding: 16 }}>
        <div className="ui-h2" style={{ marginBottom: 14 }}>{form.id ? 'Editar reserva' : 'Nova reserva de RV park'}</div>

        <Field label="RV park / camping"><input className="ui-input" autoFocus={!form.id} value={form.nome} onChange={set('nome')} placeholder="Ex.: Orlando / Kissimmee KOA" /></Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Check-in" style={{ flex: 1, minWidth: 0 }}><input className="ui-input" type="date" value={form.checkin} onChange={set('checkin')} /></Field>
          <Field label="Check-out" style={{ flex: 1, minWidth: 0 }} hint={nNoites > 0 ? `${nNoites} noite${nNoites === 1 ? '' : 's'}` : undefined}><input className="ui-input" type="date" value={form.checkout} onChange={set('checkout')} /></Field>
        </div>
        <Field label="Status">
          <Segmented opcoes={STATUS.map((s) => ({ id: s.id, label: s.nome }))} valor={form.status} onChange={(id) => setForm((f) => ({ ...f, status: id }))} />
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Valor" style={{ flex: 1, minWidth: 0 }}><input className="ui-input ui-num" inputMode="decimal" value={form.valor} onChange={set('valor')} placeholder="0,00" /></Field>
          <Field label="Moeda" style={{ width: 128, flex: '0 0 auto' }}>
            <Segmented opcoes={[{ id: 'USD', label: 'US$' }, { id: 'BRL', label: 'R$' }]} valor={form.moeda} onChange={(id) => setForm((f) => ({ ...f, moeda: id }))} />
          </Field>
        </div>

        {/* documento da reserva: o que a pessoa mais vai precisar na estrada */}
        <Field label="Documento da reserva" opcional={!arqsEd.length && !form.pendentes.length}>
          <Arquivos arqs={arqsEd} podeRemover abrindo={abrindo} onAbrir={abrir} onRemover={removerArquivoDocumento} />
          {form.pendentes.map((p) => (
            <div key={p.chave} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) auto', alignItems: 'center', columnGap: 8, padding: '6px 0' }}>
              <span style={{ fontSize: 18 }}>{ehPdf(p.mime) ? '📕' : '🖼️'}</span>
              <div style={{ minWidth: 0 }}><div className="ui-wrap" style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nome}</div><div className="ui-caption" style={{ fontSize: 11, color: 'var(--ui-teal-ink)' }}>novo · {fmtTamanho(p.file.size)}</div></div>
              <button onClick={() => setForm((f) => ({ ...f, pendentes: f.pendentes.filter((x) => x.chave !== p.chave) }))} aria-label="Remover" style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--ui-faint)', borderRadius: 10 }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: (arqsEd.length || form.pendentes.length) ? 8 : 0 }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={() => inputArq.current && inputArq.current.click()}>📎 PDF / imagem</Button>
            <Button variant="secondary" style={{ flex: 1 }} onClick={() => inputFoto.current && inputFoto.current.click()}>📷 Tirar foto</Button>
          </div>
          <input ref={inputArq} type="file" accept="application/pdf,image/*" multiple onChange={aoEscolher} style={{ display: 'none' }} />
          <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={aoEscolher} style={{ display: 'none' }} />
        </Field>

        {/* detalhes opcionais recolhidos: nº da reserva, endereço, telefone, obs */}
        <button onClick={() => setMaisDetalhes((v) => !v)} className="ui-btn ui-btn-ghost" style={{ padding: 0, minHeight: 40, marginBottom: maisDetalhes ? 6 : 10 }} aria-expanded={maisDetalhes}>
          {maisDetalhes ? '− menos detalhes' : '+ mais detalhes'}<span className="ui-faint" style={{ fontWeight: 500, fontSize: 12.5 }}>{maisDetalhes ? '' : ' · nº da reserva, endereço, telefone, obs'}</span>
        </button>
        <Expand aberto={maisDetalhes}>
          <div style={{ paddingTop: 2 }}>
            <Field label="Nº da reserva / confirmação" opcional><input className="ui-input ui-mono" style={{ fontWeight: 700, letterSpacing: '.5px' }} value={form.confirmacao} onChange={set('confirmacao')} placeholder="Ex.: KOA-4821903" /></Field>
            <Field label="Endereço (pro GPS)" opcional hint="Como no Google Maps: rua, número, cidade"><input className="ui-input" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, cidade" /></Field>
            <Field label="Telefone do parque" opcional><input className="ui-input" type="tel" value={form.telefone} onChange={set('telefone')} placeholder="+1 407 …" /></Field>
            <Field label="Observações" opcional><textarea className="ui-input" value={form.obs} onChange={set('obs')} placeholder="Site nº, hookups, horário de chegada, o que levar…" /></Field>
          </div>
        </Expand>

        {erro && <div className="ui-error">{erro}</div>}
        {aviso && <Aviso aviso={aviso} onFechar={() => setAviso(null)} />}
        <Button size="lg" full onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : form.id ? 'Salvar alterações' : 'Salvar reserva'}</Button>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="ghost" style={{ flex: 1, color: 'var(--ui-muted)' }} onClick={() => setForm(null)}>Cancelar</Button>
          {docEd && <Button variant="ghost" style={{ flex: 1, color: 'var(--ui-debit)' }} onClick={() => apagar(docEd)}>Apagar reserva</Button>}
        </div>
      </div>
    );
  }

  // ================= lista =================
  return (
    <>
      {aviso && <Aviso aviso={aviso} onFechar={() => setAviso(null)} />}

      {/* resumo das noites: o único destaque da aba */}
      <div className="ui-card" style={{ padding: 16 }}>
        {totalNoites > 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <div className="ui-h2">{cobertas} de {totalNoites} noites reservadas</div>
              <span className="ui-num" style={{ fontSize: 18, fontWeight: 800, color: completo ? 'var(--ui-credit)' : 'var(--ui-teal-ink)' }}>{pct}%</span>
            </div>
            <div style={{ marginTop: 10 }}><ProgressBar pct={pct} fillColor={completo ? 'var(--ui-credit)' : 'var(--ui-teal)'} height={8} /></div>
            <div className="ui-caption" style={{ marginTop: 8 }}>{fmtD(ini)} → {fmtD(fim)}{txtCusto ? ` · total ${txtCusto}` : ''}</div>
            {buracos.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="ui-label" style={{ color: 'var(--ui-debit)' }}>Sem reserva ainda</div>
                {buracos.map((b) => {
                  const n = noites(b.de, somar(b.ate, 1));
                  return (
                    <div key={b.de} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 6px 6px 12px', borderRadius: 12, background: 'var(--ui-debit-soft)', marginTop: 6, minHeight: 48 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0 }}>{b.de === b.ate ? `Noite de ${fmtD(b.de)}` : `${fmtD(b.de)} → ${fmtD(b.ate)}`} <span className="ui-muted" style={{ fontWeight: 500 }}>· {n} noite{n === 1 ? '' : 's'}</span></span>
                      <Button size="sm" variant="secondary" onClick={() => abrirNovo(b.de, b.ate)}>+ reservar</Button>
                    </div>
                  );
                })}
              </div>
            )}
            {completo && lista.length > 0 && <div style={{ fontSize: 13, color: 'var(--ui-credit)', marginTop: 10, fontWeight: 700 }}>✓ Todas as noites têm onde parar.</div>}
          </>
        ) : (
          <>
            <div className="ui-h2">Noites do motorhome</div>
            <div className="ui-caption" style={{ marginTop: 6, fontSize: 13 }}>Defina retirada e entrega do motorhome (aba Custos → Período) pra eu mostrar quais noites faltam reservar.</div>
          </>
        )}
      </div>

      {lista.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <EmptyState icone="🏕️" titulo="Nenhuma reserva ainda." texto="Cadastre cada camping com as datas e anexe o PDF da confirmação — no dia, é só abrir aqui." cta="+ Nova reserva de RV park" onCta={() => abrirNovo(buracos[0] ? buracos[0].de : '', buracos[0] ? buracos[0].ate : '')} />
        </div>
      ) : (
        <Button size="lg" full style={{ margin: '12px 0 16px' }} onClick={() => abrirNovo(buracos[0] ? buracos[0].de : '', buracos[0] ? buracos[0].ate : '')}>+ Nova reserva de RV park</Button>
      )}

      {lista.map((r) => {
        const s = st(r.status);
        const n = noites(r.checkin, r.checkout);
        const arqs = arquivosDe(r);
        const tel = soDigitos(r.telefone);
        return (
          <div key={r.id} className="ui-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ui-wrap" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.2px', lineHeight: 1.25 }}>🏕️ {r.nome}</div>
                <div className="ui-caption" style={{ marginTop: 4, fontSize: 13 }}>{fmtD(r.checkin)} → {fmtD(r.checkout)}{n ? ` · ${n} noite${n === 1 ? '' : 's'}` : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flex: '0 0 auto' }}>
                <span className={`ui-pill ${s.pill}`}>{s.nome}</span>
                {r.valor != null && <span className="ui-num" style={{ fontSize: 14.5, fontWeight: 800 }}>{r.moeda === 'BRL' ? fmtBRL(r.valor) : fmtUSD(r.valor)}</span>}
              </div>
            </div>
            {r.confirmacao && (
              <button onClick={() => copiarConf(r)} title="Toque pra copiar" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', columnGap: 10, width: '100%', border: 'none', background: 'var(--ui-sunken)', borderRadius: 12, padding: '10px 12px', marginTop: 10, cursor: 'pointer', color: 'var(--ui-ink)', textAlign: 'left', minHeight: 44 }}>
                <span className="ui-label" style={{ margin: 0 }}>Nº reserva</span>
                <span className="ui-mono ui-wrap" style={{ fontSize: 14 }}>{r.confirmacao}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: copiado === r.id ? 'var(--ui-credit)' : 'var(--ui-faint)', whiteSpace: 'nowrap' }}>{copiado === r.id ? 'copiado ✓' : 'copiar'}</span>
              </button>
            )}
            {r.endereco && <div className="ui-caption ui-wrap" style={{ marginTop: 8, fontSize: 13 }}>📍 {r.endereco}</div>}
            {r.obs && <div className="ui-wrap" style={{ fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap', background: 'var(--ui-sunken)', borderRadius: 12, padding: '8px 12px', lineHeight: 1.4 }}>{r.obs}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {r.endereco && <a className="ui-btn ui-btn-primary ui-btn-sm" style={linkBtn} href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.endereco)}&travelmode=driving`} target="_blank" rel="noopener noreferrer">🧭 Ir com GPS</a>}
              {r.endereco && <a className="ui-btn ui-btn-soft ui-btn-sm" style={linkBtn} href={urlMaps(r.endereco)} target="_blank" rel="noopener noreferrer">Ver no Maps</a>}
              {tel && <a className="ui-btn ui-btn-soft ui-btn-sm" style={linkBtn} href={`tel:${tel}`}>📞 Ligar</a>}
              <span style={{ flex: 1 }} />
              <Button size="sm" variant="ghost" onClick={() => abrirEdicao(r)}>✏️ Editar</Button>
            </div>
            <Arquivos arqs={arqs} podeRemover={false} abrindo={abrindo} onAbrir={abrir} />
            {arqs.length === 0 && <Button size="sm" variant="ghost" style={{ padding: 0, marginTop: 6 }} onClick={() => abrirEdicao(r)}>📎 anexar documento da reserva</Button>}
          </div>
        );
      })}

      <p className="ui-caption" style={{ color: 'var(--ui-faint)', marginTop: 8, padding: '0 4px', lineHeight: 1.5 }}>
        Compartilhado com todo mundo da viagem. O documento anexado também aparece em Menu → Documentos (tipo Motorhome). Dica: baixe os PDFs antes de pegar a estrada — muito RV park não tem sinal.
      </p>
    </>
  );
}

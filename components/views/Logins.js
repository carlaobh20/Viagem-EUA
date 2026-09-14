'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';
import { PageHeader, Button, Field, EmptyState, Reveal, Expand } from '../ui';

// Logins dos apps da viagem: companhia aérea, locadora, parque, wi-fi do camping.
// A senha fica guardada no banco (protegida por RLS: item privado só o dono vê).
// NÃO é cofre de senha de banco — a tela avisa isso de propósito, ver o rodapé.

const vazio = { id: null, app: '', usuario: '', senha: '', url: '', obs: '', privado: true };

// Ícone/inicial do app, no lugar de um logo que a gente não tem
function Marca({ nome }) {
  const letra = (nome || '?').trim().charAt(0).toUpperCase();
  return (
    <span className="ui-sunken" aria-hidden="true" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: 'var(--ui-muted)', flex: '0 0 auto' }}>{letra}</span>
  );
}

// Um login na lista: linha fechada (app + usuário) e, aberto, senha e ações.
function LinhaLogin({ l, meu, aberto, onAbrirFechar, onEditar, onApagar, copiado, onCopiar }) {
  const dono = l.user_id === meu;
  const [vendo, setVendo] = useState(false);
  const temSenha = Boolean(l.senha);
  return (
    <div style={{ padding: '0 4px' }}>
      <div onClick={() => { onAbrirFechar(l.id); setVendo(false); }} role="button" aria-expanded={aberto}
        style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', columnGap: 10, alignItems: 'center', cursor: 'pointer', minHeight: 56, padding: '6px 0' }}>
        <Marca nome={l.app} />
        <div style={{ minWidth: 0 }}>
          <div className="ui-wrap" style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25 }}>{l.privado ? '🔒 ' : ''}{l.app}</div>
          <div className="ui-caption ui-clamp1" style={{ marginTop: 2 }}>{l.usuario || 'sem usuário anotado'}</div>
        </div>
        <span aria-hidden="true" style={{ color: 'var(--ui-faint)', fontSize: 14, width: 20, textAlign: 'center', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' }}>▾</span>
      </div>

      <Expand aberto={aberto}>
        <div style={{ paddingBottom: 10 }}>
          {l.usuario && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid var(--ui-line)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ui-label" style={{ margin: 0 }}>Usuário</div>
                <div className="ui-wrap ui-mono" style={{ fontSize: 13.5, fontWeight: 700 }}>{l.usuario}</div>
              </div>
              <Button variant="soft" size="sm" onClick={() => onCopiar(l.id + 'u', l.usuario)} style={{ flex: '0 0 auto' }}>{copiado === l.id + 'u' ? '✓ copiado' : 'copiar'}</Button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid var(--ui-line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ui-label" style={{ margin: 0 }}>Senha</div>
              <div className="ui-wrap ui-mono" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: vendo || !temSenha ? '.6px' : '2px' }}>
                {!temSenha ? <span className="ui-faint" style={{ fontFamily: 'inherit', letterSpacing: 0, fontWeight: 500 }}>sem senha anotada</span> : vendo ? l.senha : '••••••••'}
              </div>
            </div>
            {temSenha && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setVendo((v) => !v)} style={{ flex: '0 0 auto' }}>{vendo ? 'ocultar' : 'mostrar'}</Button>
                <Button variant="soft" size="sm" onClick={() => onCopiar(l.id + 's', l.senha)} style={{ flex: '0 0 auto' }}>{copiado === l.id + 's' ? '✓' : 'copiar'}</Button>
              </>
            )}
          </div>

          {l.url && (
            <div style={{ padding: '8px 0 2px', borderTop: '1px solid var(--ui-line)' }}>
              <a href={/^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer" className="ui-btn ui-btn-soft ui-btn-sm" style={{ textDecoration: 'none' }}>🔗 abrir o site</a>
            </div>
          )}

          {l.obs && <div className="ui-sunken ui-wrap" style={{ marginTop: 8, padding: '9px 12px', fontSize: 13.5, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{l.obs}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => onEditar(l)} style={{ paddingLeft: 0 }}>✏️ editar</Button>
            <span className="ui-caption ui-faint" style={{ flex: 1, textAlign: 'center' }}>{l.privado ? 'só você vê' : 'todos da viagem veem'}</span>
            {dono && <Button variant="ghost" size="sm" onClick={() => onApagar(l)} style={{ color: 'var(--ui-debit)', paddingRight: 0 }}>apagar</Button>}
          </div>
        </div>
      </Expand>
    </div>
  );
}

export default function Logins({ ir }) {
  const { perfil, loginsApp, adicionarLoginApp, editarLoginApp, removerLoginApp } = useData();
  const meu = perfil?.user_id;
  const lista = (loginsApp || []).slice().sort((a, b) => (a.app || '').localeCompare(b.app || '', 'pt-BR'));

  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState(null);
  const [copiado, setCopiado] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [verSenhaForm, setVerSenhaForm] = useState(false);

  const filtrada = busca.trim()
    ? lista.filter((l) => `${l.app} ${l.usuario || ''}`.toLowerCase().includes(busca.trim().toLowerCase()))
    : lista;

  function abrirNovo() { setErro(''); setVerSenhaForm(false); setForm({ ...vazio }); }
  function abrirEdicao(l) {
    setErro(''); setVerSenhaForm(false);
    setForm({ id: l.id, app: l.app || '', usuario: l.usuario || '', senha: l.senha || '', url: l.url || '', obs: l.obs || '', privado: l.privado !== false });
  }

  async function salvar() {
    if (!form.app.trim()) { setErro('Escreva o nome do app ou site.'); return; }
    setErro(''); setSalvando(true);
    try {
      if (form.id) {
        await editarLoginApp(form.id, {
          app: form.app.trim(), usuario: form.usuario.trim() || null, senha: form.senha || null,
          url: form.url.trim() || null, obs: form.obs.trim() || null, privado: form.privado !== false,
        });
      } else {
        await adicionarLoginApp(form);
      }
      setForm(null);
    } catch (e) {
      setErro('Não consegui salvar. Confere a internet e tenta de novo.');
    } finally { setSalvando(false); }
  }

  async function apagar(l) {
    if (!window.confirm(`Apagar o login de "${l.app}"?`)) return;
    await removerLoginApp(l.id);
  }

  async function copiar(chave, texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 1800);
    } catch (e) { /* navegador sem permissão: a pessoa vê e digita */ }
  }

  const n = lista.length;
  const nMeus = lista.filter((l) => l.privado !== false).length;
  const subtitulo = n === 0
    ? 'Guarde o acesso dos apps que você vai usar na viagem'
    : `${n} ${n === 1 ? 'acesso' : 'acessos'}${nMeus > 0 ? ` · ${nMeus} só ${nMeus === 1 ? 'seu' : 'seus'}` : ''}`;

  return (
    <div className="ui-screen">
      <PageHeader
        titulo="Logins"
        subtitulo={subtitulo}
        onVoltar={() => ir('menu')}
        acao={form ? null : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {n > 3 && (
              <button onClick={() => { setBuscaAberta((v) => !v); if (buscaAberta) setBusca(''); }} aria-label="Buscar" className="ui-iconbtn raised ui-press" style={{ width: 40, height: 40 }}>🔎</button>
            )}
            <Button size="sm" onClick={abrirNovo} style={{ minHeight: 40 }}>+ Novo</Button>
          </div>
        )}
      />

      {buscaAberta && !form && (
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar app…" className="ui-input ui-in" style={{ marginBottom: 14 }} />
      )}

      {form ? (
        <Reveal>
          <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="ui-h2" style={{ marginBottom: 14 }}>{form.id ? 'Editar acesso' : 'Novo acesso'}</div>

            <Field label="App ou site">
              <input className="ui-input" value={form.app} onChange={(e) => setForm({ ...form, app: e.target.value })} placeholder="Ex.: American Airlines" autoFocus={!form.id} />
            </Field>
            <Field label="Usuário, e-mail ou número" opcional>
              <input className="ui-input" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} placeholder="Ex.: carlos@email.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </Field>
            <Field label="Senha" opcional>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="ui-input ui-mono" type={verSenhaForm ? 'text' : 'password'} value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="•••••••" autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{ flex: 1, minWidth: 0 }} />
                <Button type="button" variant="secondary" onClick={() => setVerSenhaForm((v) => !v)} style={{ flex: '0 0 auto' }}>{verSenhaForm ? 'ocultar' : 'mostrar'}</Button>
              </div>
            </Field>
            <Field label="Site" opcional hint="Pra abrir direto daqui.">
              <input className="ui-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="aa.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </Field>
            <Field label="Anotações" opcional hint="Número do programa de milhas, pergunta secreta, qual cartão está cadastrado…">
              <textarea className="ui-input" value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Ex.: AAdvantage 123456" />
            </Field>

            <div className="ui-field">
              <label className="ui-label">Quem vê esse acesso</label>
              <div className="ui-seg">
                <button type="button" className={form.privado !== false ? 'on' : ''} onClick={() => setForm({ ...form, privado: true })}>🔒 Só eu</button>
                <button type="button" className={form.privado === false ? 'on' : ''} onClick={() => setForm({ ...form, privado: false })}>👥 Todos da viagem</button>
              </div>
            </div>

            {erro && <div className="ui-error">{erro}</div>}
            <Button size="lg" full onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : (form.id ? 'Salvar alterações' : 'Guardar acesso')}</Button>
            <Button variant="ghost" full style={{ marginTop: 6 }} onClick={() => setForm(null)}>Cancelar</Button>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          {n === 0 ? (
            <EmptyState
              icone="🔑"
              titulo="Nenhum acesso guardado ainda."
              texto="Anote aqui o login dos apps que você vai precisar na viagem — companhia aérea, locadora, parque, wi-fi do camping."
              cta="Guardar o primeiro"
              onCta={abrirNovo}
            />
          ) : filtrada.length === 0 ? (
            <EmptyState compacto icone="🔎" titulo={`Nada com “${busca.trim()}”`} texto="Tente outro nome." cta="Limpar busca" onCta={() => setBusca('')} />
          ) : (
            <div className="ui-card ui-list" style={{ padding: '2px 10px' }}>
              {filtrada.map((l) => (
                <LinhaLogin
                  key={l.id}
                  l={l}
                  meu={meu}
                  aberto={aberto === l.id}
                  onAbrirFechar={(id) => setAberto(aberto === id ? null : id)}
                  onEditar={abrirEdicao}
                  onApagar={apagar}
                  copiado={copiado}
                  onCopiar={copiar}
                />
              ))}
            </div>
          )}

          <div className="ui-card-tight" style={{ marginTop: 16, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ fontSize: 18, flex: '0 0 auto' }}>⚠️</span>
            <p className="ui-caption ui-wrap" style={{ margin: 0, lineHeight: 1.45 }}>
              Use isso pra apps da viagem (companhia aérea, locadora, parque, wi-fi). <b>Não guarde aqui senha de banco, cartão ou do seu e-mail principal</b> — pra essas, use o cofre do celular. O que está marcado “🔒 Só eu” ninguém mais da viagem vê.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useData } from '../DataProvider';
import { PageHeader, Button, Field, Reveal } from '../ui';

// Minha conta: quem está conectado, trocar a senha e sair.
export default function Conta({ ir }) {
  const { perfil } = useData();
  const [email, setEmail] = useState('');
  const [saindo, setSaindo] = useState(false);

  // mudar senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null); // { tipo: 'ok'|'erro', texto }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email || '');
    });
  }, []);

  async function sair() {
    setSaindo(true);
    await supabase.auth.signOut();
  }

  async function mudarSenha() {
    setMsg(null);
    if (novaSenha.length < 6) { setMsg({ tipo: 'erro', texto: 'A senha precisa de pelo menos 6 caracteres.' }); return; }
    if (novaSenha !== confirma) { setMsg({ tipo: 'erro', texto: 'As senhas não são iguais.' }); return; }
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setMsg({ tipo: 'ok', texto: 'Senha alterada com sucesso!' });
      setNovaSenha(''); setConfirma('');
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message || 'Não foi possível alterar a senha.' });
    } finally {
      setSalvando(false);
    }
  }

  const nome = perfil && (perfil.nome || perfil.name) ? String(perfil.nome || perfil.name).trim() : '';
  const inicial = (nome || email || '').trim().charAt(0).toUpperCase();

  return (
    <div className="ui-screen" style={{ paddingBottom: 28 }}>
      <PageHeader titulo="Minha conta" subtitulo={nome ? `${nome} · ${email || '…'}` : (email || 'Carregando…')} onVoltar={() => ir('resumo')} />

      <Reveal>
        {/* quem está conectado */}
        <div className="ui-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--ui-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flex: '0 0 auto', boxShadow: '0 6px 16px rgba(0, 199, 177, .28)' }}>
            {inicial || '👤'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ui-h2 ui-clamp1">{nome || 'Viajante'}</div>
            <div className="ui-caption ui-clamp1" style={{ marginTop: 2 }}>{email || '…'}</div>
          </div>
        </div>

        {/* mudar senha */}
        <div className="ui-card" style={{ padding: 18, marginTop: 12 }}>
          <div className="ui-h2" style={{ marginBottom: 4 }}>Mudar senha</div>
          <div className="ui-caption" style={{ marginBottom: 14 }}>Pelo menos 6 caracteres. Você continua conectado depois de trocar.</div>

          {msg && <div className={msg.tipo === 'ok' ? 'ui-success' : 'ui-error'}>{msg.texto}</div>}

          <Field label="Nova senha">
            <input className="ui-input" type="password" autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Repetir nova senha" hint={confirma && novaSenha !== confirma ? 'As senhas ainda não batem.' : undefined}>
            <input className="ui-input" type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && mudarSenha()} />
          </Field>

          <Button size="lg" full onClick={mudarSenha} disabled={salvando} style={{ marginTop: 4 }}>
            {salvando ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </div>

        {/* sair: discreto, longe da ação primária */}
        <Button variant="secondary" full onClick={sair} disabled={saindo} style={{ marginTop: 24, minHeight: 50, color: 'var(--ui-debit)' }}>
          {saindo ? 'Saindo…' : 'Sair da conta'}
        </Button>
      </Reveal>
    </div>
  );
}

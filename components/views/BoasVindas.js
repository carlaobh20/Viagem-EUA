'use client';
import { useState } from 'react';
import { useData } from '../DataProvider';

export default function BoasVindas() {
  const { definirMeuNome } = useData();
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    setErro('');
    if (nome.trim().length < 2) { setErro('Digite seu nome (pelo menos 2 letras).'); return; }
    setSalvando(true);
    const r = await definirMeuNome(nome);
    if (r && r.erro) { setErro(r.erro); setSalvando(false); }
    // se deu certo, o app sai desta tela sozinho (precisaNome vira false)
  }

  const T = '#00C7B1';
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#E6F5FB 0%,#F7FBFD 50%,#FFFFFF 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif', color: '#111827', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 22px', maxWidth: 460, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg,${T},#0E9F97)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#fff', boxShadow: '0 10px 22px rgba(0,199,177,.32)' }}>👋</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', margin: '16px 0 6px' }}>Bem-vindo!</h1>
        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.4 }}>Como você gostaria de ser chamado(a) no app? É assim que seu nome vai aparecer nos gastos e na viagem.</p>
      </div>

      {erro && <div style={{ background: '#FEECEC', color: '#C0392B', fontSize: 13, padding: '11px 14px', borderRadius: 12, marginBottom: 12 }}>{erro}</div>}

      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280' }}>Seu nome</label>
      <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Fernanda" onKeyDown={(e) => e.key === 'Enter' && salvar()} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 13, padding: '14px 16px', fontSize: 16, background: '#fff', color: '#111827', marginTop: 6, outline: 'none' }} />

      <button onClick={salvar} disabled={salvando} style={{ width: '100%', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${T},#0E9F97)`, color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 22, boxShadow: '0 10px 22px rgba(0,199,177,.30)' }}>{salvando ? '...' : 'Continuar'}</button>
    </div>
  );
}

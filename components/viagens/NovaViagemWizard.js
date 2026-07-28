'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionTokens, radius, shadow } from '../../lib/design-tokens';

/**
 * @typedef {Object} NovaViagemDados
 * @property {string} nome
 * @property {'nacional'|'internacional'} tipoViagem
 * @property {string} destino
 * @property {string[]} transporte - ids de TRANSPORTES selecionados (>= 1)
 * @property {'ferias'|'trabalho'|'outro'} motivo
 * @property {string} dataIda - "AAAA-MM-DD" ou '' se ainda não souber
 * @property {string} dataVolta - "AAAA-MM-DD" ou '' se ainda não souber
 */

/**
 * @typedef {Object} NovaViagemWizardProps
 * @property {() => void} onCancelar
 * @property {(dados: NovaViagemDados) => Promise<void>} onCriar
 */

const TIPOS = [
  { id: 'nacional', emoji: '🇧🇷', label: 'Nacional' },
  { id: 'internacional', emoji: '🌍', label: 'Internacional' },
];

const TRANSPORTES = [
  { id: 'carro', emoji: '🚗', label: 'Carro' },
  { id: 'aviao', emoji: '✈️', label: 'Avião' },
  { id: 'motorhome', emoji: '🚐', label: 'Motorhome / RV' },
  { id: 'onibus', emoji: '🚌', label: 'Ônibus' },
  { id: 'trem', emoji: '🚆', label: 'Trem' },
  { id: 'outro', emoji: '📍', label: 'Outro' },
];

const MOTIVOS = [
  { id: 'ferias', emoji: '🏖️', label: 'Férias' },
  { id: 'trabalho', emoji: '💼', label: 'Trabalho' },
  { id: 'outro', emoji: '🗂️', label: 'Outro' },
];

const TOTAL_PASSOS = 5;

/**
 * Assistente de criação de viagem — card premium centralizado, em passos.
 * Coleta nome, tipo (nacional/internacional), destino, meio de transporte e
 * motivo. Essas respostas viram o "perfil" da viagem (guardado no banco) e
 * são usadas em outras telas pra personalizar o que aparece — por exemplo,
 * não mostrar a aba Motorhome numa viagem a trabalho sem RV, ou esconder o
 * guia de frases em inglês numa viagem nacional. Ver Nav.js e menu.js.
 * @param {NovaViagemWizardProps} props
 */
export default function NovaViagemWizard({ onCancelar, onCriar }) {
  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState(1);
  const [nome, setNome] = useState('');
  const [tipoViagem, setTipoViagem] = useState(null);
  const [destino, setDestino] = useState('');
  const [transporte, setTransporte] = useState([]);
  const [motivo, setMotivo] = useState(null);
  const [dataIda, setDataIda] = useState('');
  const [dataVolta, setDataVolta] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  function toggleTransporte(id) {
    setTransporte((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // quantidade de dias, só pra mostrar feedback ao usuário no passo de datas —
  // o cálculo "de verdade" usado pra personalizar o checklist é feito depois,
  // a partir de data_ida/data_volta salvos na viagem (ver lib/trip-metrics.js)
  const dias = (dataIda && dataVolta && dataVolta >= dataIda)
    ? Math.round((new Date(dataVolta + 'T00:00:00') - new Date(dataIda + 'T00:00:00')) / 86400000) + 1
    : null;

  const validoPorPasso = [
    nome.trim().length > 0 && !!tipoViagem,
    destino.trim().length > 0,
    transporte.length > 0,
    true, // datas são opcionais — pode não saber ainda
    !!motivo,
  ];
  const passoValido = validoPorPasso[passo];
  const ultimoPasso = passo === TOTAL_PASSOS - 1;

  function avancar() {
    if (!passoValido) return;
    if (ultimoPasso) { criar(); return; }
    setDirecao(1);
    setPasso((p) => p + 1);
  }
  function voltar() {
    if (passo === 0) { onCancelar(); return; }
    setDirecao(-1);
    setPasso((p) => p - 1);
  }
  async function criar() {
    setErro(''); setCriando(true);
    try {
      await onCriar({ nome: nome.trim(), tipoViagem, destino: destino.trim(), transporte, motivo, dataIda, dataVolta });
    } catch (e) {
      setErro('Não consegui criar a viagem. Tenta de novo.');
      setCriando(false);
    }
  }

  const variantesSlide = {
    entra: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
    centro: { opacity: 1, x: 0 },
    sai: (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
  };

  const inputStyle = {
    width: '100%', border: '1px solid var(--ui-line)', borderRadius: radius.sm, padding: '13px 15px',
    fontSize: 16, background: 'var(--ui-bg)', color: 'var(--ui-ink)', fontFamily: 'inherit',
  };

  const Chip = ({ ativo, onClick, emoji, label }) => (
    <button onClick={onClick} className="v3-press" style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: radius.pill,
      border: ativo ? '1.5px solid var(--ui-teal)' : '1px solid var(--ui-line)',
      background: ativo ? 'rgba(0,199,177,.12)' : 'var(--ui-card)',
      color: ativo ? 'var(--ui-teal)' : 'var(--ui-ink)',
      fontSize: 14, fontWeight: ativo ? 800 : 600, cursor: 'pointer',
    }}>
      <span style={{ fontSize: 17 }}>{emoji}</span>{label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        onClick={onCancelar}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(8,20,26,.58)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ duration: motionTokens.base, ease: motionTokens.easing }}
        style={{
          position: 'relative', width: '100%', maxWidth: 380, background: 'var(--ui-card)', borderRadius: radius.xl,
          boxShadow: shadow.floating, overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* topo: progresso + fechar */}
        <div style={{ padding: '20px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: TOTAL_PASSOS }).map((_, i) => (
                <span key={i} style={{ width: i === passo ? 22 : 7, height: 7, borderRadius: 4, background: i <= passo ? 'var(--ui-teal)' : 'var(--ui-line)', transition: 'width .25s, background .25s' }} />
              ))}
            </div>
            <button onClick={onCancelar} aria-label="Fechar" style={{ border: 'none', background: 'var(--ui-bg)', color: 'var(--ui-faint)', width: 30, height: 30, borderRadius: '50%', fontSize: 14, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '4px 22px 22px', minHeight: 240, overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait" custom={direcao} initial={false}>
            <motion.div
              key={passo}
              custom={direcao}
              variants={variantesSlide}
              initial="entra" animate="centro" exit="sai"
              transition={{ duration: motionTokens.fast, ease: motionTokens.easing }}
            >
              {passo === 0 && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>Vamos criar sua viagem</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 18 }}>Como ela se chama, e é dentro do Brasil ou fora?</div>
                  <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Europa em família" style={{ ...inputStyle, marginBottom: 14 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    {TIPOS.map((t) => (
                      <button key={t.id} onClick={() => setTipoViagem(t.id)} className="v3-press" style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 10px', borderRadius: radius.md,
                        border: tipoViagem === t.id ? '1.5px solid var(--ui-teal)' : '1px solid var(--ui-line)',
                        background: tipoViagem === t.id ? 'rgba(0,199,177,.12)' : 'var(--ui-bg)', cursor: 'pointer',
                      }}>
                        <span style={{ fontSize: 24 }}>{t.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: tipoViagem === t.id ? 'var(--ui-teal)' : 'var(--ui-ink)' }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {passo === 1 && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>{tipoViagem === 'nacional' ? 'Qual lugar?' : 'Pra onde vocês vão?'}</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 18 }}>{tipoViagem === 'nacional' ? 'Cidade ou destino dentro do Brasil.' : 'País e cidade principal do roteiro.'}</div>
                  <input autoFocus value={destino} onChange={(e) => setDestino(e.target.value)} placeholder={tipoViagem === 'nacional' ? 'Ex.: Fernando de Noronha' : 'Ex.: Portugal e Espanha'} style={inputStyle} />
                </>
              )}

              {passo === 2 && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>Como vocês vão se deslocar?</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 18 }}>Pode escolher mais de um. Isso ajusta o que aparece no app — por exemplo, só mostramos a aba de Motorhome se ela fizer sentido.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                    {TRANSPORTES.map((t) => (
                      <Chip key={t.id} ativo={transporte.includes(t.id)} onClick={() => toggleTransporte(t.id)} emoji={t.emoji} label={t.label} />
                    ))}
                  </div>
                </>
              )}

              {passo === 3 && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>Quando é a viagem?</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 18 }}>Se ainda não souber, pode deixar em branco e ajustar depois. A quantidade de dias ajuda a ajustar o checklist.</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: dias ? 12 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ui-faint)', marginBottom: 6 }}>IDA</div>
                      <input type="date" value={dataIda} onChange={(e) => setDataIda(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ui-faint)', marginBottom: 6 }}>VOLTA</div>
                      <input type="date" value={dataVolta} min={dataIda || undefined} onChange={(e) => setDataVolta(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  {dias && <div style={{ fontSize: 13, color: 'var(--ui-teal)', fontWeight: 700 }}>{dias} dia{dias === 1 ? '' : 's'} de viagem</div>}
                </>
              )}

              {passo === 4 && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', marginBottom: 4 }}>Qual o motivo da viagem?</div>
                  <div style={{ fontSize: 13, color: 'var(--ui-muted)', marginBottom: 18 }}>Última pergunta — prometo.</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                    {MOTIVOS.map((m) => (
                      <Chip key={m.id} ativo={motivo === m.id} onClick={() => setMotivo(m.id)} emoji={m.emoji} label={m.label} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {erro && <div style={{ padding: '0 22px 10px', fontSize: 12.5, color: '#C0463F' }}>{erro}</div>}

        <div style={{ display: 'flex', gap: 10, padding: '0 22px 22px' }}>
          <button onClick={voltar} disabled={criando} className="v3-press" style={{ border: '1px solid var(--ui-line)', background: 'var(--ui-bg)', color: 'var(--ui-ink)', borderRadius: radius.sm, padding: '13px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {passo === 0 ? 'Cancelar' : '← Voltar'}
          </button>
          <button onClick={avancar} disabled={!passoValido || criando} className="v3-press" style={{
            flex: 1, border: 'none', borderRadius: radius.sm, padding: '13px 18px', fontSize: 14, fontWeight: 800, cursor: (!passoValido || criando) ? 'default' : 'pointer',
            background: (!passoValido || criando) ? 'var(--ui-line)' : 'linear-gradient(135deg,#10B981,#0EA5E9)', color: (!passoValido || criando) ? 'var(--ui-faint)' : '#fff',
          }}>
            {criando ? 'Criando…' : (ultimoPasso ? 'Criar viagem 🎉' : 'Continuar →')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

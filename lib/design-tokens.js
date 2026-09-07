/**
 * Design tokens — Encorpei na Trip
 * --------------------------------
 * Fonte única de verdade pra cor, tipografia, espaçamento, raio, sombra,
 * superfícies, estados e movimento. As cores referenciam as CSS custom
 * properties de app/globals.css (--ui-*): mudar o tema lá reflete aqui.
 *
 * Como usar nas telas:
 *   import { text, surface, space, radius, color, state, touch, control } from '../../lib/design-tokens';
 *   <div style={{ ...surface.card, padding: space(4) }}>
 *   <h1 style={text.title}>
 * Quando a tela usa classes, as equivalentes vivem em globals.css (.ui-*).
 *
 * JS puro de propósito (o projeto não tem build de tipos). Props via JSDoc.
 */

// ----- Cor (paleta atual, sem inventar nova) -----
export const color = {
  bg: 'var(--ui-bg)',
  card: 'var(--ui-card)',
  sunken: 'var(--ui-sunken)',
  ink: 'var(--ui-ink)',
  muted: 'var(--ui-muted)',
  faint: 'var(--ui-faint)',
  line: 'var(--ui-line)',
  lineStrong: 'var(--ui-line-strong)',
  teal: 'var(--ui-teal)',
  tealInk: 'var(--ui-teal-ink)',
  tealSoft: 'var(--ui-teal-soft)',
  dark: 'var(--ui-dark)',
  blue: 'var(--ui-blue)',
  gold: 'var(--ui-gold)',
  goldSoft: 'var(--ui-gold-soft)',
  debit: 'var(--ui-debit)',
  debitSoft: 'var(--ui-debit-soft)',
  credit: 'var(--ui-credit)',
  creditSoft: 'var(--ui-credit-soft)',
};

// ----- Estados semânticos (fundo suave + texto forte) -----
export const state = {
  success: { bg: 'var(--ui-credit-soft)', fg: 'var(--ui-credit)' },
  warning: { bg: 'var(--ui-gold-soft)', fg: 'var(--ui-gold)' },
  danger: { bg: 'var(--ui-debit-soft)', fg: 'var(--ui-debit)' },
  info: { bg: 'var(--ui-teal-soft)', fg: 'var(--ui-teal-ink)' },
  neutral: { bg: 'var(--ui-sunken)', fg: 'var(--ui-muted)' },
};

// ----- Espaçamento: grade de 4px (space(1)=4, space(2)=8, space(4)=16, space(6)=24) -----
export const space = (n) => n * 4;
export const layout = {
  pagePadX: 18,           // margem lateral das telas
  pagePadTop: 14,
  pagePadBottom: 104,     // espaço pra barra de navegação + botão flutuante
  gap: 12,                // entre cards
  gapTight: 8,
  section: 24,            // entre seções
  maxWidth: 460,
};

// ----- Raio -----
export const radius = { xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 };

// ----- Sombra -----
export const shadow = {
  card: 'var(--ui-shadow)',
  raised: 'var(--ui-shadow-raised)',
  floating: '0 20px 44px rgba(0,43,54,.26)',
  soft: '0 8px 20px rgba(20,28,40,.08)',
  focus: '0 0 0 3px rgba(0,199,177,.28)',
};

// ----- Borda -----
export const border = {
  hair: '1px solid var(--ui-line)',
  strong: '1px solid var(--ui-line-strong)',
  dashed: '1.5px dashed var(--ui-line-strong)',
  none: '1px solid transparent',
};

// ----- Tipografia (uma família, escala curta) -----
export const font = {
  family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};
export const text = {
  display: { fontSize: 34, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.05 },
  title: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.15 },
  h2: { fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.25 },
  h3: { fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 },
  section: { fontSize: 11.5, fontWeight: 800, letterSpacing: '.9px', textTransform: 'uppercase', color: 'var(--ui-muted)' },
  body: { fontSize: 14.5, fontWeight: 500, lineHeight: 1.45 },
  bodyMuted: { fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, color: 'var(--ui-muted)' },
  caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.35, color: 'var(--ui-muted)' },
  label: { fontSize: 11.5, fontWeight: 700, letterSpacing: '.3px', color: 'var(--ui-muted)' },
  number: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' },
  mono: { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontWeight: 800, letterSpacing: '.6px' },
};
// compat: nome antigo
export const type = text;

// ----- Superfícies prontas -----
export const surface = {
  card: { background: 'var(--ui-card)', borderRadius: radius.lg, boxShadow: shadow.card, border: border.none },
  cardTight: { background: 'var(--ui-card)', borderRadius: radius.md, boxShadow: shadow.card, border: border.none },
  sunken: { background: 'var(--ui-sunken)', borderRadius: radius.sm },
  dark: { background: 'var(--ui-dark)', color: '#fff', borderRadius: radius.lg, boxShadow: shadow.floating },
  outlined: { background: 'transparent', borderRadius: radius.lg, border: border.dashed },
};

// ----- Alvo de toque -----
export const touch = { min: 44, comfy: 50 };

// ----- Movimento -----
export const motion = {
  fast: 0.16,
  base: 0.32,
  slow: 0.55,
  easing: [0.22, 0.61, 0.36, 1],
  spring: { type: 'spring', stiffness: 340, damping: 30 },
  fadeUp: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] } },
  expand: { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] } },
  pop: { initial: { scale: 0.92, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 380, damping: 26 } },
};

// ----- Estilos de controle (quando a tela precisa de inline em vez de classe) -----
export const control = {
  input: { width: '100%', minHeight: touch.min, border: border.strong, borderRadius: radius.sm, padding: '11px 13px', fontSize: 15, background: 'var(--ui-card)', color: 'var(--ui-ink)', fontFamily: 'inherit', outline: 'none' },
  btnPrimary: { minHeight: touch.comfy, border: 'none', borderRadius: radius.md, padding: '0 18px', background: 'var(--ui-teal)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' },
  btnSecondary: { minHeight: touch.min, border: border.strong, borderRadius: radius.md, padding: '0 16px', background: 'var(--ui-card)', color: 'var(--ui-ink)', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnGhost: { minHeight: touch.min, border: 'none', borderRadius: radius.md, padding: '0 12px', background: 'transparent', color: 'var(--ui-teal-ink)', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 13px', borderRadius: radius.pill, fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },
  iconBtn: { width: touch.min, height: touch.min, borderRadius: radius.sm, border: 'none', background: 'var(--ui-sunken)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 17, color: 'var(--ui-ink)' },
};

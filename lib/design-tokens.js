/**
 * Design tokens — Home v3
 * -----------------------
 * Fonte única de verdade pra cor, espaçamento, raio, sombra, tipografia e
 * movimento usados nos componentes novos (components/ui, components/home).
 * As cores referenciam as CSS custom properties já definidas em
 * app/globals.css (--ui-*) — mudar o tema ali reflete aqui automaticamente,
 * sem duplicar valores.
 *
 * Não é TypeScript de propósito: o projeto inteiro é JS puro (sem build de
 * tipos). Interfaces de props são documentadas via JSDoc nos próprios
 * componentes (@typedef), o suficiente pra autocomplete/checagem no editor
 * sem migrar a árvore inteira de arquivos pra .tsx.
 */

export const color = {
  bg: 'var(--ui-bg)',
  card: 'var(--ui-card)',
  ink: 'var(--ui-ink)',
  muted: 'var(--ui-muted)',
  faint: 'var(--ui-faint)',
  line: 'var(--ui-line)',
  teal: 'var(--ui-teal)',
  dark: 'var(--ui-dark)',
  blue: 'var(--ui-blue)',
  gold: '#BA7517',
  debit: '#C0463F',
};

// grid de 8px — use space(1) = 8, space(2) = 16, space(3) = 24...
export const space = (n) => n * 8;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const shadow = {
  card: 'var(--ui-shadow)',
  floating: '0 20px 44px rgba(0,43,54,.26)',
  soft: '0 8px 20px rgba(20,28,40,.08)',
};

export const motion = {
  fast: 0.16,
  base: 0.32,
  slow: 0.55,
  easing: [0.22, 0.61, 0.36, 1], // easing "premium" (mesma curva das .v3-* do globals.css)
  spring: { type: 'spring', stiffness: 340, damping: 30 },
};

export const type = {
  display: { fontSize: 40, fontWeight: 800, letterSpacing: '-1.2px', lineHeight: 1 },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px' },
  section: { fontSize: 13, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' },
  body: { fontSize: 14.5, fontWeight: 500 },
  caption: { fontSize: 12, fontWeight: 500 },
};

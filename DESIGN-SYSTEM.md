# Encorpei na Trip — Design System (guia de uso)

Posicionamento: **premium, calmo, moderno, confiável, familiar, inteligente, internacional.**
Evitar: cara de dashboard corporativo, planilha, sistema administrativo, app genérico de finanças.

## Fontes de verdade
- `app/globals.css` — paleta (`--ui-*`), classes clássicas (`.card .input .btn-primary .toggle .row .field .chip`) e utilitários `.ui-*`.
- `lib/design-tokens.js` — `color, state, space, layout, radius, shadow, border, font, text, surface, touch, motion, control`.
- `components/ui/index.js` — `Button, Field, PageHeader, EmptyState, Segmented, Reveal, Expand, SectionHeader, GlassCard, ProgressBar, StatTile, Skeleton`.

## Paleta (não inventar cores)
Fundo `--ui-bg` · card `--ui-card` · rebaixado `--ui-sunken` · texto `--ui-ink` · secundário `--ui-muted` · terciário `--ui-faint` · linhas `--ui-line` / `--ui-line-strong`.
Destaque: preenchimento `--ui-teal` (#00C7B1), **texto/ícone em teal usa `--ui-teal-ink`** (#0B8F80 — contraste), fundo suave `--ui-teal-soft`.
Estados: sucesso `--ui-credit`/`--ui-credit-soft` · atenção `--ui-gold`/`--ui-gold-soft` · erro/dívida `--ui-debit`/`--ui-debit-soft` · escuro `--ui-dark`.
Regra: cor de estado só quando comunica estado. Card normal é branco, sem borda, sombra `--ui-shadow`.
Cores literais (`#C2410C`, `#0F9D6B`, `rgba(...)` de destaque) → trocar pelas variáveis acima.

## Tipografia (uma família, escala curta)
- Título da tela: `.ui-title` (24/800) + `.ui-subtitle` (13.5, muted). Use `PageHeader`.
- Título de card: `.ui-h2` (17/800). Item de lista: 14.5/700. Corpo: 14.5/500. Legenda: 12 muted.
- Rótulo de seção/campo: `.ui-section` / `.ui-label` (11.5, 800, caixa alta, letter-spacing .9px).
- Números: `font-variant-numeric: tabular-nums` (`.ui-num`). Códigos (localizador, reserva): `.ui-mono`.

## Espaçamento, raio, sombra
- Grade de 4px. Tela: `.ui-screen` (14px topo, 18px lados, 104px embaixo — barra + FAB). Entre cards 12px, entre seções 22–24px.
- Raio: card 20 (`.ui-card`), card compacto 16, input 12, chip/pill 999.
- Sombra: só `--ui-shadow` em cards; `--ui-shadow-raised` para elementos flutuantes. Nada de bordas fortes em cards.

## Componentes
- **Cabeçalho**: `<PageHeader titulo subtitulo onVoltar acao />` — responde "onde estou" em 1 linha; subtítulo diz o que importa agora (ex.: "3 de 10 noites reservadas").
- **Botões**: `<Button variant="primary|secondary|soft|ghost|danger" size="sm|md|lg" full />`. Uma ação primária por tela/card. Alvo ≥44px sempre; ação crítica ≥50px (`size="lg"`).
- **Campos**: `<Field label hint opcional><input className="ui-input" /></Field>`. Rótulos curtos. Opcionais escondidos atrás de "+ mais detalhes" quando o formulário passa de 5 campos.
- **Segmentado**: `<Segmented opcoes valor onChange />` (ou `.toggle` nas telas clássicas) — parece um controle só.
- **Vazio**: `<EmptyState icone titulo texto cta onCta />` — nunca parece erro. Padrão de texto: "Seu roteiro ainda está vazio." / "Comece adicionando o primeiro destino." + CTA.
- **Pílulas de estado**: `.ui-pill ui-pill-success|warning|danger|info|neutral`.
- **Chips roláveis** (filtros): `.ui-chips-scroll > .ui-chipbtn(.on)`.
- **Linha de lista tocável**: `.ui-rowbtn` (56px min), ícone 38–44px à esquerda, chevron discreto à direita.
- **Movimento** (framer-motion via `Reveal` / `Expand` ou classes `.ui-in`, `.ui-press`): entrada de tela, abertura de formulário, expansão de item, sucesso. Nada além disso.

## Hierarquia em toda tela
1. Onde estou? (PageHeader)  2. O que importa agora? (1 bloco de destaque, não 5)  3. O que posso fazer? (lista/cards)  4. Próxima ação (1 botão primário claro).
Reduza ruído: menos rótulos repetidos, menos bordas, menos cores; não transformar tudo em card — listas simples dentro de um card são melhores que 10 cards.

## Formulários
Rápidos: defaults inteligentes (data de hoje, moeda da viagem, última companhia), campos opcionais escondidos, ação primária fixa e clara, feedback imediato (mensagem inline `.ui-error` / `.ui-success`, nunca `alert()` novo — os existentes podem ficar se trocar der trabalho).

## Mobile first
Testar em 375 / 390 / 430px. Nenhum botão importante menor que 44px de altura. Textos longos com `.ui-wrap`; uma linha com `.ui-clamp1`. Sem scroll horizontal da página.

## O que NÃO fazer
- Não criar funcionalidade, não remover funcionalidade, não mudar banco/DataProvider (só leitura de dados; pode chamar as funções que já existem).
- Não mudar `app/globals.css`, `lib/design-tokens.js` nem `components/ui/*` (se faltar algo, use inline com tokens e anote no relatório).
- Não trocar nomes de telas/rotas (`ir('xxx')`), nem props públicas dos componentes.
- Não animar tudo.

# Viagem EUA · App de gastos da família (versão completa)

PWA em Next.js + Supabase para a família controlar gastos da viagem em dólar e real, com login, divisão de despesas, acerto de contas, foto de recibo lida por IA e roteiro. Deploy no Vercel.

## Configurar (uma vez)

1. **Supabase** (banco): rode `supabase/schema.sql` no SQL Editor (instalação nova). Se já tinha banco antigo, rode `supabase/migracao-acertos.sql` e `supabase/migracao-recibos.sql`.
2. **Vercel** (env): defina
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (do Supabase > Settings > API)
   - `ANTHROPIC_API_KEY` (chave da Anthropic, console.anthropic.com) — usada só no servidor para ler recibos.
3. Conecte o repositório no Vercel e faça deploy. Cada `git push` republica.

## Recursos
- Login (contas criadas pelo admin no Supabase).
- Gastos em USD/BRL, com divisão por pessoa e partes.
- Câmbio único definido na aba Acerto (converte dólar→real no fechamento).
- Acerto: quem deve a quem, com "marcar como pago" e histórico.
- Foto de recibo: a IA lê valor/data/estabelecimento e sugere categoria; a foto fica guardada.
- Pessoas no app (com ou sem login), categorias, roteiro, tela inicial em painel.

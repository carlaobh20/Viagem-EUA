# Viagem EUA · App de gastos da família

App (PWA) para a família controlar todos os gastos da viagem — em **dólar e em real** — com login, divisão de despesas e acerto de contas em tempo real. Feito com **Next.js + Supabase**, pronto para subir no **Git** e publicar no **Vercel**.

## O que a V1 faz

- **Login** para cada membro da família (você, esposa, sogro, sogra). Todos veem a mesma viagem em tempo real.
- **Resumo**: total da viagem convertido para real, gasto em real x em dólar, barra de orçamento e gasto por pessoa.
- **Gastos**: lançar qualquer despesa (seguro, passaporte, passagem, hotel, comida, gasolina, ingresso, compras…), em USD ou BRL.
- **Cotação manual**: você digita quanto vale o dólar; o app converte tudo.
- **Divisão flexível**: em cada gasto escolhe quem participou e em quantas partes dividir.
- **Acerto**: mostra quem deve pra quem, no menor número de transferências.
- **Roteiro**: pontos de parada com o gasto de cada lugar.
- **PWA**: instala na tela inicial do celular e abre como app.

---

## Passo 1 — Criar o banco no Supabase (grátis)

1. Crie uma conta em https://supabase.com e um projeto novo.
2. Vá em **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique **Run**.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**
4. (Opcional) Em **Authentication → Providers → Email**, desligue "Confirm email" para entrar mais rápido durante os testes.

## Passo 2 — Rodar no seu computador

```bash
npm install
cp .env.local.example .env.local
# edite .env.local e cole a URL e a anon key do Supabase
npm run dev
```

Abra http://localhost:3000, crie sua conta e comece. Peça para a esposa, sogro e sogra criarem as contas deles — todos cairão na mesma viagem.

## Passo 3 — Subir o código no seu Git

O repositório já está definido. Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "V1 do app de viagem"
git branch -M main
git remote add origin https://github.com/carlaobh20/Viagem-EUA.git
git push -u origin main
```

Se o Git pedir usuário/senha, use seu usuário do GitHub e um **token de acesso pessoal** (PAT) como senha — gere em GitHub → Settings → Developer settings → Personal access tokens. **Esse token é seu; não compartilhe com ninguém.**

## Passo 4 — Publicar no Vercel

1. Entre em https://vercel.com com sua conta do GitHub.
2. **Add New → Project** e selecione o repositório `Viagem-EUA`.
3. Em **Environment Variables**, adicione as duas variáveis (os mesmos valores do `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique **Deploy**. A partir daí, todo `git push` publica sozinho.

No celular, abra o link do Vercel no navegador e use "Adicionar à tela de início" para instalar como app.

---

## Estrutura do projeto

```
app/                página, layout e estilos
components/          telas e navegação
  views/            Resumo, Gastos, Novo, Pessoas, Acerto, Roteiro
  DataProvider.js   carrega os dados e mantém o tempo real
lib/                supabase, formatação e o cálculo do acerto
supabase/schema.sql banco de dados (rode no Supabase)
public/             manifest, service worker e ícones do PWA
```

## Como apagar um gasto

Na aba **Gastos**, toque duas vezes no item e confirme.

## Próximas versões (ideias)

- Anexar foto da nota/recibo a cada gasto.
- Mais de uma viagem.
- Cotação automática do dia (hoje é manual, como você pediu).
- Relatório final em PDF para fechar as contas.

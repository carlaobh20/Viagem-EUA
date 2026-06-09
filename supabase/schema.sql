-- ============================================================
-- Viagem EUA · banco de dados (instalação nova) - versão 1.1
-- Para projeto novo. Se você JÁ rodou o schema antigo, use o
-- arquivo migracao-v2.sql em vez deste.
-- ============================================================

-- Pessoas da viagem. user_id liga a um login (opcional: pode ter pessoa sem login).
create table if not exists perfis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  cor text default '#0F6E56',
  criado_em timestamptz default now()
);

create table if not exists viagens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  orcamento_brl numeric default 0,
  cotacao_usd numeric default 5.40,
  criado_em timestamptz default now()
);

create table if not exists pontos_roteiro (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  nome text not null,
  data_inicio date,
  data_fim date,
  ordem int default 0
);

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  descricao text not null,
  valor numeric not null,
  moeda text not null check (moeda in ('USD', 'BRL')),
  cotacao numeric,                       -- cotação usada nesta compra (só USD)
  categoria text not null,
  pago_por uuid references perfis(id),
  ponto_id uuid references pontos_roteiro(id) on delete set null,
  data date default current_date,
  criado_em timestamptz default now()
);

create table if not exists gasto_divisao (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid references gastos(id) on delete cascade,
  perfil_id uuid references perfis(id) on delete cascade,
  partes numeric default 1
);

alter table perfis enable row level security;
alter table viagens enable row level security;
alter table pontos_roteiro enable row level security;
alter table gastos enable row level security;
alter table gasto_divisao enable row level security;

create policy "perfis_tudo" on perfis for all to authenticated using (true) with check (true);
create policy "viagens_tudo" on viagens for all to authenticated using (true) with check (true);
create policy "pontos_tudo" on pontos_roteiro for all to authenticated using (true) with check (true);
create policy "gastos_tudo" on gastos for all to authenticated using (true) with check (true);
create policy "divisao_tudo" on gasto_divisao for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table gastos;
alter publication supabase_realtime add table gasto_divisao;
alter publication supabase_realtime add table viagens;
alter publication supabase_realtime add table pontos_roteiro;
alter publication supabase_realtime add table perfis;

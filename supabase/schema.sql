-- ============================================================
-- Viagem EUA · banco de dados (Supabase / PostgreSQL)
-- Cole tudo isso no Supabase > SQL Editor > New query > Run
-- ============================================================

-- Perfis (1 por usuário logado da família)
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  cor text default '#0F6E56',
  criado_em timestamptz default now()
);

-- A viagem (a família compartilha uma só). cotacao_usd = quantos reais vale 1 dólar.
create table if not exists viagens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  orcamento_brl numeric default 0,
  cotacao_usd numeric default 5.40,
  criado_em timestamptz default now()
);

-- Pontos de parada do roteiro
create table if not exists pontos_roteiro (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  nome text not null,
  data_inicio date,
  data_fim date,
  ordem int default 0
);

-- Gastos
create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  descricao text not null,
  valor numeric not null,
  moeda text not null check (moeda in ('USD', 'BRL')),
  categoria text not null,
  pago_por uuid references perfis(id),
  ponto_id uuid references pontos_roteiro(id) on delete set null,
  data date default current_date,
  criado_em timestamptz default now()
);

-- Divisão de cada gasto: quem participou e o peso (partes) de cada um
create table if not exists gasto_divisao (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid references gastos(id) on delete cascade,
  perfil_id uuid references perfis(id),
  partes numeric default 1
);

-- ============================================================
-- Segurança (RLS). Modelo: grupo fechado da família —
-- qualquer pessoa logada enxerga e edita a viagem compartilhada.
-- ============================================================
alter table perfis enable row level security;
alter table viagens enable row level security;
alter table pontos_roteiro enable row level security;
alter table gastos enable row level security;
alter table gasto_divisao enable row level security;

-- Perfis: todos logados leem; cada um cria/edita o próprio
create policy "perfis_leitura" on perfis for select to authenticated using (true);
create policy "perfis_insere_proprio" on perfis for insert to authenticated with check (auth.uid() = id);
create policy "perfis_edita_proprio" on perfis for update to authenticated using (auth.uid() = id);

-- Demais tabelas: acesso total para usuários logados
create policy "viagens_tudo" on viagens for all to authenticated using (true) with check (true);
create policy "pontos_tudo" on pontos_roteiro for all to authenticated using (true) with check (true);
create policy "gastos_tudo" on gastos for all to authenticated using (true) with check (true);
create policy "divisao_tudo" on gasto_divisao for all to authenticated using (true) with check (true);

-- ============================================================
-- Tempo real: avisa os outros celulares quando algo muda
-- ============================================================
alter publication supabase_realtime add table gastos;
alter publication supabase_realtime add table gasto_divisao;
alter publication supabase_realtime add table viagens;
alter publication supabase_realtime add table pontos_roteiro;

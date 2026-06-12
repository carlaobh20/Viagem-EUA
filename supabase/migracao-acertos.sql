-- ATUALIZAÇÃO: histórico de acertos (quitação de dívidas)
-- Rode no Supabase > SQL Editor > New query > Run
create table if not exists acertos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  de uuid references perfis(id) on delete set null,
  para uuid references perfis(id) on delete set null,
  valor numeric not null,
  data date default current_date,
  criado_em timestamptz default now()
);
alter table acertos enable row level security;
drop policy if exists "acertos_tudo" on acertos;
create policy "acertos_tudo" on acertos for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table acertos;

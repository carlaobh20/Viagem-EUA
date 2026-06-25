-- V3.2 · Checklist da viagem
-- Rode no Supabase > SQL Editor > New query > cole tudo > Run.
create table if not exists checklist_itens (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  texto text not null,
  tema text default 'Geral',        -- Documentos | Bagagem | Saúde | Dinheiro | Antes de embarcar
  prazo text,                        -- '30d' | '7d' | '1d' | null
  feito boolean default false,
  ordem int default 0,
  criado_em timestamptz default now()
);
alter table checklist_itens enable row level security;
drop policy if exists "checklist_tudo" on checklist_itens;
create policy "checklist_tudo" on checklist_itens for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table checklist_itens;

-- marca se a viagem já recebeu o template (pra não repor depois que você apagar itens)
alter table viagens add column if not exists checklist_seed boolean default false;

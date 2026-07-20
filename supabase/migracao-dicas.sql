-- ============================================================
-- Dicas imperdíveis (descontos, bônus, macetes) — editável pela família.
-- Rode no Supabase (SQL Editor). Seguro rodar mesmo com dados.
-- ============================================================

create table if not exists dicas (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  categoria text not null default 'outros',
  titulo text not null,
  texto text,
  link text,
  criado_por uuid references perfis(id) on delete set null,
  criado_em timestamptz default now()
);

alter table dicas enable row level security;
drop policy if exists "dicas_tudo" on dicas;
create policy "dicas_tudo" on dicas for all to authenticated using (true) with check (true);

-- tempo real (ignore o erro se já estiver adicionada)
alter publication supabase_realtime add table dicas;

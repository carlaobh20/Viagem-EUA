-- V2.6 · Diário de KM rodados com o motorhome
-- Rode no Supabase > SQL Editor > New query > cole e Run.
create table if not exists registros_km (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid references viagens(id) on delete cascade,
  data date default current_date,
  km numeric not null,          -- sempre em KM (fonte única para somar/calcular)
  valor_origem numeric,         -- número como foi digitado
  unidade text default 'km',    -- 'km' ou 'mi' (o que foi digitado)
  origem text,
  destino text,
  nota text,
  criado_em timestamptz default now()
);
alter table registros_km enable row level security;
drop policy if exists "registros_km_tudo" on registros_km;
create policy "registros_km_tudo" on registros_km for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table registros_km;

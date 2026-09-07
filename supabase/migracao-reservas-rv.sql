-- Reservas de RV Park (campings do motorhome), noite a noite, com o documento da
-- reserva anexado (os arquivos ficam em Documentos, tipo "Motorhome / carro").
-- JÁ APLICADA no projeto Supabase em 07/09/2026 (migration reservas_rv). Não rode de novo.

create table if not exists reservas_rv (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references viagens(id) on delete cascade,
  user_id uuid default auth.uid(),
  nome text not null,                     -- ex.: Orlando / Kissimmee KOA
  checkin date,
  checkout date,
  endereco text,                          -- pro GPS
  telefone text,
  confirmacao text,                       -- nº da reserva
  valor numeric,
  moeda text default 'USD',               -- USD | BRL
  status text default 'reservado',        -- a_reservar | reservado | pago
  obs text,
  documento_id uuid references documentos(id) on delete set null,
  criado_em timestamptz default now()
);
alter table reservas_rv enable row level security;
drop policy if exists "reservas_rv_select" on reservas_rv;
drop policy if exists "reservas_rv_insert" on reservas_rv;
drop policy if exists "reservas_rv_update" on reservas_rv;
drop policy if exists "reservas_rv_delete" on reservas_rv;
create policy "reservas_rv_select" on reservas_rv for select to authenticated using (e_membro(viagem_id));
create policy "reservas_rv_insert" on reservas_rv for insert to authenticated with check (e_membro(viagem_id));
create policy "reservas_rv_update" on reservas_rv for update to authenticated using (e_membro(viagem_id)) with check (e_membro(viagem_id));
create policy "reservas_rv_delete" on reservas_rv for delete to authenticated using (e_membro(viagem_id));
create index if not exists reservas_rv_viagem_idx on reservas_rv (viagem_id, checkin);
alter publication supabase_realtime add table reservas_rv;

-- Passagem aérea: uma linha por trecho (ida / volta / extra), compartilhada com
-- todos da viagem. Quem pode ver/editar: membro da viagem (e_membro).
-- Já aplicada no projeto Supabase em 06/09/2026 (migration passagens_aereas).
create table if not exists passagens (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references viagens(id) on delete cascade,
  user_id uuid default auth.uid(),
  sentido text not null default 'ida',       -- 'ida' | 'volta' | 'outro'
  companhia text,                            -- ex.: LATAM
  telefone text,                             -- 0800 / SAC da companhia
  origem text,                               -- ex.: GRU · São Paulo
  destino text,                              -- ex.: MCO · Orlando
  data date,
  hora text,                                 -- 'HH:MM' (saída)
  hora_chegada text,                         -- 'HH:MM' (opcional)
  voo text,                                  -- ex.: LA 8084
  localizador text,                          -- código de reserva (PNR)
  pedido text,                               -- número do pedido / e-ticket
  passageiros text,                          -- nomes, separados por vírgula
  assentos text,                             -- ex.: 12A, 12B
  obs text,
  criado_em timestamptz default now()
);
alter table passagens enable row level security;
drop policy if exists "passagens_select" on passagens;
drop policy if exists "passagens_insert" on passagens;
drop policy if exists "passagens_update" on passagens;
drop policy if exists "passagens_delete" on passagens;
create policy "passagens_select" on passagens for select to authenticated using (e_membro(viagem_id));
create policy "passagens_insert" on passagens for insert to authenticated with check (e_membro(viagem_id));
create policy "passagens_update" on passagens for update to authenticated using (e_membro(viagem_id)) with check (e_membro(viagem_id));
create policy "passagens_delete" on passagens for delete to authenticated using (e_membro(viagem_id));
create index if not exists passagens_viagem_idx on passagens (viagem_id, data);
alter publication supabase_realtime add table passagens;

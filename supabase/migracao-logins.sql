-- Aba "Logins": guarda o acesso dos apps/sites usados na viagem (companhia aérea,
-- locadora, parque, wi-fi do camping). PADRÃO É PRIVADO: só quem cadastrou vê,
-- a menos que marque como compartilhado com a viagem.
-- JÁ APLICADA no projeto Supabase em 14/09/2026 (migration logins_apps_viagem). Não rode de novo.
--
-- ATENÇÃO (registro consciente do risco): a senha é gravada em texto no banco.
-- A proteção é o RLS (só membros da viagem; item privado só o dono) e o padrão
-- privado. Quem tem acesso ao painel do Supabase lê tudo. Por isso a tela avisa
-- pra NÃO usar isso pra banco, cartão e e-mail principal.

create table if not exists logins_app (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references viagens(id) on delete cascade,
  user_id uuid default auth.uid(),
  app text not null,                 -- nome do app/site (ex.: American Airlines)
  usuario text,                      -- login, e-mail ou número de fidelidade
  senha text,                        -- senha / PIN
  url text,                          -- endereço do site, opcional
  obs text,                          -- anotações (nº do programa, pergunta secreta...)
  privado boolean default true,      -- true = só eu vejo
  criado_em timestamptz default now()
);
alter table logins_app enable row level security;
drop policy if exists "logins_app_select" on logins_app;
drop policy if exists "logins_app_insert" on logins_app;
drop policy if exists "logins_app_update" on logins_app;
drop policy if exists "logins_app_delete" on logins_app;
create policy "logins_app_select" on logins_app for select to authenticated
  using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()));
create policy "logins_app_insert" on logins_app for insert to authenticated
  with check (e_membro(viagem_id) and user_id = auth.uid());
create policy "logins_app_update" on logins_app for update to authenticated
  using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()))
  with check (e_membro(viagem_id));
create policy "logins_app_delete" on logins_app for delete to authenticated
  using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()));
create index if not exists logins_app_viagem_idx on logins_app (viagem_id, app);
alter publication supabase_realtime add table logins_app;

-- Privacidade por gasto: permite marcar um lançamento como "só eu vejo" (ex.: passagem aérea que é surpresa).
-- Já rodei isso direto no banco em produção; este arquivo é só para o histórico do projeto ficar consistente.
-- Se precisar rodar de novo (ex.: banco novo/local): Supabase > SQL Editor > New query > cole tudo > Run.

alter table gastos add column if not exists privado boolean not null default false;
alter table gastos add column if not exists user_id uuid references auth.users(id) on delete set null;

-- O banco já tinha políticas "gastos_select/insert/update/delete" baseadas em e_membro(viagem_id)
-- (mais uma política antiga "gastos_tudo" liberando tudo, que anulava as outras). Removi a antiga
-- e recriei só a de leitura, somando a regra de privacidade às demais (que já eram restritas por viagem).
drop policy if exists "gastos_tudo" on gastos;
drop policy if exists "gastos_select" on gastos;
create policy "gastos_select" on gastos for select to authenticated using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()));

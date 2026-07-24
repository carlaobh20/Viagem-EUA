-- Conserta o erro "new row violates row-level security policy for table gastos".
--
-- Causa: em migracao-gasto-privado.sql a política antiga "gastos_tudo" (que liberava
-- inserir/editar/apagar) foi removida, mas a política de INSERT não existia de fato —
-- então salvar um gasto passou a ser bloqueado pelo RLS. Ler continuou funcionando
-- porque a "gastos_select" foi recriada.
--
-- Este script recria as políticas de escrita (insert/update/delete) da tabela gastos.
-- Rode no Supabase > SQL Editor > New query > cole tudo > Run. Pode rodar com dados.

-- INSERT: só logado, e só criando o gasto em nome de si mesmo, numa viagem da qual é membro.
drop policy if exists "gastos_insert" on gastos;
create policy "gastos_insert" on gastos for insert to authenticated
  with check (e_membro(viagem_id) and user_id = auth.uid());

-- UPDATE: qualquer membro da viagem pode editar (grupo fechado).
drop policy if exists "gastos_update" on gastos;
create policy "gastos_update" on gastos for update to authenticated
  using (e_membro(viagem_id)) with check (e_membro(viagem_id));

-- DELETE: qualquer membro da viagem pode apagar.
drop policy if exists "gastos_delete" on gastos;
create policy "gastos_delete" on gastos for delete to authenticated
  using (e_membro(viagem_id));

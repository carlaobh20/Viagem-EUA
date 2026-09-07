-- Checklist e lista de Compras passam a ser INDIVIDUAIS de verdade (por login):
-- cada pessoa só vê, edita e apaga os próprios itens. Antes, a política
-- "checklist_tudo" deixava qualquer membro apagar item de qualquer um, e os itens
-- antigos sem dono (user_id nulo) apareciam pra todo mundo.
-- Exceção: o tema 'Mercado' (suprimentos do motorhome, dentro da tela Motorhome)
-- continua compartilhado com o grupo — é lista de compra da viagem, não da pessoa.
-- Já aplicada no projeto Supabase em 06/09/2026 (migration checklist_individual_moeda).

-- 1) Moeda do valor do item na lista de Compras (R$ ou US$)
alter table checklist_itens add column if not exists moeda text default 'BRL';

-- 2) Itens antigos sem dono viram do criador da viagem (só fora do Mercado)
update checklist_itens c set user_id = v.owner_id
from viagens v
where c.viagem_id = v.id and c.user_id is null and c.tema <> 'Mercado';

-- 3) Regras de acesso
drop policy if exists "checklist_tudo" on checklist_itens;
drop policy if exists "checklist_select" on checklist_itens;
drop policy if exists "checklist_insert" on checklist_itens;
drop policy if exists "checklist_update" on checklist_itens;
drop policy if exists "checklist_delete" on checklist_itens;
create policy "checklist_select" on checklist_itens for select to authenticated
  using (e_membro(viagem_id) and (tema = 'Mercado' or user_id = auth.uid()));
create policy "checklist_insert" on checklist_itens for insert to authenticated
  with check (e_membro(viagem_id) and user_id = auth.uid());
create policy "checklist_update" on checklist_itens for update to authenticated
  using (e_membro(viagem_id) and (tema = 'Mercado' or user_id = auth.uid()))
  with check (e_membro(viagem_id) and (tema = 'Mercado' or user_id = auth.uid()));
create policy "checklist_delete" on checklist_itens for delete to authenticated
  using (e_membro(viagem_id) and (tema = 'Mercado' or user_id = auth.uid()));

-- Conserta o RLS da tabela gastos de forma DEFINITIVA.
--
-- Sintomas:
--   * Criar gasto novo funcionava, mas EDITAR um gasto existente dava
--     "new row violates row-level security policy for table gastos".
--
-- Causa: sobraram politicas antigas de UPDATE/DELETE na tabela (de versoes
-- anteriores, com nomes que nao conheciamos) exigindo user_id = auth.uid().
-- Gastos antigos tem user_id nulo (ou de outra pessoa), entao a edicao batia
-- nessa checagem e era bloqueada. Como nao da pra saber o nome de cada politica
-- antiga, este script APAGA todas as politicas da tabela gastos e recria um
-- conjunto limpo e correto.
--
-- Rode no Supabase > SQL Editor > New query > cole tudo > Run. Pode rodar com dados.

-- 1) Remove QUALQUER politica existente na tabela gastos (limpa o terreno).
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'gastos' loop
    execute format('drop policy %I on public.gastos', p.policyname);
  end loop;
end $$;

-- 2) Recria o conjunto correto de politicas.

-- LEITURA: membro da viagem ve os gastos publicos; os restritos so o dono do
-- gasto ou quem estiver liberado em gasto_visto_por.
create policy "gastos_select" on gastos for select to authenticated using (
  e_membro(viagem_id) and (
    privado = false
    or user_id = auth.uid()
    or exists (
      select 1 from gasto_visto_por gv
      join perfis p on p.id = gv.perfil_id
      where gv.gasto_id = gastos.id and p.user_id = auth.uid()
    )
  )
);

-- INSERIR: logado, membro da viagem, criando o gasto em nome de si mesmo.
create policy "gastos_insert" on gastos for insert to authenticated
  with check (e_membro(viagem_id) and user_id = auth.uid());

-- EDITAR: qualquer membro da viagem edita (grupo fechado). Nao depende de user_id,
-- por isso passa mesmo em gastos antigos com user_id nulo.
create policy "gastos_update" on gastos for update to authenticated
  using (e_membro(viagem_id)) with check (e_membro(viagem_id));

-- APAGAR: qualquer membro da viagem apaga.
create policy "gastos_delete" on gastos for delete to authenticated
  using (e_membro(viagem_id));

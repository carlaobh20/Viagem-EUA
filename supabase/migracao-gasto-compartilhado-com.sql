-- Compras/Gastos privados: em vez de só "só eu vejo" ou "todo mundo vê", permite escolher
-- especificamente quem da viagem também pode ver um gasto marcado como restrito.
-- Rode no Supabase > SQL Editor > New query > cole tudo > Run.

create table if not exists gasto_visto_por (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid references gastos(id) on delete cascade,
  perfil_id uuid references perfis(id) on delete cascade
);
alter table gasto_visto_por enable row level security;
drop policy if exists "gasto_visto_por_tudo" on gasto_visto_por;
create policy "gasto_visto_por_tudo" on gasto_visto_por for all to authenticated using (true) with check (true);

-- Atualiza a política de leitura dos gastos: além do dono do gasto, também pode ver
-- quem estiver listado em gasto_visto_por para aquele gasto especificamente.
drop policy if exists "gastos_select" on gastos;
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

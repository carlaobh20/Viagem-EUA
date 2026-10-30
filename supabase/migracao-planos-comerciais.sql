-- Planos comerciais por viagem.
-- Viagens existentes continuam como Família para preservar todos os acessos atuais.
alter table public.viagens
  add column if not exists plano text not null default 'familia',
  add column if not exists acesso_expira_em timestamptz;

alter table public.viagens drop constraint if exists viagens_plano_check;
alter table public.viagens
  add constraint viagens_plano_check check (plano in ('individual', 'familia'));

create index if not exists viagem_membros_viagem_id_idx
  on public.viagem_membros (viagem_id);

-- Convites são gerados somente pelo dono e somente quando o plano comporta
-- outro login. A função retorna JSON para manter mensagens claras no app.
create or replace function public.gerar_convite_plano(p_viagem_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viagem public.viagens%rowtype;
  v_total integer;
  v_limite integer;
  v_codigo text;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('erro', 'Faça login para convidar.');
  end if;

  select * into v_viagem
  from public.viagens
  where id = p_viagem_id
  for update;

  if v_viagem.id is null or v_viagem.owner_id <> (select auth.uid()) then
    return jsonb_build_object('erro', 'Só o dono da viagem pode convidar.');
  end if;

  if v_viagem.acesso_expira_em is not null and v_viagem.acesso_expira_em <= now() then
    return jsonb_build_object('erro', 'O acesso desta viagem expirou.');
  end if;

  v_limite := case when v_viagem.plano = 'individual' then 1 else 5 end;
  select count(*) into v_total from public.viagem_membros where viagem_id = p_viagem_id;
  if v_total >= v_limite then
    return jsonb_build_object(
      'erro', case when v_limite = 1
        then 'O plano Individual tem acesso somente para o comprador. Use o plano Família para convidar.'
        else 'O plano Família já atingiu o limite de 5 acessos.' end,
      'total_acessos', v_total,
      'limite', v_limite
    );
  end if;

  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.convites where codigo = v_codigo);
  end loop;

  insert into public.convites (viagem_id, codigo, criado_por)
  values (p_viagem_id, v_codigo, (select auth.uid()));

  return jsonb_build_object('ok', true, 'codigo', v_codigo, 'total_acessos', v_total, 'limite', v_limite);
end;
$$;

-- A entrada é atômica: a viagem é bloqueada durante a contagem para impedir
-- que dois convites ultrapassem o quinto acesso ao mesmo tempo.
create or replace function public.entrar_viagem_por_convite(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_convite public.convites%rowtype;
  v_viagem public.viagens%rowtype;
  v_total integer;
  v_limite integer;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('erro', 'Faça login para entrar na viagem.');
  end if;

  select * into v_convite
  from public.convites
  where codigo = upper(trim(p_codigo)) and ativo = true
  limit 1;

  if v_convite.viagem_id is null then
    return jsonb_build_object('erro', 'Convite inválido ou expirado.');
  end if;

  select * into v_viagem
  from public.viagens
  where id = v_convite.viagem_id
  for update;

  if exists (
    select 1 from public.viagem_membros
    where viagem_id = v_viagem.id and user_id = (select auth.uid())
  ) then
    return jsonb_build_object('ok', true, 'viagem_id', v_viagem.id);
  end if;

  if v_viagem.acesso_expira_em is not null and v_viagem.acesso_expira_em <= now() then
    return jsonb_build_object('erro', 'O acesso desta viagem expirou.');
  end if;

  v_limite := case when v_viagem.plano = 'individual' then 1 else 5 end;
  select count(*) into v_total from public.viagem_membros where viagem_id = v_viagem.id;
  if v_total >= v_limite then
    return jsonb_build_object(
      'erro', case when v_limite = 1
        then 'Esta viagem usa o plano Individual e não aceita outros acessos.'
        else 'Esta viagem já atingiu o limite de 5 acessos.' end
    );
  end if;

  insert into public.viagem_membros (viagem_id, user_id, papel)
  values (v_viagem.id, (select auth.uid()), 'membro')
  on conflict (viagem_id, user_id) do nothing;

  return jsonb_build_object('ok', true, 'viagem_id', v_viagem.id);
end;
$$;

revoke all on function public.gerar_convite_plano(uuid) from public, anon;
revoke all on function public.entrar_viagem_por_convite(text) from public, anon;
grant execute on function public.gerar_convite_plano(uuid) to authenticated;
grant execute on function public.entrar_viagem_por_convite(text) to authenticated;

-- FASE 3a · pessoas por viagem
alter table perfis add column if not exists viagem_id uuid references viagens(id) on delete cascade;

-- pessoas que já existem vão para a viagem mais antiga (a Viagem EUA original)
update perfis
  set viagem_id = (select id from viagens order by criado_em asc limit 1)
  where viagem_id is null;

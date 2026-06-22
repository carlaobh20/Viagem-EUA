-- V1.6 · Período do motorhome (retirada e entrega)
-- Permite calcular o custo por dia exato sobre os dias de RV, e não sobre os dias de viagem.
-- Rode isto no Supabase: Dashboard > SQL Editor > New query > cole e Run.

alter table viagens add column if not exists mh_retirada date;
alter table viagens add column if not exists mh_entrega date;

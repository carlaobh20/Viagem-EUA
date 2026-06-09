-- ============================================================
-- ATUALIZAÇÃO v2 - rode no Supabase (SQL Editor) se você JÁ tinha
-- rodado o schema antigo. Pode rodar com segurança mesmo com dados.
-- ============================================================

-- 1) Permitir criar pessoas sem login (desliga a ligação obrigatória)
alter table perfis drop constraint if exists perfis_id_fkey;
alter table perfis alter column id set default gen_random_uuid();
alter table perfis add column if not exists user_id uuid references auth.users(id) on delete set null;
update perfis set user_id = id where user_id is null;

-- 2) Segurança: grupo fechado, qualquer logado gerencia as pessoas
drop policy if exists "perfis_leitura" on perfis;
drop policy if exists "perfis_insere_proprio" on perfis;
drop policy if exists "perfis_edita_proprio" on perfis;
drop policy if exists "perfis_tudo" on perfis;
create policy "perfis_tudo" on perfis for all to authenticated using (true) with check (true);

-- 3) Cotação por compra
alter table gastos add column if not exists cotacao numeric;

-- 4) Tempo real para a tabela de pessoas (ignore erro se já estiver adicionada)
alter publication supabase_realtime add table perfis;

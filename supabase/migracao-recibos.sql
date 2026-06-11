-- ATUALIZAÇÃO: foto de recibo (armazenamento + coluna)
-- Rode no Supabase > SQL Editor > New query > Run

-- 1) Coluna que guarda o link da foto no gasto
alter table gastos add column if not exists recibo_url text;

-- 2) "Pasta" (bucket) pública para as fotos dos recibos
insert into storage.buckets (id, name, public) values ('recibos', 'recibos', true)
on conflict (id) do nothing;

-- 3) Permissões: logado pode enviar; leitura liberada (bucket público)
drop policy if exists "recibos_select" on storage.objects;
create policy "recibos_select" on storage.objects for select using (bucket_id = 'recibos');
drop policy if exists "recibos_insert" on storage.objects;
create policy "recibos_insert" on storage.objects for insert to authenticated with check (bucket_id = 'recibos');

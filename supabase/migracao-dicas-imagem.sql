-- ============================================================
-- Dicas: suporte a IMAGEM (print do Instagram etc.)
-- Rode no Supabase (SQL Editor) DEPOIS da migracao-dicas.sql. Seguro rodar com dados.
-- ============================================================

-- coluna que guarda o CAMINHO da imagem no storage (não a URL)
alter table dicas add column if not exists imagem text;

-- título deixa de ser obrigatório: dá pra colar só a imagem
alter table dicas alter column titulo drop not null;

-- bucket privado só pra imagens de dicas (não público — só quem está logado vê, via URL assinada)
insert into storage.buckets (id, name, public) values ('dicas', 'dicas', false) on conflict (id) do nothing;

drop policy if exists "dicas_img_select" on storage.objects;
create policy "dicas_img_select" on storage.objects for select to authenticated using (bucket_id = 'dicas');

drop policy if exists "dicas_img_insert" on storage.objects;
create policy "dicas_img_insert" on storage.objects for insert to authenticated with check (bucket_id = 'dicas');

-- Um documento pode ter VÁRIOS arquivos (ex.: "ESTA" com o de cada pessoa da
-- família). Os arquivos saem da coluna documentos.arquivo e vão pra tabela própria.
-- JÁ APLICADA no projeto Supabase em 07/09/2026 (migration documentos_varios_arquivos).
-- Não precisa rodar de novo — este arquivo é só registro.

create table if not exists documento_arquivos (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documentos(id) on delete cascade,
  viagem_id uuid not null references viagens(id) on delete cascade,
  nome text,                            -- nome que a pessoa vê (ex.: "ESTA Carlos.pdf")
  arquivo text not null,                -- caminho no bucket "documentos": <viagem_id>/<...>
  mime text,
  tamanho bigint,
  ordem int default 0,
  criado_em timestamptz default now()
);
alter table documento_arquivos enable row level security;
drop policy if exists "docarq_select" on documento_arquivos;
drop policy if exists "docarq_insert" on documento_arquivos;
drop policy if exists "docarq_delete" on documento_arquivos;
-- mesma regra do documento pai: membro da viagem, e (não privado ou dono)
create policy "docarq_select" on documento_arquivos for select to authenticated
  using (exists (select 1 from documentos d where d.id = documento_id and e_membro(d.viagem_id) and (d.privado = false or d.user_id = auth.uid())));
create policy "docarq_insert" on documento_arquivos for insert to authenticated
  with check (exists (select 1 from documentos d where d.id = documento_id and e_membro(d.viagem_id) and (d.privado = false or d.user_id = auth.uid())));
create policy "docarq_delete" on documento_arquivos for delete to authenticated
  using (exists (select 1 from documentos d where d.id = documento_id and e_membro(d.viagem_id) and (d.privado = false or d.user_id = auth.uid())));
create index if not exists docarq_doc_idx on documento_arquivos (documento_id, ordem);
alter publication supabase_realtime add table documento_arquivos;

-- Migra o que já existia (um arquivo por documento) e libera a coluna antiga
insert into documento_arquivos (documento_id, viagem_id, nome, arquivo, mime, tamanho, ordem)
select id, viagem_id, titulo, arquivo, mime, tamanho, 0 from documentos
where arquivo is not null and not exists (select 1 from documento_arquivos a where a.documento_id = documentos.id);
alter table documentos alter column arquivo drop not null;

-- Correção 07/09 (migration documento_arquivos_ordem_bigint, já aplicada): a coluna
-- "ordem" recebia Date.now() e estourava o int4 → o arquivo subia e era apagado.
alter table documento_arquivos alter column ordem type bigint;

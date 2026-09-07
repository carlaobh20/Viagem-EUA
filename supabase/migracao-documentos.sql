-- Documentos da viagem: PDFs e fotos (passagens, reserva do motorhome, ESTA,
-- seguro, passaporte...). Compartilhados com quem está na viagem; um documento
-- pode ser marcado "só eu vejo" (passaporte, por exemplo).
-- Já aplicada no projeto Supabase em 07/09/2026 (migration documentos_viagem).

create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references viagens(id) on delete cascade,
  user_id uuid default auth.uid(),
  titulo text not null,
  categoria text default 'outros',      -- passagem | hospedagem | motorhome | visto | seguro | identidade | carro | outros
  arquivo text not null,                -- caminho no bucket "documentos": <viagem_id>/<id>.<ext>
  mime text,
  tamanho bigint,
  obs text,
  privado boolean default false,
  criado_em timestamptz default now()
);
alter table documentos enable row level security;
drop policy if exists "documentos_select" on documentos;
drop policy if exists "documentos_insert" on documentos;
drop policy if exists "documentos_update" on documentos;
drop policy if exists "documentos_delete" on documentos;
create policy "documentos_select" on documentos for select to authenticated
  using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()));
create policy "documentos_insert" on documentos for insert to authenticated
  with check (e_membro(viagem_id) and user_id = auth.uid());
create policy "documentos_update" on documentos for update to authenticated
  using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()))
  with check (e_membro(viagem_id));
create policy "documentos_delete" on documentos for delete to authenticated
  using (e_membro(viagem_id) and (privado = false or user_id = auth.uid()));
create index if not exists documentos_viagem_idx on documentos (viagem_id, categoria);
alter publication supabase_realtime add table documentos;

-- Bucket privado (acesso só por link assinado, 1 h). Pasta = id da viagem.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists "documentos_arq_select" on storage.objects;
drop policy if exists "documentos_arq_insert" on storage.objects;
drop policy if exists "documentos_arq_delete" on storage.objects;
create policy "documentos_arq_select" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and e_membro(((storage.foldername(name))[1])::uuid));
create policy "documentos_arq_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and e_membro(((storage.foldername(name))[1])::uuid));
create policy "documentos_arq_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and e_membro(((storage.foldername(name))[1])::uuid));

-- Valor (preço) por item da lista de Compras — pode ser preenchido antes ou depois de marcar como comprado.
-- Rode no Supabase > SQL Editor > New query > cole tudo > Run.
alter table checklist_itens add column if not exists valor numeric;
alter table checklist_itens add column if not exists user_id uuid references auth.users(id) on delete set null;

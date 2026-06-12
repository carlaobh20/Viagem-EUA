-- ATUALIZAÇÃO: permitir acerto em dólar (guarda a moeda de cada pagamento)
-- Rode no Supabase > SQL Editor > New query > Run
alter table acertos add column if not exists moeda text not null default 'BRL';

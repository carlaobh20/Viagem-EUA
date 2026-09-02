-- Roteiro: endereço exato da parada (usado verbatim pelo GPS — Google Maps / Waze).
-- lat/lng continuam existindo só pra previsão do tempo e distância entre paradas;
-- não são mais usados pra navegar (o buscador gratuito já mandou um hotel de
-- Orlando pra Itália).
-- Já aplicada no projeto Supabase em 02/09/2026 (migration roteiro_endereco_exato).
alter table pontos_roteiro add column if not exists endereco text;

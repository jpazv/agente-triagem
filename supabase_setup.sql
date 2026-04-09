-- Tabela de protocolos clínicos (sem coluna embedding — busca via full-text)
create table if not exists protocolos (
  id bigserial primary key,
  titulo text,
  conteudo text
);

-- Tabela de histórico de conversas
create table if not exists conversas (
  id bigserial primary key,
  sessao_id text,
  role text,
  conteudo text,
  criado_em timestamp default now()
);

-- Função RPC para busca de protocolos relevantes via full-text search do PostgreSQL.
-- Usa plainto_tsquery com idioma português + fallback ILIKE para garantir resultados.
-- Chamada em /api/chat como: db.rpc('match_protocolos', { query_text, match_count })
create or replace function match_protocolos(
  query_text text,
  match_count int default 3
)
returns table (
  id bigint,
  titulo text,
  conteudo text,
  similarity float
)
language sql stable
as $$
  select
    id,
    titulo,
    conteudo,
    ts_rank(
      to_tsvector('portuguese', titulo || ' ' || conteudo),
      plainto_tsquery('portuguese', query_text)
    ) as similarity
  from protocolos
  where
    to_tsvector('portuguese', titulo || ' ' || conteudo) @@ plainto_tsquery('portuguese', query_text)
    or titulo ilike '%' || query_text || '%'
    or conteudo ilike '%' || query_text || '%'
  order by similarity desc
  limit match_count;
$$;

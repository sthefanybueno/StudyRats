-- StudyRats: schema completo + segurança do backend Supabase (executar no SQL Editor). 100% Idempotente.
-- Funciona tanto em projeto Supabase novo (cria as tabelas) quanto em projeto já existente (atualiza colunas, RLS e PostGIS).

-- 0) Extensão PostGIS (no schema extensions para não expor spatial_ref_sys no PostgREST) e Tabelas Base
create extension if not exists postgis with schema extensions;

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome_exibicao text not null default 'Estudante',
  nome_usuario text,
  foto_url text,
  meta_diaria_minutos integer not null default 60,
  xp_total integer not null default 0,
  xp_semanal integer not null default 0,
  streak_atual integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfis
  add column if not exists nome_usuario text,
  add column if not exists foto_url text,
  add column if not exists meta_diaria_minutos integer not null default 60;

create unique index if not exists idx_perfis_nome_usuario_unique
  on public.perfis (lower(nome_usuario))
  where nome_usuario is not null;

create table if not exists public.disciplinas (
  id text primary key,
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  cor text not null default '#208AEF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.topicos (
  id text primary key,
  disciplina_id text not null references public.disciplinas(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.sessoes_estudo (
  id text primary key,
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  disciplina_id text not null,
  topico_id text not null,
  duracao_minutos integer not null,
  latitude double precision,
  longitude double precision,
  accuracy real,
  local_aproximado text,
  foto_url text,
  geom geography(Point, 4326),
  created_at timestamptz not null default now()
);

alter table public.sessoes_estudo
  add column if not exists foto_url text;

create table if not exists public.fotos_sessao (
  id text primary key,
  sessao_id text not null references public.sessoes_estudo(id) on delete cascade,
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.fotos_sessao
  add column if not exists storage_path text,
  add column if not exists created_at timestamptz not null default now();

-- Compatibilidade com schema legado: se url_remota existir com NOT NULL, remove a restrição
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fotos_sessao' and column_name = 'url_remota'
  ) then
    alter table public.fotos_sessao alter column url_remota drop not null;
  end if;
end;
$$;

alter table public.fotos_sessao enable row level security;

-- Trigger para criar automaticamente o perfil em public.perfis quando um usuário se cadastra no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome_exibicao, xp_total, xp_semanal, streak_atual)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome_exibicao', split_part(new.email, '@', 1), 'Estudante'),
    0, 0, 0
  )
  on conflict (id) do update set
    email = excluded.email,
    nome_exibicao = coalesce(excluded.nome_exibicao, public.perfis.nome_exibicao);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 1) Permissões de Tabela (GRANT) e Row Level Security (RLS)
-- O Postgres exige GRANT na tabela para o papel 'authenticated' antes de avaliar as policies RLS.
grant usage on schema public to anon, authenticated;
grant usage on schema extensions to anon, authenticated;

grant select, insert, update, delete on table public.perfis to authenticated;
grant select, insert, update, delete on table public.disciplinas to authenticated;
grant select, insert, update, delete on table public.topicos to authenticated;
grant select, insert, update, delete on table public.sessoes_estudo to authenticated;
grant select, insert, update, delete on table public.fotos_sessao to authenticated;

revoke all on table public.perfis from anon;
revoke all on table public.disciplinas from anon;
revoke all on table public.topicos from anon;
revoke all on table public.sessoes_estudo from anon;
revoke all on table public.fotos_sessao from anon;

alter table public.perfis          enable row level security;
alter table public.sessoes_estudo  enable row level security;
alter table public.disciplinas     enable row level security;
alter table public.topicos         enable row level security;

-- perfis: qualquer usuário autenticado lê (ranking); só altera o próprio
-- Otimização (select auth.uid()) para cachear UID por query (PDF 03, slides 19 e 21)
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis for select to authenticated using (true);
drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis for insert to authenticated
  with check (id = (select auth.uid()));
drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- sessoes_estudo: qualquer usuário autenticado pode ler no Feed / PostGIS (com minimização LGPD no app),
-- mas somente o próprio dono pode criar, alterar ou excluir suas sessões (PDF 03, slides 19-20)
drop policy if exists sessoes_owner on public.sessoes_estudo;
drop policy if exists sessoes_select on public.sessoes_estudo;
create policy sessoes_select on public.sessoes_estudo for select to authenticated
  using (true);
drop policy if exists sessoes_insert on public.sessoes_estudo;
create policy sessoes_insert on public.sessoes_estudo for insert to authenticated
  with check (usuario_id = (select auth.uid()));
drop policy if exists sessoes_update on public.sessoes_estudo;
create policy sessoes_update on public.sessoes_estudo for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists sessoes_delete on public.sessoes_estudo;
create policy sessoes_delete on public.sessoes_estudo for delete to authenticated
  using (usuario_id = (select auth.uid()));

-- disciplinas: somente o dono
drop policy if exists disciplinas_owner on public.disciplinas;
create policy disciplinas_owner on public.disciplinas for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- topicos: somente se a disciplina pertencer ao usuário
drop policy if exists topicos_owner on public.topicos;
create policy topicos_owner on public.topicos for all to authenticated
  using (exists (select 1 from public.disciplinas d where d.id = disciplina_id and d.usuario_id = (select auth.uid())))
  with check (exists (select 1 from public.disciplinas d where d.id = disciplina_id and d.usuario_id = (select auth.uid())));

-- fotos_sessao: qualquer usuário autenticado lê metadados para o Feed; somente o dono da sessão insere, altera ou exclui
drop policy if exists fotos_sessao_owner on public.fotos_sessao;
drop policy if exists fotos_sessao_select on public.fotos_sessao;
create policy fotos_sessao_select on public.fotos_sessao for select to authenticated
  using (true);
drop policy if exists fotos_sessao_insert on public.fotos_sessao;
create policy fotos_sessao_insert on public.fotos_sessao for insert to authenticated
  with check (exists (select 1 from public.sessoes_estudo s where s.id = sessao_id and s.usuario_id = (select auth.uid())));
drop policy if exists fotos_sessao_update on public.fotos_sessao;
create policy fotos_sessao_update on public.fotos_sessao for update to authenticated
  using (exists (select 1 from public.sessoes_estudo s where s.id = sessao_id and s.usuario_id = (select auth.uid())))
  with check (exists (select 1 from public.sessoes_estudo s where s.id = sessao_id and s.usuario_id = (select auth.uid())));
drop policy if exists fotos_sessao_delete on public.fotos_sessao;
create policy fotos_sessao_delete on public.fotos_sessao for delete to authenticated
  using (exists (select 1 from public.sessoes_estudo s where s.id = sessao_id and s.usuario_id = (select auth.uid())));

-- Índices nas chaves de filtro das policies RLS para desempenho (PDF 03, slide 21)
create index if not exists idx_sessoes_estudo_usuario_id on public.sessoes_estudo (usuario_id, created_at desc);
create index if not exists idx_disciplinas_usuario_id on public.disciplinas (usuario_id);
create index if not exists idx_topicos_disciplina_id on public.topicos (disciplina_id);
create index if not exists idx_fotos_sessao_sessao_id on public.fotos_sessao (sessao_id);

-- 2) Storage: bucket de fotos de sessão (leitura pública igual ao bucket de avatares para exibir no Feed;
-- escrita/exclusão apenas pelo dono na sua pasta auth.uid(), limite de 5 MB e MIME types restritos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos_sessao', 'fotos_sessao', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png'];

drop policy if exists fotos_insert on storage.objects;
create policy fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists fotos_update on storage.objects;
create policy fotos_update on storage.objects for update to authenticated
  using (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists fotos_select on storage.objects;
create policy fotos_select on storage.objects for select to public
  using (bucket_id = 'fotos_sessao');
drop policy if exists fotos_delete on storage.objects;
create policy fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Backfill: vincula em public.fotos_sessao as fotos já enviadas ao bucket antes da liberação da tabela
insert into public.fotos_sessao (id, sessao_id, storage_path, created_at)
select
  s.id || '-foto',
  s.id,
  o.name,
  coalesce(o.created_at, s.created_at)
from storage.objects o
join public.sessoes_estudo s
  on o.bucket_id = 'fotos_sessao'
 and split_part(o.name, '/', 1) = s.usuario_id::text
 and split_part(split_part(o.name, '/', 2), '.', 1) = s.id
on conflict (id) do update set
  storage_path = excluded.storage_path;

-- Backfill de foto_url direto em sessoes_estudo (mesmo padrão de perfis.foto_url)
update public.sessoes_estudo s
set foto_url = o.name
from storage.objects o
where o.bucket_id = 'fotos_sessao'
  and split_part(o.name, '/', 1) = s.usuario_id::text
  and split_part(split_part(o.name, '/', 2), '.', 1) = s.id
  and (s.foto_url is null or s.foto_url = '');

update public.sessoes_estudo s
set foto_url = f.storage_path
from public.fotos_sessao f
where f.sessao_id = s.id
  and f.storage_path is not null
  and (s.foto_url is null or s.foto_url = '');

-- 2.1) Storage: bucket de avatares de perfil (leitura pública para Ranking/Feed, escrita apenas pelo dono)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png'];

drop policy if exists avatares_select on storage.objects;
create policy avatares_select on storage.objects for select to public
  using (bucket_id = 'avatares');
drop policy if exists avatares_insert on storage.objects;
create policy avatares_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatares_update on storage.objects;
create policy avatares_update on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatares_delete on storage.objects;
create policy avatares_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3) Limpeza de policies antigas criadas manualmente no painel (aplicado em 23/11/2026).
-- Leituras públicas (sem login) e duplicatas já cobertas pelas policies acima.
drop policy if exists "Leitura de sessões para o Feed" on public.sessoes_estudo;
drop policy if exists "Usuários podem ver todos os perfis (Ranking)" on public.perfis;
drop policy if exists "Visualização de fotos para o Feed" on public.fotos_sessao;
drop policy if exists "Usuários inserem fotos de suas sessões" on public.fotos_sessao;
drop policy if exists "Usuários inserem suas próprias sessões" on public.sessoes_estudo;
drop policy if exists "Usuários gerenciam suas próprias disciplinas" on public.disciplinas;
drop policy if exists "Usuários gerenciam tópicos de suas disciplinas" on public.topicos;
drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.perfis;
drop policy if exists "Acesso público às fotos de caderno" on storage.objects;
drop policy if exists "Usuários autenticados podem enviar fotos" on storage.objects;
-- Resultado esperado: 10 policies (disciplinas_owner, fotos_delete/insert/select/update,
-- perfis_insert/select/update, sessoes_owner, topicos_owner). fotos_sessao fica sem policy (bloqueada).

-- 4) Geolocalização, PostGIS e Privacidade LGPD (Aulas 01 e 02 - Prof. Lázaro)
-- 4.1) Extensão PostGIS (no schema extensions) e colunas geoespaciais na tabela sessoes_estudo
create extension if not exists postgis with schema extensions;

alter table public.sessoes_estudo
  add column if not exists accuracy real,
  add column if not exists local_aproximado text,
  add column if not exists geom geography(Point, 4326);

-- Índice espacial GIST para consultas rápidas por raio (PDF 01, slide 39)
create index if not exists idx_sessoes_estudo_geom
  on public.sessoes_estudo using gist (geom);

-- 4.2) Trigger para manter a coluna geom sincronizada automaticamente com (longitude, latitude)
-- ATENÇÃO: ST_MakePoint recebe (LONGITUDE, LATITUDE) (PDF 01, slide 40)
create or replace function public.tg_sessoes_estudo_sync_geom()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.geom := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  else
    new.geom := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sessoes_estudo_sync_geom on public.sessoes_estudo;
create trigger trg_sessoes_estudo_sync_geom
before insert or update of latitude, longitude on public.sessoes_estudo
for each row execute function public.tg_sessoes_estudo_sync_geom();

-- Backfill de sessões já existentes com latitude/longitude preenchidas
update public.sessoes_estudo
set geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
where latitude is not null and longitude is not null and geom is null;

-- 4.3) Consulta espacial com ST_DWithin: sessões do usuário num raio em metros (padrão 1 km - PDF 01, slide 40)
create or replace function public.buscar_sessoes_proximas(
  p_longitude double precision,
  p_latitude double precision,
  p_raio_metros double precision default 1000
)
returns setof public.sessoes_estudo
language sql
stable
security invoker
as $$
  select *
  from public.sessoes_estudo
  where geom is not null
    and ST_DWithin(
      geom,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_raio_metros
    )
  order by created_at desc;
$$;

-- 4.4) LGPD (Art. 18 - Direito de Eliminação / Retenção): limpar histórico de localização do usuário autenticado
create or replace function public.limpar_minhas_coordenadas()
returns integer
language plpgsql
security invoker
as $$
declare
  v_afetadas integer;
begin
  update public.sessoes_estudo
  set latitude = null,
      longitude = null,
      accuracy = null,
      local_aproximado = null,
      geom = null
  where usuario_id = auth.uid()
    and (latitude is not null or longitude is not null);

  get diagnostics v_afetadas = row_count;
  return v_afetadas;
end;
$$;

-- 4.5) Política de Retenção Automática (PDF 01, slides 41 e 44; PDF 02, slide 42):
-- Expurga coordenadas com mais de N dias (padrão 90 dias), preservando a sessão de estudo e o XP.
create or replace function public.expurgar_coordenadas_antigas(p_dias integer default 90)
returns integer
language plpgsql
security invoker
as $$
declare
  v_expurgadas integer;
begin
  update public.sessoes_estudo
  set latitude = null,
      longitude = null,
      accuracy = null,
      local_aproximado = null,
      geom = null
  where usuario_id = auth.uid()
    and created_at < (now() - make_interval(days => p_dias))
    and (latitude is not null or longitude is not null);

  get diagnostics v_expurgadas = row_count;
  return v_expurgadas;
end;
$$;

grant execute on function public.buscar_sessoes_proximas(double precision, double precision, double precision) to authenticated;
grant execute on function public.limpar_minhas_coordenadas() to authenticated;
grant execute on function public.expurgar_coordenadas_antigas(integer) to authenticated;

-- 5) Reset semanal automático do Ranking (toda segunda-feira às 00:00 UTC)
create or replace function public.resetar_xp_semanal()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_afetados integer;
begin
  update public.perfis
  set xp_semanal = 0,
      updated_at = now()
  where xp_semanal > 0;

  get diagnostics v_afetados = row_count;
  return v_afetados;
end;
$$;

-- Apenas o agendador interno do Postgres (pg_cron) pode invocar o reset
revoke all on function public.resetar_xp_semanal() from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_cron with schema extensions;
  if exists (select 1 from cron.job where jobname = 'reset-xp-semanal-studyrats') then
    perform cron.unschedule('reset-xp-semanal-studyrats');
  end if;
  perform cron.schedule(
    'reset-xp-semanal-studyrats',
    '0 0 * * 1',
    'select public.resetar_xp_semanal();'
  );
exception
  when others then
    raise notice 'pg_cron indisponível ou sem permissão neste ambiente: %', sqlerrm;
end;
$$;

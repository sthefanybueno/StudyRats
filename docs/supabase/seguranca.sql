-- StudyRats: segurança do backend Supabase (executar no SQL Editor). Idempotente.
-- Premissas: perfis(id = auth.uid()), sessoes_estudo(usuario_id), disciplinas(usuario_id), topicos(disciplina_id).

-- 1) Row Level Security
alter table public.perfis          enable row level security;
alter table public.sessoes_estudo  enable row level security;
alter table public.disciplinas     enable row level security;
alter table public.topicos         enable row level security;

-- perfis: qualquer usuário autenticado lê (ranking); só altera o próprio
drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis for select to authenticated using (true);
drop policy if exists perfis_insert on public.perfis;
create policy perfis_insert on public.perfis for insert to authenticated with check (id = auth.uid());
drop policy if exists perfis_update on public.perfis;
create policy perfis_update on public.perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- sessoes_estudo e disciplinas: somente o dono
drop policy if exists sessoes_owner on public.sessoes_estudo;
create policy sessoes_owner on public.sessoes_estudo for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
drop policy if exists disciplinas_owner on public.disciplinas;
create policy disciplinas_owner on public.disciplinas for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- topicos: somente se a disciplina pertencer ao usuário
drop policy if exists topicos_owner on public.topicos;
create policy topicos_owner on public.topicos for all to authenticated
  using (exists (select 1 from public.disciplinas d where d.id = disciplina_id and d.usuario_id = auth.uid()))
  with check (exists (select 1 from public.disciplinas d where d.id = disciplina_id and d.usuario_id = auth.uid()));

-- 2) Storage: bucket privado, cada usuário só acessa a pasta {auth.uid()}/
insert into storage.buckets (id, name, public) values ('fotos_sessao', 'fotos_sessao', false)
  on conflict (id) do update set public = false;

drop policy if exists fotos_insert on storage.objects;
create policy fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_update on storage.objects;
create policy fotos_update on storage.objects for update to authenticated
  using (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_select on storage.objects;
create policy fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_delete on storage.objects;
create policy fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos_sessao' and (storage.foldername(name))[1] = auth.uid()::text);

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

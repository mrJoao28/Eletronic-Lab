create table public.lab_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  document jsonb not null check (jsonb_typeof(document) = 'object' and document ?& array['version','name','experiment','parts','wires','probes','digitalProbes'] and document->>'version' = '1' and jsonb_typeof(document->'parts') = 'array' and jsonb_typeof(document->'wires') = 'array' and octet_length(document::text) <= 1048576),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lab_project_name_matches check (name = document->>'name')
);
create index lab_projects_owner_updated on public.lab_projects(owner_id, updated_at desc);
alter table public.lab_projects enable row level security;
revoke all on public.lab_projects from anon;
grant select, insert, update on public.lab_projects to authenticated;
create policy "Owners read their projects" on public.lab_projects for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create their projects" on public.lab_projects for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update their projects" on public.lab_projects for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create function public.touch_lab_project() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = pg_catalog.clock_timestamp();
  new.created_at = old.created_at;
  return new;
end;
$$;
revoke execute on function public.touch_lab_project() from public, anon, authenticated;
create trigger lab_project_updated before update on public.lab_projects for each row execute function public.touch_lab_project();
create table public.lab_progress (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  challenge_id text not null check (challenge_id in ('switch','current','rc-open','adder-input')),
  completed_at timestamptz not null default now(),
  primary key (owner_id, challenge_id)
);
alter table public.lab_progress enable row level security;
revoke all on public.lab_progress from anon;
grant select, insert on public.lab_progress to authenticated;
create policy "Owners read their progress" on public.lab_progress for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners record their progress" on public.lab_progress for insert to authenticated with check ((select auth.uid()) = owner_id);

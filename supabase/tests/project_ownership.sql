-- Ephemeral fixtures: no sign-in credentials, no emails, every row is rolled back.
begin;
insert into auth.users(id,email,aud,role) values
 ('f0000000-0000-4000-8000-000000000001','rls-alpha@example.invalid','authenticated','authenticated'),
 ('f0000000-0000-4000-8000-000000000002','rls-beta@example.invalid','authenticated','authenticated');
insert into public.lab_projects(id,owner_id,name,document) values
 ('f1000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','QA Alpha','{"version":1,"name":"QA Alpha","experiment":"rc","parts":[],"wires":[],"probes":{"positive":"","negative":""},"digitalProbes":[]}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.lab_projects) <> 1 then raise exception 'Owner cannot read own row'; end if;
 update public.lab_projects set archived = true where id = 'f1000000-0000-4000-8000-000000000001';
 begin
  update public.lab_projects set owner_id = 'f0000000-0000-4000-8000-000000000002' where id = 'f1000000-0000-4000-8000-000000000001';
  raise exception 'Owner reassignment was allowed';
 exception when insufficient_privilege then null;
 end;
 begin
  insert into public.lab_progress(owner_id,challenge_id) values ('f0000000-0000-4000-8000-000000000002','switch');
  raise exception 'Foreign progress insert was allowed';
 exception when insufficient_privilege then null;
 end;
 insert into public.lab_progress(owner_id,challenge_id) values ('f0000000-0000-4000-8000-000000000001','switch');
end $$;
select set_config('request.jwt.claims','{"sub":"f0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ declare affected integer; begin
 if exists(select 1 from public.lab_projects) then raise exception 'Foreign projects were visible'; end if;
 if exists(select 1 from public.lab_progress) then raise exception 'Foreign progress was visible'; end if;
 update public.lab_projects set archived = false where id = 'f1000000-0000-4000-8000-000000000001';
 get diagnostics affected = row_count;
 if affected <> 0 then raise exception 'Foreign update was allowed'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.lab_projects; raise exception 'Anonymous access was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'RLS_OWNER_READ_WRITE_AND_CROSS_ACCOUNT_DENIAL_OK' as verification;

-- Receipts are committed with the write; an aborted transaction leaves no receipt.
create table public.archive_requests (
 request_id uuid primary key, actor uuid not null references auth.users(id),
 command text not null, payload jsonb not null, result jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.archive_requests enable row level security;
revoke all on public.archive_requests from anon,authenticated;
grant select on public.archive_requests to authenticated;
create policy own_request_receipts on public.archive_requests for select to authenticated
 using(actor=(select auth.uid()) and public.archive_role() is not null
 and (command not in ('member_invite','member_revoke','enable_auto_publish','sheet_import') or public.archive_role()='owner'));

alter function public.archive_command(text,jsonb) rename to archive_command_impl;
revoke all on function public.archive_command_impl(text,jsonb) from public,anon,authenticated,service_role;
-- Modify the existing implementation without replaying its schema migration.
do $$ declare definition text; begin
 definition := pg_get_functiondef('public.archive_command_impl(text,jsonb)'::regprocedure);
 definition := replace(definition,
 '  previous := case when c.id is not null then to_jsonb(c) end;',
 '  if c.id is null and cid is not null and not coalesce((input->>''create'')::boolean,false) then
    raise exception ''Candidate no longer exists'' using errcode=''40001'',detail=''{"deleted":true}'';
  end if;
  if c.id is not null and coalesce((input->>''create'')::boolean,false) then
    raise exception ''Version conflict'' using errcode=''40001'',detail=to_jsonb(c)::text;
  end if;
  previous := case when c.id is not null then to_jsonb(c) end;');
 if definition not like '%Candidate no longer exists%' then raise exception 'Candidate guard anchor missing'; end if;
 execute definition;
end $$;

create function public.archive_command(command text,input jsonb) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='18s' set lock_timeout='5s' as $$
declare rid uuid := (input->>'request_id')::uuid; receipt public.archive_requests; output jsonb;
 clean jsonb := input-'request_id';
begin
 perform public.archive_require_member(command in ('member_invite','member_revoke','enable_auto_publish'));
 perform pg_advisory_xact_lock(18731011);
 if rid is not null then
  select * into receipt from public.archive_requests where request_id=rid;
  if found then
   if receipt.actor is distinct from auth.uid() or receipt.command<>command or receipt.payload<>clean then
    raise exception 'Request identity mismatch' using errcode='22023';
   end if;
   return receipt.result;
  end if;
 end if;
 output := public.archive_command_impl(command,clean);
 if rid is not null then insert into public.archive_requests values(rid,auth.uid(),command,clean,output,now()); end if;
 return output;
end $$;
revoke all on function public.archive_command(text,jsonb) from public,anon;
grant execute on function public.archive_command(text,jsonb) to authenticated;

create function public.archive_import_sheet_request(rows jsonb,unavailable jsonb,request_id uuid,digest text) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='50s' set lock_timeout='5s' as $$
declare receipt public.archive_requests; output jsonb;
begin
 perform public.archive_require_member(true);
 if request_id is null or digest !~ '^[a-f0-9]{64}$' then raise exception 'Invalid import request'; end if;
 perform pg_advisory_xact_lock(18731011);
 select * into receipt from public.archive_requests where archive_requests.request_id=archive_import_sheet_request.request_id;
 if found then
  if receipt.actor is distinct from auth.uid() or receipt.command<>'sheet_import'
    or receipt.payload<>jsonb_build_object('digest',digest,'rows',rows,'unavailable',unavailable) then
   raise exception 'Request identity mismatch';
  end if;
  return receipt.result;
 end if;
 output := public.archive_import_sheet(rows,unavailable);
 insert into public.archive_requests values(request_id,auth.uid(),'sheet_import',jsonb_build_object('digest',digest,'rows',rows,'unavailable',unavailable),output,now());
 return output;
end $$;
revoke all on function public.archive_import_sheet_request(jsonb,jsonb,uuid,text) from public,anon,service_role;
grant execute on function public.archive_import_sheet_request(jsonb,jsonb,uuid,text) to authenticated;
alter function public.archive_import_sheet(jsonb,jsonb) set statement_timeout='50s';
alter function public.archive_import_sheet(jsonb,jsonb) set lock_timeout='5s';
alter function public.archive_restore_backup(jsonb,bigint) set statement_timeout='50s';
notify pgrst,'reload schema';

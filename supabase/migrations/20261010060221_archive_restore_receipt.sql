create function public.archive_restore_backup_request(backup jsonb,expected_revision bigint,request_id uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='50s' set lock_timeout='5s' as $$
declare receipt public.archive_requests; output jsonb;
begin
 perform public.archive_require_member(true);
 if request_id is null then raise exception 'Request ID required'; end if;
 perform pg_advisory_xact_lock(18731011);
 select * into receipt from public.archive_requests where archive_requests.request_id=archive_restore_backup_request.request_id;
 if found then
  if receipt.actor is distinct from auth.uid() or receipt.command<>'backup_restore'
   or receipt.payload<>jsonb_build_object('backup',backup,'revision',expected_revision) then raise exception 'Request identity mismatch'; end if;
  return receipt.result;
 end if;
 output:=public.archive_restore_backup(backup,expected_revision);
 insert into public.archive_requests values(request_id,auth.uid(),'backup_restore',jsonb_build_object('backup',backup,'revision',expected_revision),output,now());
 return output;
end $$;
revoke all on function public.archive_restore_backup_request(jsonb,bigint,uuid) from public,anon,service_role;
grant execute on function public.archive_restore_backup_request(jsonb,bigint,uuid) to authenticated;
alter policy own_request_receipts on public.archive_requests
 using(actor=(select auth.uid()) and public.archive_role() is not null
 and (command not in ('member_invite','member_revoke','enable_auto_publish','sheet_import','backup_restore') or public.archive_role()='owner'));
notify pgrst,'reload schema';

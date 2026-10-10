create function public.archive_export_backup() returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb := jsonb_build_object('format',1,'created_at',now()); t text; records jsonb;
begin
 if auth.role()<>'service_role' then perform public.archive_require_member(true); end if;
 perform pg_advisory_xact_lock(18731011);
 foreach t in array array['songs','aliases','streams','evidence','candidates','performances','unavailable','revisions'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(r)),''[]'') from public.%I r','archive_'||t) into records;
  if t='evidence' then
   -- Backups do not retain raw API comments, author identifiers or their URLs.
   select coalesce(jsonb_agg(case when value->>'kind'='youtube' then value||jsonb_build_object('raw_text',null,'author_id',null,'comment_id',null,'source_url',null,'scan_generation',null,'expires_at',null) else value end),'[]') into records from jsonb_array_elements(records);
  end if;
  result := result||jsonb_build_object(t,records);
 end loop;
 return result;
end $$;
revoke all on function public.archive_export_backup() from public,anon;
grant execute on function public.archive_export_backup() to authenticated,service_role;

create function public.archive_restore_backup(backup jsonb, expected_revision bigint default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare t text; restored jsonb;
begin
 perform public.archive_require_member(true);
 perform pg_advisory_xact_lock(18731011);
 if expected_revision is not null and expected_revision <> coalesce((select max(id) from public.archive_revisions),0) then raise exception 'Data changed since restore preview' using errcode='40001'; end if;
 if backup->>'format' is distinct from '1' or jsonb_typeof(backup->'songs') is distinct from 'array' or jsonb_array_length(backup->'songs')=0 then raise exception 'Invalid backup'; end if;
 -- Access, Auth accounts and current jobs are never restored from a data backup.
 delete from public.archive_candidates;delete from public.archive_performances;delete from public.archive_evidence;
 delete from public.archive_aliases;delete from public.archive_unavailable;delete from public.archive_streams;delete from public.archive_songs;
 foreach t in array array['songs','aliases','streams','evidence','candidates','performances','unavailable'] loop
  if jsonb_typeof(backup->t) is distinct from 'array' then raise exception 'Missing backup table: %',t; end if;
  execute format('insert into public.%I select * from jsonb_populate_recordset(null::public.%I,$1)','archive_'||t,'archive_'||t) using backup->t;
 end loop;
 update public.archive_settings set auto_publish=false,dry_run_started_at=now(),discovery_cursor=null;
 update public.archive_streams set scan_cursor=null,scan_count=0,scan_generation=null,scan_complete=false;
 -- Restore historical records with new IDs to retain the existing audit trail too.
 insert into public.archive_revisions(entity,entity_id,action,actor,before_data,after_data,created_at)
 select value->>'entity',value->>'entity_id',value->>'action',(value->>'actor')::uuid,value->'before_data',value->'after_data',(value->>'created_at')::timestamptz
 from jsonb_array_elements(coalesce(backup->'revisions','[]')) value
 where not exists(select 1 from public.archive_revisions r where r.entity=value->>'entity' and r.entity_id=value->>'entity_id' and r.created_at=(value->>'created_at')::timestamptz and r.action=value->>'action');
 perform public.archive_refresh_snapshot();
 restored := jsonb_build_object('songs',(select count(*) from public.archive_songs),'performances',(select count(*) from public.archive_performances));
 insert into public.archive_revisions(entity,entity_id,action,actor,after_data) values('archive','all','backup_restore',auth.uid(),restored);
 return restored;
end $$;
revoke all on function public.archive_restore_backup(jsonb,bigint) from public,anon,service_role;
grant execute on function public.archive_restore_backup(jsonb,bigint) to authenticated;

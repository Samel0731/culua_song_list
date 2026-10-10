-- Keep pg_safeupdate enabled: restore intentionally replaces the whole archive,
-- with explicit non-null primary-key predicates and the existing owner lock.
do $$
declare definition text; table_name text; key_name text;
begin
 definition := pg_get_functiondef('public.archive_restore_backup(jsonb,bigint)'::regprocedure);
 foreach table_name in array array['candidates','performances','evidence','aliases','unavailable','streams','songs'] loop
  key_name := case when table_name='streams' then 'video_id' else 'id' end;
  definition := replace(definition,
   'delete from public.archive_'||table_name||';',
   'delete from public.archive_'||table_name||' where '||key_name||' is not null;');
 end loop;
 definition := replace(definition,'discovery_cursor=null;', 'discovery_cursor=null where id is not null;');
 definition := replace(definition,'scan_complete=false;', 'scan_complete=false where video_id is not null;');
 execute definition;
end $$;

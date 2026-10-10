-- Business conflicts are not serialization failures. PostgREST may retry
-- SQLSTATE 40001 transactions indefinitely; PT409 gives a terminal HTTP 409.
do $$
declare routine record; definition text;
begin
 for routine in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname like 'archive_%' and p.prokind='f' loop
  definition := pg_get_functiondef(routine.oid);
  if definition like '%40001%' then
   execute replace(definition,'''40001''','''PT409''');
  end if;
 end loop;
end $$;

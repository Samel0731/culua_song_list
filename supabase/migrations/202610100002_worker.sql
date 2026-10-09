alter table public.archive_streams add column scan_generation uuid;
alter table public.archive_evidence add column scan_generation uuid;
create function public.archive_apply_scan(vid text, candidates jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare item jsonb; c public.archive_candidates; p public.archive_performances; sid uuid; count_published integer := 0;
begin
 if auth.role() <> 'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(18731011);
 perform 1 from public.archive_streams where video_id=vid for update;
 for item in select value from jsonb_array_elements(candidates) loop
  select * into c from public.archive_candidates where source_key='youtube:'||vid||':'||(item->>'position') for update;
  if c.id is not null and (c.human_edited or c.status in ('published','rejected')) then
   if c.status='published' and (c.name<>item->>'name' or c.artist<>item->>'artist' or c.timestamp_seconds is distinct from (item->>'timestamp_seconds')::integer or jsonb_array_length(item->'reasons')>0) then
    insert into public.archive_candidates(video_id,source_key,position,name,artist,timestamp_seconds,reasons)
     values(vid,'youtube-conflict:'||vid||':'||(item->>'position')||':'||md5(item::text),(item->>'position')::integer,item->>'name',item->>'artist',
      (item->>'timestamp_seconds')::integer,(item->'reasons')||'["已發布資料出現新衝突，需人工處理"]') on conflict(source_key) do nothing;
   end if;
   continue;
  end if;
  insert into public.archive_candidates(video_id,source_key,position,name,artist,timestamp_seconds,song_id,reasons)
   values(vid,'youtube:'||vid||':'||(item->>'position'),(item->>'position')::integer,item->>'name',item->>'artist',
   (item->>'timestamp_seconds')::integer,(item->>'song_id')::uuid,item->'reasons')
   on conflict(source_key) do update set name=excluded.name,artist=excluded.artist,timestamp_seconds=excluded.timestamp_seconds,
    song_id=excluded.song_id,reasons=excluded.reasons,version=archive_candidates.version+1,updated_at=now()
   returning * into c;
  sid := c.song_id;
  if (item->>'auto_publish')::boolean and sid is not null
   and exists(select 1 from public.archive_settings where auto_publish and dry_run_started_at<=now()-interval '7 days')
   and exists(select 1 from public.archive_streams where video_id=vid and scan_complete and c.timestamp_seconds<duration)
   and exists(select 1 from public.archive_songs where id=sid and name=c.name and artist=c.artist)
   and jsonb_array_length(coalesce(item->'votes','[]'))>=2
   and (select count(distinct e.author_id) from public.archive_evidence e join public.archive_streams v on v.video_id=e.video_id
    where e.video_id=vid and e.kind='youtube' and e.expires_at>now() and e.scan_generation is not distinct from v.scan_generation
    and e.comment_id in (select proof->>'comment_id' from jsonb_array_elements(item->'votes') proof))>=2
   and not exists(select 1 from jsonb_array_elements(item->'votes') proof where
    not exists(select 1 from public.archive_songs s where s.id=sid and normalize(s.name,NFKC)=normalize(proof->>'name',NFKC) and normalize(s.artist,NFKC)=normalize(proof->>'artist',NFKC))
    and not exists(select 1 from public.archive_aliases a where a.song_id=sid and normalize(a.name,NFKC)=normalize(proof->>'name',NFKC) and normalize(a.artist,NFKC)=normalize(proof->>'artist',NFKC))) then
   select * into p from public.archive_performances where video_id=vid and position=c.position for update;
   if p.id is null then
    insert into public.archive_performances(video_id,position,song_id,timestamp_seconds,human_edited)
     values(vid,c.position,sid,c.timestamp_seconds,false) returning * into p;
    update public.archive_candidates set status='published',version=version+1 where id=c.id;
    insert into public.archive_revisions(entity,entity_id,action,after_data) values('performances',p.id::text,'auto_publish',to_jsonb(p));
    count_published := count_published+1;
   else
    update public.archive_candidates set reasons=reasons||'["已有演唱紀錄，需人工處理"]' where id=c.id;
   end if;
  end if;
 end loop;
 if jsonb_array_length(candidates)>0 then perform public.archive_refresh_snapshot(); end if;
 return count_published;
end $$;
revoke all on function public.archive_apply_scan(text,jsonb) from public,anon,authenticated;
grant execute on function public.archive_apply_scan(text,jsonb) to service_role;

create function public.archive_job_claim(key text) returns uuid language plpgsql security definer set search_path = '' as $$
declare job public.archive_jobs;
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 -- A global lease prevents manual dispatch overlapping the daily run.
 perform pg_advisory_xact_lock(18731010);
 if exists(select 1 from public.archive_jobs where status='running' and started_at>now()-interval '11 minutes') then return null; end if;
 update public.archive_jobs set status='error',finished_at=now(),details='{"error":"worker lease expired"}' where status='running';
 insert into public.archive_jobs(job_key) values(key) on conflict(job_key) do update
  set status='running',started_at=now(),finished_at=null,details='{}' where archive_jobs.status<>'success' returning * into job;
 return job.id;
end $$;
revoke all on function public.archive_job_claim(text) from public,anon,authenticated;
grant execute on function public.archive_job_claim(text) to service_role;

create table public.archive_unavailable (id uuid primary key default gen_random_uuid(), raw_data jsonb not null, resolved_video_id text references public.archive_streams(video_id),version integer not null default 1, created_at timestamptz not null default now());
alter table public.archive_unavailable enable row level security;
create policy member_read on public.archive_unavailable for select to authenticated using(public.archive_role() is not null);
revoke all on public.archive_unavailable from anon,authenticated;
grant select on public.archive_unavailable to authenticated;
grant all on public.archive_unavailable to service_role;

create function public.archive_import_sheet(rows jsonb, unavailable jsonb default '[]') returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb; sid uuid; count_rows integer := 0; imported public.archive_performances;
begin
 perform public.archive_require_member(true);
 perform pg_advisory_xact_lock(18731011);
 if jsonb_array_length(rows)=0 or jsonb_array_length(rows)>20000 then raise exception 'Invalid import size'; end if;
 -- Migration is an initial import, never a merge over edited production data.
 if exists(select 1 from public.archive_performances) then raise exception 'Archive is not empty; restore or export before migration'; end if;
 for item in select value from jsonb_array_elements(rows) loop
  insert into public.archive_streams(video_id,title,stream_date,retry_requested,scan_complete,scan_status)
   values(item->>'video_id',item->>'stream_title',item->>'date',false,true,'ready') on conflict(video_id) do nothing;
  insert into public.archive_songs(name,artist) values(item->>'name',item->>'artist') on conflict(name,artist) do nothing;
  select id into sid from public.archive_songs where name=item->>'name' and artist=item->>'artist';
  insert into public.archive_performances(video_id,position,song_id,timestamp_seconds,song_link)
   values(item->>'video_id',(item->>'position')::integer,sid,(item->>'timestamp_seconds')::integer,coalesce(item->>'song_link','')) returning * into imported;
  insert into public.archive_revisions(entity,entity_id,action,actor,after_data) values('performances',imported.id::text,'sheet_import',auth.uid(),to_jsonb(imported));
  count_rows := count_rows+1;
 end loop;
 insert into public.archive_unavailable(raw_data) select value from jsonb_array_elements(unavailable);
 perform public.archive_refresh_snapshot();
 return jsonb_build_object('performances',count_rows,'songs',(select count(*) from public.archive_songs),'unavailable',jsonb_array_length(unavailable));
end $$;
revoke all on function public.archive_import_sheet(jsonb,jsonb) from public,anon;
grant execute on function public.archive_import_sheet(jsonb,jsonb) to authenticated;

create function public.archive_expire_evidence() returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.role()<>'service_role' then raise exception 'Forbidden' using errcode='42501'; end if;
 delete from public.archive_evidence e where kind='youtube' and expires_at<now() and not exists(select 1 from public.archive_candidates c where c.source_id=e.id);
 update public.archive_evidence set raw_text=null,author_id=null,comment_id=null,source_url=null,scan_generation=null,expires_at=null,status='ready' where kind='youtube' and expires_at<now();
 delete from public.archive_jobs where started_at<now()-interval '30 days';
end $$;
revoke all on function public.archive_expire_evidence() from public,anon,authenticated;
grant execute on function public.archive_expire_evidence() to service_role;

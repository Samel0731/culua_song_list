-- Apply with Supabase SQL editor or `supabase db push`. No paid extensions.
create table public.archive_members (
 id uuid primary key default gen_random_uuid(), email text not null unique check(email = lower(email)),
 user_id uuid unique references auth.users(id), role text not null check(role in ('owner','editor')),
 active boolean not null default true, created_at timestamptz not null default now()
);
create unique index archive_single_owner on public.archive_members(role) where role = 'owner';
create table public.archive_songs (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 300),
 artist text not null check(length(trim(artist)) between 1 and 300), version integer not null default 1,
 unique(name,artist)
);
create table public.archive_aliases (
 id uuid primary key default gen_random_uuid(), song_id uuid not null references public.archive_songs(id),
 name text not null, artist text not null, route_alias boolean not null default false, unique(name,artist)
);
create table public.archive_streams (
 video_id text primary key check(video_id ~ '^[A-Za-z0-9_-]{11}$'), title text not null,
 stream_date text not null check(stream_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and stream_date::date is not null), duration integer check(duration > 0), channel_id text,
 scan_status text not null default 'pending' check(scan_status in ('pending','ready','no_setlist','comments_disabled','error','incomplete')),
 scan_cursor text, scan_count integer not null default 0, scan_complete boolean not null default false,
 last_checked_at timestamptz, last_error text, retry_requested boolean not null default true,
 version integer not null default 1, created_at timestamptz not null default now()
);
create table public.archive_evidence (
 id uuid primary key default gen_random_uuid(), video_id text not null references public.archive_streams(video_id),
 kind text not null check(kind in ('youtube','image','sheet')), source_url text, storage_path text,
 status text not null default 'needs_image' check(status in ('needs_image','needs_ocr','review','ready')),
 comment_id text, author_id text, raw_text text, expires_at timestamptz,
 submitted_by uuid references auth.users(id), created_at timestamptz not null default now(),
 unique(video_id,comment_id)
);
create table public.archive_candidates (
 id uuid primary key default gen_random_uuid(), video_id text not null references public.archive_streams(video_id),
 source_id uuid references public.archive_evidence(id), source_key text not null unique,
 position integer not null check(position > 0), name text not null, artist text not null default '',
 timestamp_seconds integer check(timestamp_seconds >= 0), song_id uuid references public.archive_songs(id),
 status text not null default 'review' check(status in ('review','published','rejected')),
 reasons jsonb not null default '[]', version integer not null default 1,
 human_edited boolean not null default false, updated_at timestamptz not null default now()
);
create table public.archive_performances (
 id uuid primary key default gen_random_uuid(), video_id text not null references public.archive_streams(video_id),
 position integer not null check(position > 0), song_id uuid not null references public.archive_songs(id),
 timestamp_seconds integer not null check(timestamp_seconds >= 0), song_link text not null default '',
 published boolean not null default true, human_edited boolean not null default true,
 version integer not null default 1, unique(video_id,position)
);
create table public.archive_revisions (
 id bigint generated always as identity primary key, entity text not null, entity_id text not null,
 action text not null, actor uuid references auth.users(id), before_data jsonb, after_data jsonb,
 created_at timestamptz not null default now()
);
create table public.archive_jobs (
 id uuid primary key default gen_random_uuid(), job_key text not null unique,
 status text not null default 'running' check(status in ('running','success','error')),
 started_at timestamptz not null default now(), finished_at timestamptz, details jsonb not null default '{}'
);
create table public.archive_settings (
 id boolean primary key default true check(id), activation_at timestamptz not null default now(),
 auto_publish boolean not null default false, dry_run_started_at timestamptz not null default now(),
 discovery_cursor text, discovery_complete boolean not null default false
);
insert into public.archive_settings(id) values(true);
create table public.archive_snapshots (
 id bigint generated always as identity primary key, payload jsonb not null, created_at timestamptz not null default now()
);
create index archive_candidates_stream on public.archive_candidates(video_id,status);
create index archive_evidence_scan on public.archive_evidence(video_id);
create index archive_performances_song on public.archive_performances(song_id,published);
create index archive_streams_date on public.archive_streams(stream_date);
create index archive_revision_entity on public.archive_revisions(entity,entity_id,id desc);

create function public.archive_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.archive_members where user_id = auth.uid() and active
$$;
create function public.archive_require_member(owner_only boolean default false) returns void
 language plpgsql security definer set search_path = '' as $$
begin
 if public.archive_role() is null or (owner_only and public.archive_role() <> 'owner') then
  raise exception 'Forbidden' using errcode = '42501';
 end if;
end $$;
create function public.archive_claim_invitation() returns text language plpgsql security definer set search_path = '' as $$
declare verified_email text; bound jsonb;
begin
 -- Trust provider-verified identity stored by Auth, not client metadata or JWT role claims.
 select lower(i.identity_data->>'email') into verified_email from auth.identities i
 join auth.users u on u.id = i.user_id
 where i.user_id = auth.uid() and i.provider = 'google'
 and i.identity_data->>'email_verified' = 'true' and u.email_confirmed_at is not null limit 1;
 if verified_email is not null then
  update public.archive_members set user_id = auth.uid()
   where email = verified_email and active and user_id is null and role = 'editor' returning to_jsonb(archive_members.*) into bound;
  if bound is not null then
   insert into public.archive_revisions(entity,entity_id,action,actor,after_data) values('members',bound->>'id','invitation_claim',auth.uid(),bound);
  end if;
 end if;
 return public.archive_role();
end $$;

create function public.archive_refresh_snapshot() returns void language plpgsql security definer set search_path = '' as $$
declare songs jsonb; aliases jsonb;
begin
 select coalesce(jsonb_agg(data order by data->>'songName'), '[]') into songs from (
  select jsonb_build_object('songName',s.name,'artist',string_agg(distinct s.artist,' / ' order by s.artist),'versions',
   jsonb_agg(jsonb_build_object('date',v.stream_date,'streamUrl','https://www.youtube.com/watch?v='||v.video_id,
   'streamTitle',v.title,'timestamp',floor(p.timestamp_seconds/3600)::text||':'||lpad((p.timestamp_seconds/60%60)::text,2,'0')||':'||lpad((p.timestamp_seconds%60)::text,2,'0'),
   'timestampSeconds',p.timestamp_seconds,'songLink',p.song_link,'artist',s.artist,'streamIncomplete',
   not v.scan_complete or exists(select 1 from public.archive_candidates c where c.video_id=v.video_id and c.status='review')) order by v.stream_date desc,p.position)) data
  from public.archive_songs s join public.archive_performances p on p.song_id=s.id and p.published
  join public.archive_streams v on v.video_id=p.video_id group by s.name
 ) grouped;
 select coalesce(jsonb_agg(jsonb_build_object('from',a.name,'to',s.name)), '[]') into aliases
 from public.archive_aliases a join public.archive_songs s on s.id=a.song_id where a.route_alias and a.name<>s.name;
 insert into public.archive_snapshots(payload) values(jsonb_build_object('songs',songs,'aliases',aliases));
 delete from public.archive_snapshots where id not in (select id from public.archive_snapshots order by id desc limit 2);
end $$;
create function public.archive_public_snapshot() returns jsonb language sql stable security definer set search_path = '' as $$
 select payload from public.archive_snapshots order by id desc limit 1
$$;

create function public.archive_command(command text, input jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare previous jsonb; result jsonb; entity text; entity_id text; sid uuid; cid uuid; vid text;
 c public.archive_candidates; p public.archive_performances; s public.archive_songs;
 expected integer; item jsonb; r public.archive_revisions; storage_key text;
begin
 perform public.archive_require_member(command in ('member_invite','member_revoke','enable_auto_publish'));
 perform pg_advisory_xact_lock(18731011);
 expected := (input->>'version')::integer;
 case command
 when 'member_invite' then
  if lower(trim(input->>'email')) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  if exists(select 1 from public.archive_members where email=lower(trim(input->>'email')) and role='owner') then raise exception 'Owner is immutable'; end if;
  select to_jsonb(m) into previous from public.archive_members m where email=lower(trim(input->>'email')) for update;
  insert into public.archive_members(email,role) values(lower(trim(input->>'email')),'editor')
   on conflict(email) do update set active=true returning to_jsonb(archive_members.*) into result;
  entity := 'members'; entity_id := result->>'id';
 when 'member_revoke' then
  select to_jsonb(m) into previous from public.archive_members m where id=(input->>'id')::uuid for update;
  if previous is null or previous->>'role'='owner' then raise exception 'Owner is immutable'; end if;
  update public.archive_members set active=false where id=(input->>'id')::uuid returning to_jsonb(archive_members.*) into result;
  entity := 'members'; entity_id := result->>'id';
 when 'enable_auto_publish' then
  if exists(select 1 from public.archive_settings where dry_run_started_at > now()-interval '7 days') then raise exception 'Seven-day dry run is required'; end if;
  update public.archive_settings set auto_publish=(input->>'enabled')::boolean returning to_jsonb(archive_settings.*) into result;
  entity := 'settings'; entity_id := 'true';
 when 'stream_save' then
  vid := input->>'video_id';
  select to_jsonb(v) into previous from public.archive_streams v where video_id=vid for update;
  if previous is not null and expected is distinct from (previous->>'version')::integer then raise exception 'Version conflict' using errcode='40001',detail=previous::text; end if;
  if coalesce(trim(input->>'title'),'')='' or coalesce(input->>'stream_date','')='' then raise exception 'Title and date required'; end if;
  insert into public.archive_streams(video_id,title,stream_date,duration) values(vid,trim(input->>'title'),input->>'stream_date',(input->>'duration')::integer)
   on conflict(video_id) do update set title=excluded.title,stream_date=excluded.stream_date,duration=excluded.duration,version=archive_streams.version+1
   returning to_jsonb(archive_streams.*) into result;
  entity := 'streams'; entity_id := vid;
 when 'stream_retry' then
  update public.archive_streams set retry_requested=true,scan_cursor=null,scan_count=0,scan_complete=false,scan_status='pending' where video_id=input->>'video_id' returning to_jsonb(archive_streams.*) into result;
  entity := 'streams'; entity_id := input->>'video_id';
 when 'unavailable_resolve' then
  select to_jsonb(u) into previous from public.archive_unavailable u where id=(input->>'id')::uuid for update;
  if previous is null then raise exception 'Record missing'; end if;
  if expected is distinct from (previous->>'version')::integer then raise exception 'Version conflict' using errcode='40001',detail=previous::text; end if;
  update public.archive_unavailable set resolved_video_id=input->>'video_id',version=version+1 where id=(input->>'id')::uuid returning to_jsonb(archive_unavailable.*) into result;
  entity := 'unavailable'; entity_id := result->>'id';
 when 'song_save' then
  sid := (input->>'id')::uuid;
  select * into s from public.archive_songs where id=sid for update;
  previous := case when s.id is not null then to_jsonb(s) end;
  if s.id is not null and expected is distinct from s.version then raise exception 'Version conflict' using errcode='40001',detail=previous::text; end if;
  if s.id is not null and (s.name<>trim(input->>'name') or s.artist<>trim(input->>'artist')) then
   insert into public.archive_aliases(song_id,name,artist,route_alias) values(s.id,s.name,s.artist,true) on conflict(name,artist) do nothing;
  end if;
  insert into public.archive_songs(id,name,artist) values(coalesce(sid,gen_random_uuid()),trim(input->>'name'),trim(input->>'artist'))
  on conflict(id) do update set name=excluded.name,artist=excluded.artist,version=archive_songs.version+1 returning to_jsonb(archive_songs.*) into result;
  entity := 'songs'; entity_id := result->>'id';
 when 'alias_add' then
  if coalesce(trim(input->>'name'),'')='' or coalesce(trim(input->>'artist'),'')='' then raise exception 'Name and artist required'; end if;
  insert into public.archive_aliases(song_id,name,artist) values((input->>'song_id')::uuid,trim(input->>'name'),trim(input->>'artist')) returning to_jsonb(archive_aliases.*) into result;
  entity := 'aliases'; entity_id := result->>'id';
 when 'alias_revoke' then
  select to_jsonb(a) into previous from public.archive_aliases a where id=(input->>'id')::uuid for update;
  if previous is null then raise exception 'Alias missing'; end if;
  if (previous->>'route_alias')::boolean then raise exception 'Historical routes must be preserved'; end if;
  delete from public.archive_aliases where id=(input->>'id')::uuid returning to_jsonb(archive_aliases.*)||'{"removed":true}'::jsonb into result;
  entity := 'aliases'; entity_id := result->>'id';
 when 'candidate_save' then
  cid := (input->>'id')::uuid;
  select * into c from public.archive_candidates where id=cid for update;
  previous := case when c.id is not null then to_jsonb(c) end;
  if c.id is not null and expected is distinct from c.version then raise exception 'Version conflict' using errcode='40001',detail=previous::text; end if;
  if c.id is not null and c.video_id<>input->>'video_id' then raise exception 'Cannot rebind candidate'; end if;
  if coalesce(trim(input->>'name'),'')='' then raise exception 'Song name required'; end if;
  insert into public.archive_candidates(id,video_id,source_key,position,name,artist,timestamp_seconds,human_edited)
   values(coalesce(cid,gen_random_uuid()),input->>'video_id',coalesce(c.source_key,'manual:'||gen_random_uuid()::text),(input->>'position')::integer,
   trim(input->>'name'),trim(coalesce(input->>'artist','')),(input->>'timestamp_seconds')::integer,true)
   on conflict(id) do update set name=excluded.name,artist=excluded.artist,timestamp_seconds=excluded.timestamp_seconds,
    position=excluded.position,status='review',human_edited=true,version=archive_candidates.version+1,updated_at=now()
   returning to_jsonb(archive_candidates.*) into result;
  entity := 'candidates'; entity_id := result->>'id';
 when 'candidate_publish','candidate_reject' then
  select * into c from public.archive_candidates where id=(input->>'id')::uuid for update;
  if c.id is null then raise exception 'Candidate missing'; end if;
  previous := to_jsonb(c);
  if expected is distinct from c.version then raise exception 'Version conflict' using errcode='40001',detail=previous::text; end if;
  if command='candidate_publish' then
   if c.timestamp_seconds is null or trim(c.artist)='' then raise exception 'Artist and timestamp required'; end if;
   if not exists(select 1 from public.archive_streams where video_id=c.video_id and duration is not null and c.timestamp_seconds<duration) then raise exception 'Valid stream duration required'; end if;
   insert into public.archive_songs(name,artist) values(c.name,c.artist) on conflict(name,artist) do nothing;
   select id into sid from public.archive_songs where name=c.name and artist=c.artist;
   select * into p from public.archive_performances where video_id=c.video_id and position=c.position for update;
   if p.id is not null then
    raise exception 'Performance already exists; edit it explicitly' using errcode='40001',detail=to_jsonb(p)::text;
   end if;
   insert into public.archive_performances(video_id,position,song_id,timestamp_seconds) values(c.video_id,c.position,sid,c.timestamp_seconds)
    returning * into p;
   insert into public.archive_revisions(entity,entity_id,action,actor,after_data) values('performances',p.id::text,command,auth.uid(),to_jsonb(p));
  end if;
  update public.archive_candidates set status=case when command='candidate_publish' then 'published' else 'rejected' end,
    human_edited=true,version=version+1,updated_at=now() where id=c.id returning to_jsonb(archive_candidates.*) into result;
  entity := 'candidates'; entity_id := c.id::text;
 when 'performance_save' then
  select * into p from public.archive_performances where id=(input->>'id')::uuid for update;
  if p.id is null then raise exception 'Performance missing'; end if;
  previous := to_jsonb(p);
  if expected is distinct from p.version then raise exception 'Version conflict' using errcode='40001',detail=previous::text; end if;
  if not exists(select 1 from public.archive_streams where video_id=p.video_id and duration is not null and (input->>'timestamp_seconds')::integer<duration) then raise exception 'Invalid timestamp'; end if;
  if coalesce(input->>'song_link','')<>'' and input->>'song_link' !~ '^https://[^[:space:]]+$' then raise exception 'Invalid song link'; end if;
  update public.archive_performances set song_id=(input->>'song_id')::uuid,timestamp_seconds=(input->>'timestamp_seconds')::integer,
   song_link=coalesce(input->>'song_link',''),published=(input->>'published')::boolean,human_edited=true,version=version+1 where id=p.id returning to_jsonb(archive_performances.*) into result;
  entity := 'performances'; entity_id := p.id::text;
 when 'source_add','source_attach' then
  storage_key := input->>'storage_path';
  if storage_key is not null and storage_key not like auth.uid()::text||'/%' then raise exception 'Invalid storage path'; end if;
  if storage_key is not null and not exists(select 1 from storage.objects where bucket_id='archive-evidence' and name=storage_key) then raise exception 'Image object missing'; end if;
  if input->>'source_url' is not null and input->>'source_url' !~ '^https://(x\.com|twitter\.com)/[A-Za-z0-9_]+/status/[0-9]+$' then raise exception 'Invalid X post'; end if;
  if command='source_attach' then
   select to_jsonb(e) into previous from public.archive_evidence e where id=(input->>'id')::uuid for update;
   if previous is null or previous->>'kind'<>'image' or previous->>'video_id'<>input->>'video_id' or previous->>'storage_path' is not null or storage_key is null then raise exception 'Source binding invalid'; end if;
   update public.archive_evidence set storage_path=storage_key,status='needs_ocr' where id=(previous->>'id')::uuid returning to_jsonb(archive_evidence.*) into result;
  else
   insert into public.archive_evidence(video_id,kind,source_url,storage_path,status,submitted_by) values(input->>'video_id','image',input->>'source_url',storage_key,
   case when storage_key is null then 'needs_image' else 'needs_ocr' end,auth.uid()) returning to_jsonb(archive_evidence.*) into result;
  end if;
  entity := 'evidence'; entity_id := result->>'id';
 when 'source_ocr' then
  select to_jsonb(e) into previous from public.archive_evidence e where id=(input->>'id')::uuid for update;
  if previous is null or previous->>'kind'<>'image' then raise exception 'Image source missing'; end if;
  if jsonb_array_length(input->'songs')>100 then raise exception 'Too many songs'; end if;
  for item in select value from jsonb_array_elements(input->'songs') loop
   if coalesce(trim(item->>'name'),'')='' then continue; end if;
   insert into public.archive_candidates(video_id,source_id,source_key,position,name,artist,reasons)
    values(previous->>'video_id',(previous->>'id')::uuid,'ocr:'||(previous->>'id')||':'||(item->>'position'),(item->>'position')::integer,
    left(trim(item->>'name'),300),left(trim(coalesce(item->>'artist','')),300),'["OCR 必須人工審核"]') on conflict(source_key) do nothing;
  end loop;
  update public.archive_evidence set status='review' where id=(previous->>'id')::uuid returning to_jsonb(archive_evidence.*) into result;
  entity := 'evidence'; entity_id := result->>'id';
 when 'revision_restore' then
  select * into r from public.archive_revisions where id=(input->>'revision_id')::bigint;
  if r.before_data is null or r.entity not in ('songs','candidates','performances') then raise exception 'Revision cannot be restored'; end if;
  return public.archive_command(case r.entity when 'songs' then 'song_save' when 'candidates' then 'candidate_save' else 'performance_save' end,
    r.before_data || jsonb_build_object('version',expected));
 else raise exception 'Unknown command';
 end case;
 if result is null then raise exception 'Record missing'; end if;
 insert into public.archive_revisions(entity,entity_id,action,actor,before_data,after_data) values(entity,entity_id,command,auth.uid(),previous,result);
 if command in ('candidate_publish','performance_save','song_save','stream_save') then perform public.archive_refresh_snapshot(); end if;
 return result;
end $$;

-- All member writes go through the checked transaction above; no direct client writes.
do $$ declare t text; begin
 foreach t in array array['members','songs','aliases','streams','evidence','candidates','performances','revisions','jobs','settings','snapshots'] loop
  execute format('alter table public.archive_%I enable row level security',t);
  execute format('create policy member_read on public.archive_%I for select to authenticated using (public.archive_role() is not null)',t);
  execute format('revoke all on public.archive_%I from anon, authenticated',t);
  execute format('grant select on public.archive_%I to authenticated',t);
  execute format('grant all on public.archive_%I to service_role',t);
 end loop;
end $$;
revoke all on function public.archive_refresh_snapshot() from public,anon,authenticated;
revoke all on function public.archive_require_member(boolean) from public,anon;
revoke all on function public.archive_command(text,jsonb) from public,anon;
revoke all on function public.archive_claim_invitation() from public,anon;
grant execute on function public.archive_command(text,jsonb),public.archive_claim_invitation(),public.archive_require_member(boolean) to authenticated;
revoke all on function public.archive_public_snapshot() from public;
grant execute on function public.archive_public_snapshot() to anon,authenticated,service_role;
grant execute on function public.archive_refresh_snapshot() to service_role;
grant usage,select on all sequences in schema public to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('archive-evidence','archive-evidence',false,10485760,array['image/png','image/jpeg']) on conflict(id) do nothing;
-- The server verifies bytes before uploading. Members only read via short-lived signed URLs.
create policy archive_image_read on storage.objects for select to authenticated
 using(bucket_id='archive-evidence' and public.archive_role() is not null);

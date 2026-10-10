import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

let db;
const owner='11111111-1111-4111-8111-111111111111',editor='22222222-2222-4222-8222-222222222222',stranger='33333333-3333-4333-8333-333333333333';
const video='GzB_HSosjw8';
async function login(id,role='authenticated') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)",[id,role]);
  await db.exec(`set role ${role}`);
}
async function command(command,input){return (await db.query('select public.archive_command($1,$2::jsonb) data',[command,JSON.stringify(input)])).rows[0].data;}
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create schema storage;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create table auth.identities(user_id uuid,provider text,identity_data jsonb);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role',true) $$;
    grant usage on schema auth,storage to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;
    insert into auth.users values('${owner}',now()),('${editor}',now()),('${stranger}',now());
    insert into auth.identities values('${editor}','google','{"email":"editor@example.com","email_verified":true}');`);
  for(const name of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(name=>name.endsWith('.sql')).sort()){
    try{await db.exec(await readFile(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));}
    catch(error){error.message=`${name}: ${error.message}`;throw error;}
  }
  await db.exec(`insert into public.archive_members(email,role) values('owner@example.com','owner');`);
});
after(async()=>{await db?.close();});

test('pre-seeded owner claims verified Google identity once, retaining role and an audit record',async()=>{
  await login(owner);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  await db.exec(`insert into auth.identities values('${owner}','google','{"email":"OWNER@example.com","email_verified":false}');`);
  await login(owner);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  await db.exec(`update auth.identities set identity_data=jsonb_set(identity_data,'{email_verified}','true') where user_id='${owner}';
    update auth.users set email_confirmed_at=null where id='${owner}';`);
  await login(owner);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  await db.exec(`update auth.users set email_confirmed_at=now() where id='${owner}';
    update public.archive_members set active=false where role='owner';`);
  await login(owner);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  assert.equal((await db.query("select user_id from public.archive_members where role='owner'")).rows[0].user_id,null);
  await db.exec("update public.archive_members set active=true where role='owner'");
  await login(owner);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,'owner');
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,'owner');
  const member=(await db.query("select * from public.archive_members where role='owner'")).rows[0];
  assert.equal(member.user_id,owner);
  const revisions=(await db.query("select * from public.archive_revisions where entity_id=$1 and action='invitation_claim'",[member.id])).rows;
  assert.equal(revisions.length,1);assert.equal(revisions[0].actor,owner);
  assert.equal(revisions[0].after_data.role,'owner');
});

test('different email, revoked invitation and already-bound owner cannot be claimed by another account',async()=>{
  await db.exec('reset role');
  await db.exec(`insert into auth.identities values('${stranger}','google','{"email":"stranger@example.com","email_verified":true}');`);
  await login(stranger);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  await db.exec("insert into public.archive_members(email,role,active) values('stranger@example.com','editor',false)");
  await login(stranger);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  await db.exec(`update auth.identities set identity_data=jsonb_set(identity_data,'{email}','"owner@example.com"') where user_id='${stranger}';`);
  await login(stranger);
  assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,null);
  await db.exec('reset role');
  assert.equal((await db.query("select user_id from public.archive_members where role='owner'")).rows[0].user_id,owner);
  assert.equal((await db.query("select user_id from public.archive_members where email='stranger@example.com'")).rows[0].user_id,null);
  await db.exec(`delete from public.archive_members where email='stranger@example.com';delete from auth.identities where user_id='${stranger}';`);
});

test('invitation binds verified Google email, editor cannot invite; revocation immediately blocks writes',async()=>{
  await login(owner);await command('member_invite',{email:'Editor@example.com'});
  await login(editor);assert.equal((await db.query('select public.archive_claim_invitation() role')).rows[0].role,'editor');
  await assert.rejects(command('member_invite',{email:'other@example.com'}),/Forbidden/);
  await command('stream_save',{video_id:video,title:'歌枠',stream_date:'2026-09-08',duration:4414});
  await login(owner);const member=(await db.query("select id from public.archive_members where email='editor@example.com'")).rows[0];
  await command('member_revoke',{id:member.id});
  await login(editor);await assert.rejects(command('stream_retry',{video_id:video}),/Forbidden/);
  assert.equal((await db.query('select * from public.archive_streams')).rows.length,0);
  await login(owner);await command('member_invite',{email:'editor@example.com'});
});
test('uninvited accounts and anonymous users cannot mutate or read unpublished data',async()=>{
  await login(stranger);await assert.rejects(command('song_save',{name:'x',artist:'y'}),/Forbidden/);
  assert.equal((await db.query('select * from public.archive_candidates')).rows.length,0);
  await login('', 'anon');await assert.rejects(db.query('select * from public.archive_candidates'),/permission denied/);
  await assert.rejects(command('candidate_publish',{id:owner,version:1}),/permission denied/);
});
test('candidate publish is version checked, atomic, repeated songs get independent slots, edits preserve links',async()=>{
  await login(editor);
  const candidate=await command('candidate_save',{video_id:video,position:1,name:'深海少女',artist:'ゆうゆ',timestamp_seconds:754});
  const edited=await command('candidate_save',{...candidate,name:'深海少女',timestamp_seconds:753});
  await assert.rejects(command('candidate_publish',{id:candidate.id,version:candidate.version}),/Version conflict/);
  assert.equal((await db.query('select * from public.archive_performances')).rows.length,0);
  await command('candidate_publish',{id:edited.id,version:edited.version});
  const song=(await db.query('select * from public.archive_songs')).rows[0];
  const second=await command('candidate_save',{video_id:video,position:2,name: song.name,artist:song.artist,timestamp_seconds:900});
  await command('candidate_publish',{id:second.id,version:second.version});
  const snapshot=(await db.query('select public.archive_public_snapshot() data')).rows[0].data;
  assert.equal(snapshot.songs[0].versions.length,2);assert.equal(snapshot.songs[0].versions[0].timestampSeconds,753);
  await command('song_save',{...song,name:'深海少女（修正）'});
  const next=(await db.query('select public.archive_public_snapshot() data')).rows[0].data;
  assert.deepEqual(next.aliases,[{from:'深海少女',to:'深海少女（修正）'}]);
  await assert.rejects(command('song_save',{...song,name:'過期修正'}),/Version conflict/);
});
test('OCR missing time stays pending; image sources require matching existing video',async()=>{
  await login(editor);
  await assert.rejects(command('source_add',{video_id:'Yg2Iw8x-r5U',source_url:'https://x.com/culua0211/status/2091907669770834344'}),/foreign key/);
  const source=await command('source_add',{video_id:video,source_url:'https://x.com/culua0211/status/2096983824911790103'});
  assert.equal(source.status,'needs_image');
  await command('source_ocr',{id:source.id,songs:[{position:1,name:'夢追い人',artist:''}]});
  const candidate=(await db.query('select * from public.archive_candidates where source_id=$1',[source.id])).rows[0];
  assert.equal(candidate.timestamp_seconds,null);
  await assert.rejects(command('candidate_publish',{id:candidate.id,version:candidate.version}),/Artist and timestamp/);
});
test('worker honors dry run, human changes, idempotency and global lease',async()=>{
  await login(owner);await assert.rejects(command('enable_auto_publish',{enabled:true}),/Seven-day/);
  const song=(await db.query('select * from public.archive_songs limit 1')).rows[0];
  await login('', 'service_role');
  const votes=['comment-a','comment-b'].map(comment_id=>({comment_id,name:song.name,artist:song.artist,timestamp_seconds:1000}));
  const input=[{position:3,name:song.name,artist:song.artist,song_id:song.id,timestamp_seconds:1000,reasons:[],auto_publish:true,evidence:['comment-a','comment-b'],votes}];
  assert.equal((await db.query('select public.archive_apply_scan($1,$2::jsonb) n',[video,JSON.stringify(input)])).rows[0].n,0);
  await db.exec('reset role');await db.exec("update public.archive_settings set dry_run_started_at=now()-interval '8 days',auto_publish=true;update public.archive_streams set scan_complete=true;");
  await db.query("insert into public.archive_evidence(video_id,kind,comment_id,author_id,expires_at) values($1,'youtube','comment-a','author-a',now()+interval '30 days'),($1,'youtube','comment-b','author-b',now()+interval '30 days')",[video]);
  await login('', 'service_role');
  assert.equal((await db.query('select public.archive_apply_scan($1,$2::jsonb) n',[video,JSON.stringify(input)])).rows[0].n,1);
  assert.equal((await db.query('select public.archive_apply_scan($1,$2::jsonb) n',[video,JSON.stringify(input)])).rows[0].n,0);
  const changed=[{...input[0],timestamp_seconds:1031,reasons:['時間差超過三秒'],auto_publish:false}];
  await db.query('select public.archive_apply_scan($1,$2::jsonb)',[video,JSON.stringify(changed)]);
  assert.equal((await db.query("select count(*)::integer n from public.archive_candidates where source_key like 'youtube-conflict:%'")).rows[0].n,1);
  assert.equal((await db.query('select timestamp_seconds from public.archive_performances where video_id=$1 and position=3',[video])).rows[0].timestamp_seconds,1000);
  await db.query('select public.archive_apply_scan($1,$2::jsonb)',[video,JSON.stringify(changed)]);
  assert.equal((await db.query("select count(*)::integer n from public.archive_candidates where source_key like 'youtube-conflict:%'")).rows[0].n,1);
  assert.ok((await db.query("select public.archive_job_claim('test1') id")).rows[0].id);
  assert.equal((await db.query("select public.archive_job_claim('test2') id")).rows[0].id,null);
  await login(editor);const alias=await command('alias_add',{song_id:song.id,name:'人工核准別名',artist:song.artist});
  const stale=[{...input[0],position:4,votes:votes.map(v=>({...v,name:alias.name}))}];
  await command('alias_revoke',{id:alias.id});
  await login('', 'service_role');
  assert.equal((await db.query('select public.archive_apply_scan($1,$2::jsonb) n',[video,JSON.stringify(stale)])).rows[0].n,0);
  await db.exec("update public.archive_evidence set expires_at=now()-interval '1 day' where kind='youtube'");
  await db.query('select public.archive_expire_evidence()');
  assert.equal((await db.query("select count(*)::integer n from public.archive_evidence where kind='youtube'")).rows[0].n,0);
  assert.equal((await db.query('select public.archive_apply_scan($1,$2::jsonb) n',[video,JSON.stringify([{...input[0],position:5}])])).rows[0].n,0);
});
test('backup restore is owner-only and preserves memberships; restores a consistent snapshot',async()=>{
  await login(owner);
  const backup=(await db.query('select public.archive_export_backup() data')).rows[0].data;
  const song=(await db.query('select * from public.archive_songs limit 1')).rows[0];
  await command('song_save',{...song,name:'暫時修改'});
  await login(editor);await assert.rejects(db.query('select public.archive_restore_backup($1::jsonb)',[JSON.stringify(backup)]),/Forbidden/);
  await login(owner);await db.query('select public.archive_restore_backup($1::jsonb)',[JSON.stringify(backup)]);
  assert.equal((await db.query('select name from public.archive_songs where id=$1',[song.id])).rows[0].name,song.name);
  assert.equal((await db.query("select count(*)::integer n from public.archive_members where active")).rows[0].n,2);
  assert.equal((await db.query('select auto_publish from public.archive_settings')).rows[0].auto_publish,false);
  const oldCount=(await db.query('select count(*)::integer n from public.archive_performances')).rows[0].n;
  await assert.rejects(db.query('select public.archive_restore_backup($1::jsonb)',[JSON.stringify({format:1,songs:backup.songs})]),/Missing backup table/);
  assert.equal((await db.query('select count(*)::integer n from public.archive_performances')).rows[0].n,oldCount);
  await assert.rejects(db.query('select public.archive_restore_backup($1::jsonb,$2)',[JSON.stringify(backup),0]),/Data changed since restore preview/);
});
test('initial migration preserves the actual baseline, private rows and all legacy routes; malformed rows roll back',async()=>{
  await login(editor);await assert.rejects(db.query('select public.archive_import_sheet($1::jsonb)',[JSON.stringify([{video_id:video}])]),/Forbidden/);
  await db.exec('reset role');await db.exec('truncate public.archive_candidates,public.archive_performances,public.archive_evidence,public.archive_aliases,public.archive_streams,public.archive_songs,public.archive_unavailable cascade');
  const snapshot=JSON.parse(await readFile(new URL('../utils/archive/legacy-snapshot.json',import.meta.url)));
  const rows=snapshot.songs.flatMap(s=>s.versions.map(v=>({video_id:new URL(v.streamUrl).searchParams.get('v'),date:v.date,stream_title:v.streamTitle,name:s.songName,artist:v.artist||s.artist,timestamp_seconds:v.timestampSeconds,song_link:v.songLink}))).sort((a,b)=>a.video_id.localeCompare(b.video_id)||a.timestamp_seconds-b.timestamp_seconds);
  const positions=new Map();for(const row of rows){row.position=(positions.get(row.video_id)||0)+1;positions.set(row.video_id,row.position);}
  await login(owner);
  await assert.rejects(db.query('select public.archive_import_sheet($1::jsonb)',[JSON.stringify([rows[0],{...rows[1],video_id:'invalid'}])]),/check constraint/);
  assert.equal((await db.query('select count(*)::integer n from public.archive_performances')).rows[0].n,0);
  const migrated=(await db.query(`select public.archive_import_sheet_request($1::jsonb,$2::jsonb,'77777777-7777-4777-8777-777777777777','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') data`,[JSON.stringify(rows),JSON.stringify([{曲名:'足りない',配信URL:'非公開',タイムスタンプ:'h:mm:ss'}])])).rows[0].data;
  assert.equal(migrated.performances,3131);assert.equal(migrated.songs,658);assert.equal(migrated.unavailable,1);
  const publicData=(await db.query('select public.archive_public_snapshot() data')).rows[0].data;
  assert.equal(publicData.songs.length,639);assert.equal(publicData.songs.reduce((sum,s)=>sum+s.versions.length,0),3131);
  await assert.rejects(db.query('select public.archive_import_sheet($1::jsonb)',[JSON.stringify(rows)]),/Archive is not empty/);
  const unavailable=(await db.query('select * from public.archive_unavailable')).rows[0];
  await command('unavailable_resolve',{id:unavailable.id,version:unavailable.version,video_id:rows[0].video_id});
  const fullBackup=(await db.query('select public.archive_export_backup() data')).rows[0].data;
  const restored=(await db.query('select public.archive_restore_backup($1::jsonb) data',[JSON.stringify(fullBackup)])).rows[0].data;
  assert.equal(restored.performances,3131);assert.equal((await db.query('select resolved_video_id from public.archive_unavailable')).rows[0].resolved_video_id,rows[0].video_id);
});


test('receipts are atomic, actor-bound and replays cannot resurrect a removed candidate',async()=>{
  await login(owner);
  const request_id='55555555-5555-4555-8555-555555555555';
  const id='66666666-6666-4666-8666-666666666666';
  const input={id,create:true,request_id,video_id:video,position:99,name:'Receipt test',artist:'Test',timestamp_seconds:60};
  const created=await command('candidate_save',input);
  assert.equal(created.id,id);
  assert.deepEqual(await command('candidate_save',input),created);
  await assert.rejects(command('candidate_save',{...input,name:'Changed'}),/Request identity mismatch/);
  await db.exec('reset role');
  await db.query('delete from public.archive_candidates where id=$1',[id]);
  await login(owner);
  await assert.rejects(command('candidate_save',{id,version:1,video_id:video,position:99,name:'Stale',timestamp_seconds:61}),error=>error.code==='PT409'&&/Candidate no longer exists/.test(error.message));
  assert.deepEqual(await command('candidate_save',input),created);
  assert.equal((await db.query('select count(*)::int n from public.archive_candidates where id=$1',[id])).rows[0].n,0);
  await login(editor);
  await assert.rejects(command('candidate_save',input),/Request identity mismatch|Forbidden/);
  await db.exec('reset role');
  await db.exec("update public.archive_members set active=false where role='owner'");
  await login(owner);
  await assert.rejects(command('candidate_save',input),/Forbidden/);
  await db.exec('reset role');
  await db.exec("update public.archive_members set active=true where role='owner'");
});

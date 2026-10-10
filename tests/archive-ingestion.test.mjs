import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseSetlist,parseTimestamp,reconcileSetlists,videoIdFromUrl,validateImageUrl,validateXPost,imageMime,normalizeDate} from '../utils/archive/ingestion.mjs';
import {parseSheet,groupSheetRows} from '../utils/archive/sheet.mjs';
import {encryptBackup,decryptBackup} from '../utils/archive/backup.mjs';
import {youtubeClient,YouTubeError,BudgetExceeded,isoDuration} from '../utils/archive/youtube.mjs';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/culua-comments.json',import.meta.url)));
const catalogFor=comments=>parseSetlist(comments[0].text).map((s,i)=>({...s,id:`song-${i}`}));

test('live OP/ED titles in Japanese quotes are markers; numeric song titles stay intact',()=>{
  const comment=fixtures['Yg2Iw8x-r5U'][0].text.replace('0:00:00 OP','0:00:00 OP『眩々』').replace('0:32:04 ED','0:32:04 ED『少しの自信があったら、』');
  const songs=parseSetlist(comment);
  assert.equal(songs.length,7);
  assert.equal(songs[0].name,'サターン');
  assert.equal(songs[0].timestamp_seconds,140);
  assert.deepEqual(parseSetlist('01:00 10月無口な君を忘れる / あたらよ\n02:00 05 曲名 / 歌手').map(s=>s.name),['10月無口な君を忘れる','曲名']);
});

test('real fixtures parse nine and seven songs each; OP, ED and start excluded',()=>{
  for(const comment of fixtures.GzB_HSosjw8)assert.equal(parseSetlist(comment.text).length,9);
  for(const comment of fixtures['Yg2Iw8x-r5U'])assert.equal(parseSetlist(comment.text).length,7);
  assert.deepEqual(parseSetlist('１２：３４ ０１． 曲名／歌手')[0],{position:1,name:'曲名',artist:'歌手',timestamp_seconds:754});
  assert.equal(parseTimestamp('12:60'),null);assert.equal(parseTimestamp('h:mm:ss'),null);
  assert.equal(normalizeDate('2024/08/31'),'2024-08-31');assert.equal(normalizeDate('2025/6/9'),'2025-06-09');assert.equal(normalizeDate('2026-02-30'),null);
});
test('typos and 31-second disagreement stay pending, approved exact matches publish separately',()=>{
  const comments=fixtures.GzB_HSosjw8,catalog=catalogFor(comments);
  const result=reconcileSetlists(comments,catalog,[],4414,true);
  assert.deepEqual(result.filter(r=>r.auto_publish).map(r=>r.position),[1,2,6]);
  assert.equal(result[0].timestamp_seconds,753);
  assert.equal(result[2].auto_publish,false);assert.ok(result[7].reasons.includes('時間差超過三秒'));
  assert.ok(reconcileSetlists(comments,catalog,[],4414,false).every(r=>!r.auto_publish));
});
test('approved artist aliases allow consensus but 19-second last-song conflict remains',()=>{
  const comments=fixtures['Yg2Iw8x-r5U'],catalog=catalogFor(comments);
  const aliases=[1,2,3,6].map(i=>({song_id:catalog[i].id,name:catalog[i].name,artist:'CULUA'}));
  aliases.push({song_id:catalog[6].id,name:'夢追人',artist:'CULUA'});
  const result=reconcileSetlists(comments,catalog,aliases,1936,true);
  assert.equal(result.filter(r=>r.auto_publish).length,6);assert.equal(result[6].auto_publish,false);
});
test('one author cannot create consensus, third-source conflict and invalid duration block publishing',()=>{
  const comments=fixtures.GzB_HSosjw8,catalog=catalogFor(comments);
  assert.ok(reconcileSetlists([comments[0],{...comments[0],id:'different'}],catalog,[],4414,true).every(r=>!r.auto_publish));
  const conflict={...comments[0],id:'third',author_id:'third',text:comments[0].text.replace('深海少女','別の曲')};
  assert.equal(reconcileSetlists([...comments,conflict],catalog,[],4414,true)[0].auto_publish,false);
  assert.ok(reconcileSetlists(comments,catalog,[],50,true).every(r=>!r.auto_publish));
});
test('video and image URLs bind exact hosts; SSRF and invalid bytes are rejected',()=>{
  assert.equal(videoIdFromUrl('https://www.youtube.com/watch?v=GzB_HSosjw8&t=1472s'),'GzB_HSosjw8');
  assert.equal(videoIdFromUrl('https://youtube.com.evil.test/watch?v=GzB_HSosjw8'),null);
  for(const url of ['http://pbs.twimg.com/a','https://pbs.twimg.com.evil/a','https://user@pbs.twimg.com/a','https://127.0.0.1/a'])assert.throws(()=>validateImageUrl(url));
  assert.equal(validateXPost('https://x.com/culua0211/status/2091907669770834344/photo/1?s=20'),'https://x.com/culua0211/status/2091907669770834344');
  assert.throws(()=>imageMime(Buffer.from('<svg/>')));
});
test('legacy import preserves private rows, deduplicates replay and reports malformed records',()=>{
  const csv='日付,配信URL,配信タイトル,タイムスタンプ,曲名,アーティスト\n2026-09-08,https://youtu.be/GzB_HSosjw8,歌枠,12:33,深海少女,ゆうゆ\n2026-09-08,https://youtu.be/GzB_HSosjw8,歌枠,12:33,深海少女,ゆうゆ\n2026-08-13,非公開,歌枠,h:mm:ss,足りない,DUSTCELL';
  const result=parseSheet(csv);assert.equal(result.rows.length,1);assert.equal(result.unavailable.length,1);assert.deepEqual(result.errors,[]);
  assert.equal(parseSheet(csv.replace('12:33','bad')).errors.length,1);
});
test('same-title artist variants preserve one legacy route and all performances',()=>{
  const grouped=groupSheetRows([{name:'曲',artist:'A',video_id:'GzB_HSosjw8',date:'2026-09-08',stream_title:'歌枠',timestamp_seconds:12,song_link:''},{name:'曲',artist:'B',video_id:'Yg2Iw8x-r5U',date:'2026-09-09',stream_title:'歌枠',timestamp_seconds:30,song_link:''}]);
  assert.equal(grouped.length,1);assert.equal(grouped[0].versions.length,2);assert.equal(grouped[0].artist,'A / B');
  assert.equal(parseSetlist('12:34 曲 / 和田たけあき(くらげP)')[0].artist,'和田たけあき(くらげP)');
});
test('encrypted backup round trip detects tampering and wrong key',()=>{
  const key='01'.repeat(32),data={format:1,songs:[{name:'深海少女'}],assets:[]};
  const encrypted=encryptBackup(data,key);assert.deepEqual(decryptBackup(encrypted,key),data);
  assert.throws(()=>decryptBackup(encrypted,'02'.repeat(32)));
  encrypted[encrypted.length-1]^=1;assert.throws(()=>decryptBackup(encrypted,key));
});
test('YouTube client distinguishes commentsDisabled, enforces quota and retries transient errors twice',async()=>{
  const disabled=youtubeClient('test',{fetcher:async()=>new Response(JSON.stringify({error:{errors:[{reason:'commentsDisabled'}]}}),{status:403})});
  await assert.rejects(disabled.get('commentThreads',{}),e=>e instanceof YouTubeError&&e.reason==='commentsDisabled');assert.equal(disabled.units,1);
  let attempts=0;const client=youtubeClient('test',{maxUnits:3,fetcher:async()=>{attempts++;return new Response('{}',{status:attempts<3?503:200});}});
  await client.get('videos',{});assert.equal(attempts,3);await assert.rejects(client.get('videos',{}),BudgetExceeded);
  const timeout=youtubeClient('test',{fetcher:async()=>{throw new DOMException('timeout','TimeoutError');}});await assert.rejects(timeout.get('videos',{}),/timeout/);assert.equal(timeout.units,3);
  assert.equal(isoDuration('PT1H13M34S'),4414);
});

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { reconcileSetlists, parseSetlist } from '../utils/archive/ingestion.mjs';
import { youtubeClient, isoDuration, BudgetExceeded } from '../utils/archive/youtube.mjs';
import { cleanupUploads } from '../utils/archive/storage.mjs';

const env=name=>{const value=process.env[name];if(!value)throw new Error(`Missing ${name}`);return value;};
const db=createClient(env('NEXT_PUBLIC_SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const yt=youtubeClient(env('YOUTUBE_API_KEY'),{maxMs:570000});
const channelId=env('YOUTUBE_CHANNEL_ID');
const result=async promise=>{const response=await promise;if(response.error)throw new Error(response.error.message);return response.data;};
async function all(table,configure=q=>q) {
  const rows=[];
  for(let offset=0;;offset+=1000) {const page=await result(configure(db.from(table).select('*')).range(offset,offset+999));rows.push(...page);if(page.length<1000)return rows;}
}
const jobKey=process.env.ARCHIVE_JOB_KEY||`daily:${new Date().toISOString().slice(0,10)}`;
const job=await result(db.rpc('archive_job_claim',{key:jobKey}));
if(!job){console.log('Already completed or another worker holds the lease');process.exit(0);}
const errors=[], stats={discovered:0,scanned:0,published:0,deferred:0};
const streamDate=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));

async function discover(settings) {
  const channels=await yt.get('channels',{part:'contentDetails',id:channelId});
  const uploads=channels.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if(!uploads)throw new Error('Official channel uploads playlist unavailable');
  let cursor=settings.discovery_cursor,done=false;
  while(!done) {
    const page=await yt.get('playlistItems',{part:'contentDetails',playlistId:uploads,maxResults:50,pageToken:cursor});
    const recent=page.items.filter(i=>Date.parse(i.contentDetails.videoPublishedAt)>=Date.parse(settings.activation_at));
    if(recent.length) {
      const videos=await yt.get('videos',{part:'snippet,contentDetails,liveStreamingDetails',id:recent.map(i=>i.contentDetails.videoId).join(',')});
      const rows=videos.items.filter(v=>v.snippet.channelId===channelId&&v.snippet.title.includes('歌枠')&&v.liveStreamingDetails?.actualEndTime)
        .map(v=>({video_id:v.id,title:v.snippet.title,stream_date:streamDate(v.liveStreamingDetails.actualStartTime),duration:isoDuration(v.contentDetails.duration),channel_id:channelId}));
      if(rows.length){await result(db.from('archive_streams').upsert(rows,{onConflict:'video_id',ignoreDuplicates:true}));stats.discovered+=rows.length;}
    }
    done=!page.nextPageToken || recent.length<page.items.length;
    cursor=done?null:page.nextPageToken;
    await result(db.from('archive_settings').update({discovery_cursor:cursor,discovery_complete:done}).eq('id',true));
  }
}

async function scan(stream,catalog,aliases) {
  let cursor=stream.scan_cursor,count=stream.scan_count,generation=stream.scan_generation;
  if(!cursor) {
    const videos=await yt.get('videos',{part:'snippet,contentDetails,liveStreamingDetails',id:stream.video_id});
    const video=videos.items?.[0];
    if(!video)throw new Error('影片不存在或已非公開');
    if(video.snippet.channelId!==channelId)throw new Error('影片不屬於設定的 CULUA 官方頻道');
    if(!video.liveStreamingDetails?.actualEndTime)throw new Error('影片尚未結束，或不是直播存檔');
    stream.duration=isoDuration(video.contentDetails.duration);count=0;generation=randomUUID();
    await result(db.from('archive_streams').update({duration:stream.duration,scan_generation:generation,scan_count:0,scan_complete:false,scan_status:'incomplete',retry_requested:false,last_error:null}).eq('video_id',stream.video_id));
  }
  while(count<1000) {
    const page=await yt.get('commentThreads',{part:'snippet',videoId:stream.video_id,maxResults:100,textFormat:'plainText',order:'time',pageToken:cursor});
    const comments=page.items.map(item=>({id:item.snippet.topLevelComment.id,...item.snippet.topLevelComment.snippet}));
    const evidence=comments.filter(c=>c.authorChannelId?.value&&parseSetlist(c.textOriginal||c.textDisplay).length>=2).map(c=>({
      video_id:stream.video_id,kind:'youtube',status:'ready',comment_id:c.id,author_id:c.authorChannelId.value,
      source_url:`https://www.youtube.com/watch?v=${stream.video_id}&lc=${c.id}`,raw_text:c.textOriginal||c.textDisplay,
      expires_at:new Date(Date.now()+30*86400000).toISOString(),scan_generation:generation,
    }));
    if(evidence.length)await result(db.from('archive_evidence').upsert(evidence,{onConflict:'video_id,comment_id'}));
    count+=comments.length;cursor=page.nextPageToken||null;
    const complete=!cursor;
    await result(db.from('archive_streams').update({scan_cursor:cursor,scan_count:count,scan_complete:complete,scan_status:complete?'ready':'incomplete',last_checked_at:new Date().toISOString()}).eq('video_id',stream.video_id));
    if(complete||count>=1000) {
      const stored=await all('archive_evidence',q=>q.eq('video_id',stream.video_id).eq('kind','youtube').eq('scan_generation',generation));
      const candidates=reconcileSetlists(stored.filter(c=>c.raw_text&&c.author_id).map(c=>({id:c.comment_id,author_id:c.author_id,text:c.raw_text})),catalog,aliases,stream.duration,complete);
      stats.published+=await result(db.rpc('archive_apply_scan',{vid:stream.video_id,candidates}));
      await result(db.from('archive_streams').update({scan_status:complete?(candidates.length?'ready':'no_setlist'):'incomplete',retry_requested:false}).eq('video_id',stream.video_id));
      stats.scanned++;return;
    }
  }
}

try {
  await result(db.rpc('archive_expire_evidence'));
  const [settings,catalog,aliases]=await Promise.all([result(db.from('archive_settings').select('*').single()),all('archive_songs'),all('archive_aliases')]);
  try{await discover(settings);}catch(error){if(error instanceof BudgetExceeded)stats.deferred++;else errors.push(`discovery: ${error.message}`);}
  const cutoff=new Date(Date.now()-14*86400000).toISOString().slice(0,10);
  const streams=await all('archive_streams',q=>q.or(`retry_requested.eq.true,stream_date.gte.${cutoff},scan_cursor.not.is.null`).order('last_checked_at',{ascending:true,nullsFirst:true}));
  for(const stream of streams) {
    // A capped 1,000-comment scan remains review-only; a manual retry starts a fresh scan.
    if(stream.scan_count>=1000 && !stream.retry_requested && !stream.scan_complete)continue;
    try{yt.check();await scan(stream,catalog,aliases);}
    catch(error){
      if(error instanceof BudgetExceeded){stats.deferred++;break;}
      const disabled=error.reason==='commentsDisabled';
      await result(db.from('archive_streams').update({scan_status:disabled?'comments_disabled':'error',last_error:error.message,last_checked_at:new Date().toISOString(),scan_complete:false}).eq('video_id',stream.video_id));
      if(!disabled)errors.push(`${stream.video_id}: ${error.message}`);
    }
  }
  try{await cleanupUploads(db,yt.check);}catch(error){if(error instanceof BudgetExceeded)stats.deferred++;else errors.push(`storage cleanup: ${error.message}`);}
  await result(db.from('archive_jobs').update({status:errors.length?'error':'success',finished_at:new Date().toISOString(),details:{...stats,units:yt.units,errors}}).eq('id',job));
  if(stats.scanned && process.env.ARCHIVE_SITE_URL && process.env.ARCHIVE_REVALIDATE_SECRET) {
    const url=new URL('/api/archive/revalidate',process.env.ARCHIVE_SITE_URL);
    const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${process.env.ARCHIVE_REVALIDATE_SECRET}`},signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(`Cache refresh failed (${response.status})`);
  }
  console.log(JSON.stringify({...stats,units:yt.units,errors}));
  if(errors.length)process.exitCode=1;
}catch(error){
  await result(db.from('archive_jobs').update({status:'error',finished_at:new Date().toISOString(),details:{error:error.message,units:yt.units}}).eq('id',job));
  throw error;
}

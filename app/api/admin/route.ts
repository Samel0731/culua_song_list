import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { AccessError, checkOrigin, requireMember } from '@/utils/archive/supabaseServer';
import { apiError, rpcError } from '@/utils/archive/api';

export const dynamic = 'force-dynamic';
const commands = new Set(['member_invite','member_revoke','enable_auto_publish','stream_save','stream_retry','song_save','alias_add','alias_revoke','candidate_save','candidate_publish','candidate_reject','performance_save','source_ocr','revision_restore','unavailable_resolve']);
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  try {
    const { db, role } = await requireMember();
    const receipt = new URL(request.url).searchParams.get('request');
    if(receipt) {
      if(!/^[a-f0-9-]{36}$/i.test(receipt))throw new AccessError('無效請求識別碼',400);
      const found=await db.from('archive_requests').select('request_id,result,created_at').eq('request_id',receipt).maybeSingle();
      if(found.error)throw new Error(found.error.message);
      return NextResponse.json({found:!!found.data,result:found.data?.result},{headers});
    }
    const vid = new URL(request.url).searchParams.get('video');
    if (vid && !/^[\w-]{11}$/.test(vid)) throw new AccessError('無效影片 ID',400);
    const tables = ['streams','songs','aliases','candidates','evidence','performances','revisions','jobs','settings','unavailable', ...(role === 'owner' ? ['members'] : [])];
    const data: Record<string, unknown> = { role, members: [] };
    await Promise.all(tables.map(async table => {
      let query = db.from(`archive_${table}`).select('*');
      if (vid && ['candidates','evidence','performances'].includes(table)) query = query.eq('video_id',vid);
      if (table==='streams') query = query.order('stream_date',{ascending:false});
      if (['revisions','jobs'].includes(table)) query = query.order(table==='jobs'?'started_at':'id',{ascending:false});
      if (table==='songs' || table==='streams' || table==='aliases') {
        const songs = [];
        for (let start=0; ;start+=1000) {
          const page = await db.from(`archive_${table}`).select('*').order(table==='streams'?'stream_date':'name',{ascending:table!=='streams'}).order(table==='streams'?'video_id':'id').range(start,start+999);
          if (page.error) throw new Error(page.error.message);
          songs.push(...page.data);
          if (page.data.length<1000) break;
        }
        data[table]=songs; return;
      }
      const { data: rows, error } = await query.limit(vid ? 1000 : table==='streams'?200:100);
      if (error) throw new Error(error.message);
      data[table] = table==='settings'?rows?.[0]:rows;
    }));
    return NextResponse.json(data,{headers});
  } catch(error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { db } = await requireMember();
    const raw=await request.text();
    if (raw.length>512000) throw new AccessError('資料過大',413);
    const { command, input } = JSON.parse(raw);
    if (!commands.has(command) || !input || typeof input!=='object' || !/^[a-f0-9-]{36}$/i.test(input.request_id||'')) throw new AccessError('無效操作，請更新頁面後重試',400);
    const { data,error } = await db.rpc('archive_command',{command,input});
    if (error) throw rpcError(error);
    if(['candidate_publish','performance_save','song_save','stream_save','revision_restore'].includes(command))revalidateTag('song-archive',{expire:0});
    return NextResponse.json(data,{headers});
  } catch(error) { return apiError(error); }
}

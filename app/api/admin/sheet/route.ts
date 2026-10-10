import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { AccessError, checkOrigin, requireMember } from '@/utils/archive/supabaseServer';
import { parseSheet } from '@/utils/archive/sheet.mjs';
import { apiError, rpcError } from '@/utils/archive/api';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const {db}=await requireMember(true,55000);
    const body=await request.text();
    if(body.length>8*1024*1024)throw new AccessError('CSV 超過 8 MB',413);
    const {csv,commit,digest,request_id}=JSON.parse(body);
    if(typeof csv!=='string')throw new AccessError('需要 CSV',400);
    const preview=parseSheet(csv);
    const actual=createHash('sha256').update(csv).digest('hex');
    if(!commit)return NextResponse.json({...preview,digest:actual},{headers:{'Cache-Control':'private, no-store'}});
    if(actual!==digest || preview.errors.length || !preview.rows.length)throw new AccessError('請先修正並重新預覽 CSV',400);
    if(!/^[a-f0-9-]{36}$/i.test(request_id||''))throw new AccessError('需要有效請求識別碼',400);
    const imported=await db.rpc('archive_import_sheet_request',{rows:preview.rows,unavailable:preview.unavailable,request_id,digest:actual});
    if(imported.error)throw rpcError(imported.error);
    revalidateTag('song-archive',{expire:0});
    return NextResponse.json(imported.data,{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}

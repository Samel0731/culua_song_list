import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { AccessError, checkOrigin, requireMember } from '@/utils/archive/supabaseServer';
import { parseSheet } from '@/utils/archive/sheet.mjs';
import { apiError } from '@/utils/archive/api';
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const {db}=await requireMember(true);
    const body=await request.text();
    if(body.length>8*1024*1024)throw new AccessError('CSV 超過 8 MB',413);
    const {csv,commit,digest}=JSON.parse(body);
    if(typeof csv!=='string')throw new AccessError('需要 CSV',400);
    const preview=parseSheet(csv);
    const actual=createHash('sha256').update(csv).digest('hex');
    if(!commit)return NextResponse.json({...preview,digest:actual},{headers:{'Cache-Control':'private, no-store'}});
    if(actual!==digest || preview.errors.length || !preview.rows.length)throw new AccessError('請先修正並重新預覽 CSV',400);
    const imported=await db.rpc('archive_import_sheet',{rows:preview.rows,unavailable:preview.unavailable});
    if(imported.error)throw new AccessError(imported.error.message,400);
    revalidateTag('song-archive',{expire:0});
    return NextResponse.json(imported.data);
  }catch(error){return apiError(error);}
}

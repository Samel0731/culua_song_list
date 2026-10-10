import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { AccessError, checkOrigin, requireMember, serviceClient } from '@/utils/archive/supabaseServer';
import { collectBackup, encryptBackup, decryptBackup, restoreAssets } from '@/utils/archive/backup.mjs';
import { apiError, rpcError } from '@/utils/archive/api';
export const runtime='nodejs';
export async function GET() {
  try {
    await requireMember(true,55000);
    const data=await collectBackup(serviceClient());
    const bytes=encryptBackup(data,process.env.ARCHIVE_BACKUP_KEY);
    return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="culua-${new Date().toISOString().slice(0,10)}.enc"`,'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const {db}=await requireMember(true,55000);
    const form=await request.formData(),file=form.get('file');
    if(!(file instanceof File)||file.size>25*1024*1024)throw new AccessError('需要 25 MB 以下的加密備份',400);
    const bytes=Buffer.from(await file.arrayBuffer());
    const data=decryptBackup(bytes,process.env.ARCHIVE_BACKUP_KEY);
    const digest=createHash('sha256').update(bytes).digest('hex');
    if(form.get('commit')!=='true') {
      const revisions=await db.from('archive_revisions').select('id').order('id',{ascending:false}).limit(1);
      if(revisions.error)throw new Error(revisions.error.message);
      return NextResponse.json({digest,revision:revisions.data[0]?.id||0,created_at:data.created_at,songs:data.songs.length,performances:data.performances.length,assets:data.assets.length},{headers:{'Cache-Control':'private, no-store'}});
    }
    if(form.get('digest')!==digest)throw new AccessError('備份檔案變更，請重新預覽',400);
    await restoreAssets(serviceClient(),data);
    const request_id=String(form.get('request_id')||'');
    if(!/^[a-f0-9-]{36}$/i.test(request_id))throw new AccessError('需要有效請求識別碼',400);
    const restored=await db.rpc('archive_restore_backup_request',{backup:data,expected_revision:Number(form.get('revision')),request_id});
    if(restored.error)throw rpcError(restored.error);
    revalidateTag('song-archive',{expire:0});
    return NextResponse.json(restored.data,{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}

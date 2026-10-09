import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {AccessError,checkOrigin,requireMember,serviceClient} from '@/utils/archive/supabaseServer';
import {apiError} from '@/utils/archive/api';
export async function POST(request:Request) {
  try {
    checkOrigin(request);
    const {db,user}=await requireMember();
    const {video,size,mime}=await request.json();
    if(!/^[\w-]{11}$/.test(video)||!Number.isInteger(size)||size<=0||size>10*1024*1024||!['image/png','image/jpeg'].includes(mime))throw new AccessError('圖片格式、大小或影片無效',400);
    const stream=await db.from('archive_streams').select('video_id').eq('video_id',video).single();
    if(!stream.data)throw new AccessError('請先建立直播資料',400);
    const path=`${user.id}/${video}/${randomUUID()}.${mime==='image/png'?'png':'jpg'}`;
    const signed=await serviceClient().storage.from('archive-evidence').createSignedUploadUrl(path);
    if(signed.error)throw new Error('無法建立上傳連結');
    return NextResponse.json({path,token:signed.data.token},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}

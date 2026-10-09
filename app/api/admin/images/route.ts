import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { AccessError, checkOrigin, requireMember, serviceClient } from '@/utils/archive/supabaseServer';
import { imageMime, validateImageUrl, validateXPost, videoIdFromUrl } from '@/utils/archive/ingestion.mjs';
import { apiError } from '@/utils/archive/api';
export const runtime='nodejs';
const MAX=10*1024*1024;

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const {db,user}=await requireMember();
    const form=await request.formData();
    const vid=videoIdFromUrl(String(form.get('video')||''));
    if (!vid) throw new AccessError('需要有效的 YouTube 影片',400);
    const stream=await db.from('archive_streams').select('video_id').eq('video_id',vid).single();
    if (!stream.data) throw new AccessError('請先建立直播資料',400);
    const post=form.get('post')?validateXPost(String(form.get('post'))):null;
    const direct=form.get('imageUrl');
    const file=form.get('file');
    const uploadedPath=form.get('storagePath');
    let bytes: Uint8Array | null=null;
    if(uploadedPath) {
      const path=String(uploadedPath);
      if(!path.startsWith(`${user.id}/${vid}/`)||!/^[-\w]{36}\/[\w-]{11}\/[-\w]{36}\.(png|jpg)$/.test(path))throw new AccessError('上傳路徑無效',400);
      const downloaded=await serviceClient().storage.from('archive-evidence').download(path);
      if(downloaded.error)throw new AccessError('上傳圖片不存在',400);
      if(downloaded.data.size>MAX)throw new AccessError('圖片超過 10 MB',413);
      bytes=new Uint8Array(await downloaded.data.arrayBuffer());
    } else if (file instanceof File && file.size) {
      if (file.size>MAX) throw new AccessError('圖片超過 10 MB',413);
      bytes=new Uint8Array(await file.arrayBuffer());
    } else if (direct) {
      const response=await fetch(validateImageUrl(String(direct)),{redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
      if (!response.ok || !response.body) throw new AccessError('無法取得圖片，請改用上傳',400);
      if (Number(response.headers.get('content-length'))>MAX) throw new AccessError('圖片超過 10 MB',413);
      const reader=response.body.getReader(), chunks: Uint8Array[]= []; let size=0;
      try { while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>MAX)throw new AccessError('圖片超過 10 MB',413); chunks.push(value); } }
      finally { await reader.cancel(); }
      bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    }
    if (!bytes && !post) throw new AccessError('請提供 X 貼文或圖片',400);
    let path: string|null=uploadedPath?String(uploadedPath):null;
    if(bytes) {
      let mime:string;
      try{mime=imageMime(bytes);}catch(error){if(path)await serviceClient().storage.from('archive-evidence').remove([path]);throw error;}
      if(!path) {
        path=`${user.id}/${vid}/${randomUUID()}.${mime==='image/png'?'png':'jpg'}`;
        const uploaded=await serviceClient().storage.from('archive-evidence').upload(path,bytes,{contentType:mime,upsert:false});
        if(uploaded.error)throw new Error('圖片儲存失敗');
      }
    }
    const saved=await db.rpc('archive_command',{command:form.get('sourceId')?'source_attach':'source_add',input:{id:form.get('sourceId')||null,video_id:vid,source_url:post,storage_path:path}});
    if(saved.error) {
      if(path)await serviceClient().storage.from('archive-evidence').remove([path]);
      throw new AccessError(saved.error.message,400);
    }
    return NextResponse.json(saved.data,{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}

export async function GET(request: Request) {
  try {
    const {db}=await requireMember();
    const id=new URL(request.url).searchParams.get('id');
    const source=await db.from('archive_evidence').select('storage_path').eq('id',id).single();
    if(!source.data?.storage_path)throw new AccessError('圖片尚未提供',404);
    const signed=await db.storage.from('archive-evidence').createSignedUrl(source.data.storage_path,60);
    if(signed.error)throw new Error('無法讀取圖片');
    return NextResponse.json({url:signed.data.signedUrl},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}

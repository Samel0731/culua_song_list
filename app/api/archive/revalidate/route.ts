import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
export async function POST(request:Request) {
  const secret=process.env.ARCHIVE_REVALIDATE_SECRET;
  if(!secret)return NextResponse.json({error:'Not configured'},{status:503});
  const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  const left=Buffer.from(supplied),right=Buffer.from(secret);
  if(left.length!==right.length||!timingSafeEqual(left,right))return NextResponse.json({error:'Forbidden'},{status:403});
  revalidateTag('song-archive',{expire:0});return NextResponse.json({ok:true});
}

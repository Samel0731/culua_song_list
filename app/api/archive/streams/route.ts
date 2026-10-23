import { NextResponse } from 'next/server';
import { readPublicArchive } from '@/utils/archive/publicArchiveServer';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const video = params.get('video');
  if (video && !/^[\w-]{11}$/.test(video)) return NextResponse.json({ error: 'Invalid video' }, { status: 400 });
  try {
    const archive = await readPublicArchive();
    const metadata = { stale: archive.stale, checkedAt: archive.checkedAt };
    const body = video ? { stream: archive.streams.find(s => s.videoId === video) || null, ...metadata }
      : { streams: archive.streams.map(s => ({ videoId: s.videoId, title: s.title, date: s.date, count: s.count })), songs: archive.songs, ...metadata };
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Archive unavailable' }, { status: 503 }); }
}

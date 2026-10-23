import { NextResponse } from 'next/server';
import { requireMember } from '@/utils/archive/supabaseServer';
import { apiError } from '@/utils/archive/api';
import { inspectQuality, type QualityData } from '@/utils/archive/quality';
import { readAll } from '@/utils/archive/readAll';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { db } = await requireMember();
    const columns = {
      streams: 'video_id,title,duration,scan_status,last_error',
      candidates: 'id,video_id,position,name,artist,timestamp_seconds,status,reasons',
      performances: 'id,video_id,position,published',
      unavailable: 'id,raw_data,resolved_video_id',
    };
    const entries = await Promise.all(Object.entries(columns).map(async ([table, fields]) => [table, await readAll((start, end) => db.from(`archive_${table}`).select(fields).order(table === 'streams' ? 'video_id' : 'id').range(start, end))]));
    return NextResponse.json(inspectQuality(Object.fromEntries(entries) as QualityData), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}

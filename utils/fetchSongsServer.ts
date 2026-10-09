import { unstable_cache } from 'next/cache';
import type { GroupedSong } from '@/utils/dataProcessor';
import { parseSheet, groupSheetRows, SHEET_URL } from '@/utils/archive/sheet.mjs';
import bundled from '@/utils/archive/legacy-snapshot.json';

type Snapshot={songs:GroupedSong[];aliases:{from:string;to:string}[]};
let lastSuccess: Snapshot | null=null;

async function readSnapshot(): Promise<Snapshot> {
    let snapshot: Snapshot;
    if(process.env.ARCHIVE_DATA_SOURCE==='supabase') {
      const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if(!url || !key)throw new Error('Archive database configuration missing');
      const res=await fetch(`${url}/rest/v1/rpc/archive_public_snapshot`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!res.ok)throw new Error(`Archive snapshot unavailable (${res.status})`);
      snapshot=await res.json();
    } else {
      const res=await fetch(SHEET_URL,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!res.ok)throw new Error(`Sheet unavailable (${res.status})`);
      const parsed=parseSheet(await res.text());
      if(parsed.errors.length)throw new Error('Sheet validation failed');
      if(!parsed.rows.length)throw new Error('Sheet contains no playable records');
      snapshot={songs:groupSheetRows(parsed.rows),aliases:[]};
    }
    if(!snapshot || !Array.isArray(snapshot.songs) || !Array.isArray(snapshot.aliases))throw new Error('Published snapshot missing');
    lastSuccess=snapshot;
    return snapshot;
}

const readCached=unstable_cache(readSnapshot,['song-archive-v3'],{revalidate:300,tags:['song-archive']});
export async function fetchArchiveSnapshot(): Promise<Snapshot> {
  try { return await readCached(); } catch(error) {
    console.error('Song archive read failed; retaining successful snapshot:',error instanceof Error?error.message:error);
    if(lastSuccess)return lastSuccess;
    if(bundled.songs.length)return bundled as Snapshot;
    throw error;
  }
}
export async function fetchSongsServer(): Promise<GroupedSong[]> {return (await fetchArchiveSnapshot()).songs;}
export async function resolveSongName(name: string) {
  const snapshot=await fetchArchiveSnapshot();
  if(snapshot.songs.some(s=>s.songName===name))return name;
  return snapshot.aliases.find(a=>a.from===name)?.to||name;
}

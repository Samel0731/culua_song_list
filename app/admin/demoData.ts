import type { Dashboard, Candidate } from '@/utils/archive/types';

export function demoDashboard(): Dashboard {
  return {
    role: 'editor', streams: [{ video_id: 'DEMOstream1', title: 'Sample 歌枠 · 示範直播', stream_date: '2026-10-10', duration: 3600, scan_status: 'ready', scan_complete: true, last_checked_at: null, last_error: null, version: 1 }],
    songs: [{ id: 'demo-song', name: '深海少女', artist: 'ゆうゆ', version: 1 }], aliases: [],
    candidates: [{ id: 'demo-candidate', video_id: 'DEMOstream1', source_id: null, position: 1, name: '深海少女', artist: 'ゆうゆ', timestamp_seconds: 753, status: 'review', reasons: [], version: 1, human_edited: false }],
    evidence: [], performances: [], members: [{ id: 'demo-member', user_id: null, email: 'collaborator@example.com', role: 'editor', active: true }], revisions: [], jobs: [], unavailable: [], settings: { auto_publish: false, dry_run_started_at: '2026-10-10' },
  };
}
// This adapter is deliberately in-memory. No fetch, OAuth or storage calls.
export function demoCommand(data: Dashboard, command: string, input: Record<string, unknown>) {
  if (command === 'stream_save') {
    const old = data.streams.find(s => s.video_id === input.video_id);
    const stream = { video_id: String(input.video_id), title: String(input.title), stream_date: String(input.stream_date), duration: input.duration as number | null, version: (old?.version || 0) + 1, scan_status: 'ready', scan_complete: true, last_checked_at: null, last_error: null };
    data.streams = [...data.streams.filter(s => s.video_id !== input.video_id), stream];
    return stream;
  } else if (command === 'candidate_save') {
    const old = data.candidates.find(c => c.id === input.id);
    const candidate = { ...old, ...input, id: String(input.id), status: 'review', source_id: old?.source_id || null, reasons: [], human_edited: true, version: (old?.version || 0) + 1 } as Candidate;
    data.candidates = [...data.candidates.filter(c => c.id !== candidate.id), candidate];
    return candidate;
  } else if (command === 'source_ocr') {
    for (const song of input.songs as { name: string; artist: string; position: number }[]) data.candidates.push({ ...song, id: crypto.randomUUID(), video_id: String(input.video_id), source_id: null, timestamp_seconds: null, status: 'review', reasons: [], version: 1, human_edited: true });
  } else if (command === 'candidate_publish' || command === 'candidate_reject') {
    const c = data.candidates.find(c => c.id === input.id)!;
    c.status = command === 'candidate_publish' ? 'published' : 'rejected'; c.version++;
    if (command === 'candidate_publish') {
      let song = data.songs.find(s => s.name === c.name && s.artist === c.artist);
      if (!song) { song = { id: crypto.randomUUID(), name: c.name, artist: c.artist, version: 1 }; data.songs.push(song); }
      data.performances.push({ id: crypto.randomUUID(), video_id: c.video_id, position: c.position, song_id: song.id, timestamp_seconds: c.timestamp_seconds!, song_link: '', published: true, version: 1 });
    }
    return c;
  } else if (command === 'song_save') {
    const old = data.songs.find(s => s.id === input.id);
    const song = { id: String(input.id || crypto.randomUUID()), name: String(input.name), artist: String(input.artist), version: (old?.version || 0) + 1 };
    data.songs = [...data.songs.filter(s => s.id !== input.id), song];
    return song;
  } else if (command === 'alias_add') data.aliases.push({ id: crypto.randomUUID(), song_id: String(input.song_id), name: String(input.name), artist: String(input.artist), route_alias: false });
  else if (command === 'alias_revoke') data.aliases = data.aliases.filter(a => a.id !== input.id);
  else if (command === 'member_invite') data.members.push({ id: crypto.randomUUID(), user_id: null, email: String(input.email), role: 'editor', active: true });
  else if (command === 'member_revoke') { const member = data.members.find(m => m.id === input.id); if (member) member.active = false; }
  else if (command === 'performance_save') { const p = data.performances.find(p => p.id === input.id); if (p) Object.assign(p, input, { version: p.version + 1 }); }
  else if (command === 'enable_auto_publish') throw new Error('需完成至少七天試運轉才能啟用自動發布。');
  return { ok: true };
}

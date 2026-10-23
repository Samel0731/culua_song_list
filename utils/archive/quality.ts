import type { Dashboard } from './types';

export const issueCodes = ['name', 'artist', 'time', 'duration', 'range', 'position', 'review', 'conflict', 'scan', 'legacy', 'empty'] as const;
export type IssueCode = typeof issueCodes[number];
export type QualityIssue = { id: string; entity: 'candidate' | 'stream' | 'unavailable'; video: string; title: string; streamTitle?: string; codes: IssueCode[] };
export type QualityReport = { items: QualityIssue[]; records: number; problems: number; counts: Record<IssueCode, number>; complete: boolean; checkedAt: string };
export type QualityData = Pick<Dashboard, 'streams' | 'candidates' | 'performances' | 'unavailable'>;

export function inspectQuality(data: QualityData): QualityReport {
  const items: QualityIssue[] = [];
  const streams = new Map(data.streams.map(s => [s.video_id, s]));
  const occupied = new Set(data.performances.map(p => `${p.video_id}:${p.position}`));
  const publicVideos = new Set(data.performances.filter(p => p.published).map(p => p.video_id));
  for (const c of data.candidates) {
    if (c.status !== 'review') continue;
    const codes: IssueCode[] = [];
    const duration = streams.get(c.video_id)?.duration;
    if (!c.name.trim()) codes.push('name');
    if (!c.artist.trim()) codes.push('artist');
    if (c.timestamp_seconds === null || !Number.isInteger(c.timestamp_seconds) || c.timestamp_seconds < 0) codes.push('time');
    if (!duration || duration <= 0) codes.push('duration');
    else if (c.timestamp_seconds !== null && c.timestamp_seconds >= duration) codes.push('range');
    if (occupied.has(`${c.video_id}:${c.position}`)) codes.push('position');
    if (c.reasons?.some(r => /conflict|disagree|矛盾|衝突/i.test(r))) codes.push('conflict');
    codes.push('review');
    items.push({ id: c.id, entity: 'candidate', video: c.video_id, title: c.name, streamTitle: streams.get(c.video_id)?.title, codes });
  }
  for (const s of data.streams) {
    const codes: IssueCode[] = [];
    if (!s.duration) codes.push('duration');
    if (s.last_error || ['failed', 'error', 'incomplete'].includes(s.scan_status)) codes.push('scan');
    if (!publicVideos.has(s.video_id)) codes.push('empty');
    if (codes.length) items.push({ id: s.video_id, entity: 'stream', video: s.video_id, title: s.title, codes });
  }
  for (const u of data.unavailable) if (!u.resolved_video_id) items.push({ id: u.id, entity: 'unavailable', video: '', title: String(u.raw_data['曲名'] || '—'), codes: ['legacy'] });
  const counts = Object.fromEntries(issueCodes.map(c => [c, items.filter(i => i.codes.includes(c)).length])) as Record<IssueCode, number>;
  return { items, records: items.length, problems: items.reduce((sum, i) => sum + i.codes.length, 0), counts, complete: true, checkedAt: new Date().toISOString() };
}

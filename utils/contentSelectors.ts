import type { OfficialWork, SourceState, WorkSelection } from './contentTypes';
export function selectWorks(works: OfficialWork[], selections: WorkSelection[]): OfficialWork[] {
  const pinned = selections.filter(s => s.pinned).sort((a, b) => a.order - b.order).flatMap(s => works.filter(w => w.sourceUrl === s.sourceUrl || w.streamingUrl === s.sourceUrl));
  return [...new Map([...pinned, ...works].map(w => [w.id, w])).values()];
}
export function worksBy(works: OfficialWork[], artist: string): OfficialWork[] {
  return artist === 'all' ? works : works.filter(w => w.artists.some(a => a === artist));
}
export function mvSongName(videoTitle: string, work: OfficialWork): string {
  const credit = new RegExp(`^(?:${work.artists.join('|')})(?:\\s*[×x&/]\\s*(?:${work.artists.join('|')}))*\\s*`);
  return videoTitle.replace(credit, '').replace(/Official Music Video/gi, '').replace(/[「」]/g, '').trim() || work.title;
}

// True only when every source that could supply the shown section has failed, so a failure is not presented as "nothing exists".
export function unavailable(sources: SourceState[], section: 'news' | 'events' | 'works' | 'timeline' | 'fanart', talent: string, kind: 'all' | 'event' | 'release'): boolean {
  const failed = (name: string) => sources.find(s => s.name === name)?.status === 'error';
  // TuneCore lists CULUA only, so other talents' releases depend on RK Music alone.
  const works = failed('RK Music · Releases') && (talent === 'NEUN' || talent === 'MEDA' || failed('TuneCore · CULUA'));
  if (section === 'news' || section === 'events') return failed('RK Music · News');
  if (section === 'fanart') return failed('X · Selection');
  if (section === 'works') return works;
  return kind === 'event' ? failed('RK Music · News') : kind === 'release' ? works : failed('RK Music · News') && works;
}

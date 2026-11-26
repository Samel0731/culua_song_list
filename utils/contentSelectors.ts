import type { OfficialWork, WorkSelection } from './contentTypes';
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

import type { OfficialWork, WorkSelection } from './contentTypes';
export function selectWorks(works: OfficialWork[], selections: WorkSelection[]): OfficialWork[] {
  const pinned = selections.filter(s => s.pinned).sort((a, b) => a.order - b.order).flatMap(s => works.filter(w => w.sourceUrl === s.sourceUrl || w.streamingUrl === s.sourceUrl));
  return [...new Map([...pinned, ...works].map(w => [w.id, w])).values()];
}

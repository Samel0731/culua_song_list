export type CohortArtist = 'CULUA' | 'NEUN' | 'MEDA';
export interface NewsItem {
  artists: CohortArtist[];
  id: string; title: string; sourceUrl: string; publishedDate: string; category: string;
}
export interface OfficialWork {
  artists: CohortArtist[];
  id: string; title: string; sourceUrl: string; releaseDate: string | null;
  streamingUrl?: string; videos: { title: string; url: string }[];
}
export interface TimelineItem {
  artists: CohortArtist[];
  id: string; title: string; date: string; kind: 'event' | 'release'; sourceUrl: string;
  publishedDate?: string; detail?: string;
}
export interface FanPost { id: string; url: string; order: number; artists: CohortArtist[] }
export interface WorkSelection { sourceUrl: string; pinned: boolean; order: number }
export interface SourceState {
  name: string; url: string; updatedAt: string | null; status: 'ready' | 'stale' | 'error' | 'unconfigured';
}
export interface HubContent {
  news: NewsItem[]; works: OfficialWork[]; timeline: TimelineItem[];
  fanPosts: FanPost[]; selections: WorkSelection[]; sources: SourceState[];
}

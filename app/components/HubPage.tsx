import HubContent from './HubContent';
import { fetchHubContent } from '@/utils/fetchHubContent';
import { SITE_URL, jsonLd } from '@/utils/seo';

export default async function HubPage({ view }: { view: 'home' | 'news' | 'works' | 'timeline' | 'fanart' }) {
  const data = await fetchHubContent();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const items = view === 'works' ? data.works.filter(w => w.artists.includes('CULUA')).map(w => ({ name: w.title, url: w.sourceUrl })) : view === 'news' ? data.news.map(n => ({ name: n.title, url: n.sourceUrl })) : view === 'timeline' ? data.timeline.map(e => ({ name: e.title, url: e.sourceUrl })) : [];
  const path = { home: '/', news: '/news', works: '/discography', timeline: '/timeline', fanart: '/fanart' }[view];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ '@context': 'https://schema.org', '@type': 'CollectionPage', url: SITE_URL + path, name: `CULUA Fan Archive · ${view}`, isPartOf: { '@type': 'WebSite', name: 'CULUA Fan Archive', url: SITE_URL }, ...(items.length ? { mainEntity: { '@type': 'ItemList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, ...item })) } } : {}) }) }}/><HubContent data={data} view={view} today={today}/></>;
}

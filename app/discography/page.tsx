import HubPage from '@/app/components/HubPage';
import { pageMetadata } from '@/utils/seo';
export const metadata = pageMetadata('CULUA 原創曲・音樂作品｜Official MV / オリジナル曲', 'CULUA（カルア）原創作品、發行日期與官方 MV，直接連結官方發行及串流平台。非官方音樂索引。', '/discography');
export const revalidate = 1800;
export default function DiscographyPage() { return <HubPage view="works"/>; }

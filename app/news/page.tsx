import HubPage from '@/app/components/HubPage';
import { pageMetadata } from '@/utils/seo';
export const metadata = pageMetadata('CULUA・NEUN・MEDA 官方新聞索引', '彙整 RK Music 的 CULUA、NEUN（ノイン）、MEDA（メダ）官方公告、演唱會與重要活動，附原文來源。', '/news');
export const revalidate = 1800;
export default function Page() { return <HubPage view="news"/>; }

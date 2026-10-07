import HubPage from '@/app/components/HubPage';
import { pageMetadata } from '@/utils/seo';
export const metadata = pageMetadata('CULUA・NEUN・MEDA 粉絲繪圖精選｜Fan Art', '探索 CULUA、NEUN（ノイン）、MEDA（メダ）的精選粉絲創作，以 X 原帖嵌入保留作者與出處。', '/fanart');
export const revalidate = 1800;
export default function Page() { return <HubPage view="fanart"/>; }

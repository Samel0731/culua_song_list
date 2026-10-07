import HubPage from './components/HubPage';
import { pageMetadata } from '@/utils/seo';
export const metadata = pageMetadata('CULUA（カルア）粉絲站｜歌回搜尋、原創音樂與同期動態', '搜尋 CULUA 歌枠曲目與演唱時間戳，探索原創 MV，以及 CULUA、NEUN、MEDA 官方演唱會、發行消息與精選粉絲創作。非官方粉絲站。', '/');
export const revalidate = 1800;
export default function Page() { return <HubPage view="home"/>; }

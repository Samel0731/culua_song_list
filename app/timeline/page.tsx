import HubPage from '@/app/components/HubPage';
import { pageMetadata } from '@/utils/seo';
export const metadata = pageMetadata('CULUA・NEUN・MEDA 活動時間軸｜演唱會與新歌發行', '查看 CULUA 與同期 NEUN、MEDA 的演唱會、官方活動、唱片與新歌發行。依歌手及日期篩選，附官方來源。', '/timeline');
export const revalidate = 1800;
export default function Page() { return <HubPage view="timeline"/>; }

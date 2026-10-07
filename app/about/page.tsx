import AboutClient from './AboutClient';
import { pageMetadata } from '@/utils/seo';

export const metadata = pageMetadata('關於本站與資料來源', 'CULUA 非官方粉絲站的來源、更新方式與創作者署名。官方公告及音樂資料來自 RK Music 與發行平台，歌回索引由粉絲整理。', '/about');

export default function AboutPage() {
  return <AboutClient />;
}

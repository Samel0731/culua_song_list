import { pageMetadata } from '@/utils/seo';
import LiveHouse from './LiveHouse';
import './live-house.css';

export const metadata = pageMetadata('Live House', '製作跨歌手的虛擬 Live 歌單，設計自己的舞台。Create a virtual live setlist and stage.', '/live-house');
export default function Page() { return <LiveHouse/>; }

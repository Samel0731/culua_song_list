import DiscographyClient from './DiscographyClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Music', description: 'CULUA 原創音樂精選。非官方粉絲音樂站。' };
export default function DiscographyPage() { return <DiscographyClient />; }

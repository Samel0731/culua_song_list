import type { Metadata } from 'next';
import Admin from '../Admin';
export const metadata: Metadata = { title: 'Admin demo', robots: { index: false, follow: false } };
export default function DemoPage() { return <Admin authenticated allowed demo/>; }

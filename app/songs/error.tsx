'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { hubCopy } from '@/utils/hubCopy';
export default function ErrorPage() { const { lang } = useLanguage(); const c = hubCopy[lang]; return <main className="hub-page"><h1>{c.archive}</h1><p className="hub-empty">{c.empty}</p><Link href="/songs">← {c.archive}</Link></main>; }

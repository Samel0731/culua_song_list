'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import type { FanPost } from '@/utils/contentTypes';
import { useLanguage } from '@/context/LanguageContext';
import { hubCopy } from '@/utils/hubCopy';

interface TwitterWidgets { widgets: { createTweet: (id: string, element: HTMLElement, options: { theme: string; dnt: boolean; lang: string }) => Promise<HTMLElement | undefined> } }
export default function FanPostEmbed({ post }: { post: FanPost }) {
  const container = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage(); const copy = hubCopy[lang];
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (scriptReady) return;
    const timer = setTimeout(() => setStatus('error'), 15000);
    return () => clearTimeout(timer);
  }, [scriptReady]);
  useEffect(() => {
    if (!scriptReady || !container.current) return;
    let cancelled = false;
    const node = container.current;
    node.replaceChildren();
    const timer = setTimeout(() => { if (!cancelled) setStatus('error'); }, 15000);
    const twitter = (window as Window & { twttr?: TwitterWidgets }).twttr;
    if (twitter) twitter.widgets.createTweet(post.id, node, { theme: 'dark', dnt: true, lang: lang === 'zh' ? 'zh-tw' : lang }).then(element => {
      if (!cancelled) { clearTimeout(timer); setStatus(element ? 'ready' : 'error'); }
    }).catch(() => { if (!cancelled) { clearTimeout(timer); setStatus('error'); } });
    return () => { cancelled = true; clearTimeout(timer); node.replaceChildren(); };
  }, [post.id, scriptReady, lang]);
  return <article className="fan-post">
    <p className="fan-post-artists">{post.artists.join(' / ')}</p>
    <Script id="x-widgets" src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" onReady={() => setScriptReady(true)} onError={() => setStatus('error')} />
    <div ref={container} className="fan-post-frame" />
    {status !== 'ready' && <p role="status">{status === 'error' ? copy.embedError : copy.embedLoading}</p>}
    <a href={post.url} target="_blank" rel="noopener noreferrer">{copy.openPost} ↗</a>
  </article>;
}

'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
export default function ShareSiteLink({ path, title }: { path: string; title: string }) {
  const { lang } = useLanguage(); const [message, setMessage] = useState('');
  const copy = { zh: { button: '分享網站連結', copied: '已複製連結', failed: '請複製下方連結' }, ja: { button: 'サイトをシェア', copied: 'リンクをコピーしました', failed: '下のリンクをコピーしてください' }, en: { button: 'Share site link', copied: 'Link copied', failed: 'Copy the link below' } }[lang];
  async function share() {
    const url = new URL(path, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: `${title} | CULUA Fan Archive`, url });
      else { await navigator.clipboard.writeText(url); setMessage(copy.copied); }
    } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) setMessage(`${copy.failed}: ${url}`); }
  }
  return <div className="site-share"><button className="stage-button" onClick={share}>{copy.button} ↗</button>{message && <p role="status">{message}</p>}</div>;
}

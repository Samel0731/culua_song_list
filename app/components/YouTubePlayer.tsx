'use client';

import { useMemo } from 'react';

interface Props {
  url: string;
  startTime?: number;
}

function extractYouTubeId(url: string) {
  if (!url) return '';
  const patterns = [
    /v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /embed\/([^?]+)/,
    /shorts\/([^?]+)/,
    /live\/([^?]+)/,
  ];

  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return '';
}

export default function YouTubePlayer({ url, startTime = 0 }: Props) {
  const embedSrc = useMemo(() => {
    const id = extractYouTubeId(url);
    if (!id) return '';

    const params = new URLSearchParams({
      autoplay: '1',
      mute: '0',
      playsinline: '1',
      rel: '0',
    });

    if (startTime > 0) {
      params.set('start', String(startTime));
    }

    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }, [url, startTime]);

  if (!embedSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        無法載入 YouTube 影片
      </div>
    );
  }

  return (
    <iframe
      src={embedSrc}
      className="w-full h-full"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

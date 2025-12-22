'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  url: string;
  startTime?: number;
  endTime?: number;
  onEnd?: () => void;
  isPlaying?: boolean;
  // ✨ 新增：讓父組件可以拿到 player 實體
  onPlayerReady?: (player: any) => void;
}

function extractVideoId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : '';
}

export default function YouTubePlayer({ 
  url, 
  startTime = 0, 
  endTime, 
  onEnd,
  isPlaying = true,
  onPlayerReady // ✨ 解構出來
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 使用 Ref 來追蹤最新的 onEnd 函式 (避免 Closure 問題)
  const onEndRef = useRef(onEnd);
  // ✨ 使用 Ref 追蹤 onPlayerReady，避免依賴項變動導致重新初始化
  const onPlayerReadyRef = useRef(onPlayerReady);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    onPlayerReadyRef.current = onPlayerReady;
  }, [onPlayerReady]);

  // 1. 載入 API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 2. 初始化播放器
  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return;
      if (playerRef.current) {
         playerRef.current.destroy();
      }

      const videoId = extractVideoId(url);
      if (!videoId) return;

      // 檢查 YT 是否可用
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            'autoplay': isPlaying ? 1 : 0,
            'controls': 1,
            'start': startTime,
            'playsinline': 1,
            'rel': 0,
            'fs': 1, 
          },
          events: {
            'onReady': (event: any) => {
              // ✨ 關鍵修改：將 player 實體傳給父組件
              if (onPlayerReadyRef.current) {
                onPlayerReadyRef.current(event.target);
              }

              if (isPlaying) {
                event.target.playVideo();
              }
            },
            'onStateChange': (event: any) => {
              // 0 = ENDED
              if (event.data === window.YT.PlayerState.ENDED) {
                if (onEndRef.current) {
                  onEndRef.current();
                }
              }
            },
            'onError': (event: any) => {
              console.warn('YouTube Player Error Code:', event.data);
              // 遇到錯誤時 (如影片被刪除)，自動跳下一首
              if (onEndRef.current) {
                console.log('Video unavailable, skipping to next song...');
                onEndRef.current();
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(interval);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [url]); // url 改變時重新初始化

  // 3. 播放控制 (暫停/播放)
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  return <div ref={containerRef} className="w-full h-full rounded-xl overflow-hidden" />;
}
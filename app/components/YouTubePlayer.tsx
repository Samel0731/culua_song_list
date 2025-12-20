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
  isPlaying = true 
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 使用 Ref 來追蹤最新的 onEnd 函式 (避免 Closure 問題)
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // 1. 載入 API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 2. 初始化播放器
  useEffect(() => {
    const videoId = extractVideoId(url);
    if (!videoId) return;

    const initPlayer = () => {
      // 如果播放器已存在，直接載入新影片 (換歌)
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: Math.floor(startTime),
          endSeconds: endTime ? Math.floor(endTime) : undefined
        });
        return;
      }

      // 建立新播放器
      if (window.YT && window.YT.Player && containerRef.current) {
        const playerDiv = document.createElement('div');
        containerRef.current.innerHTML = ''; 
        containerRef.current.appendChild(playerDiv);

        playerRef.current = new window.YT.Player(playerDiv, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          host: 'https://www.youtube.com', // 幫助減少 CORS 錯誤
          playerVars: {
            autoplay: 1,
            start: Math.floor(startTime),
            end: endTime ? Math.floor(endTime) : undefined,
            modestbranding: 1,
            rel: 0,
            controls: 1,
            playsinline: 1,
            origin: window.location.origin, // 幫助減少 CORS 錯誤
          },
          events: {
            'onReady': (event: any) => {
              event.target.setVolume(50);
              if (!isPlaying) {
                event.target.pauseVideo();
              }
            },
            'onStateChange': (event: any) => {
              // 狀態 0 = 播放結束 (Ended)
              if (event.data === 0) {
                if (onEndRef.current) {
                    onEndRef.current();
                }
              }
            },
            // ✨ 第四步重點：錯誤處理
            'onError': (event: any) => {
              console.warn('YouTube Player Error Code:', event.data);
              // 錯誤代碼說明：
              // 100: 影片找不到 (被刪除或設為私人)
              // 101, 150: 影片擁有者禁止在嵌入播放器中播放
              
              // 遇到錯誤時，自動跳下一首，保持聆聽體驗不中斷
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
  }, [url]); 

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

  // 4. 清理
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
            playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-xl overflow-hidden bg-black relative"
    />
  );
}
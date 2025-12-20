'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  
  // ✨ 關鍵修正：使用 Ref 來追蹤最新的 onEnd 函式
  // 這樣即使 YT.Player 沒有重新建立，也能呼叫到最新的 playNext 邏輯
  const onEndRef = useRef(onEnd);

  // 當外部傳入的 onEnd 改變時 (例如切換了播放模式)，更新 Ref
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
      // 換歌邏輯
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: Math.floor(startTime),
          endSeconds: endTime ? Math.floor(endTime) : undefined
        });
        return;
      }

      // 建立播放器
      if (window.YT && window.YT.Player && containerRef.current) {
        const playerDiv = document.createElement('div');
        containerRef.current.innerHTML = ''; 
        containerRef.current.appendChild(playerDiv);

        playerRef.current = new window.YT.Player(playerDiv, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            start: Math.floor(startTime),
            end: endTime ? Math.floor(endTime) : undefined,
            modestbranding: 1,
            rel: 0,
            controls: 1,
            playsinline: 1,
          },
          events: {
            'onReady': (event: any) => {
              event.target.setVolume(50);
              if (!isPlaying) {
                event.target.pauseVideo();
              }
            },
            'onStateChange': (event: any) => {
              // 狀態 0 = 播放結束
              if (event.data === 0) {
                // ✨ 這裡改用 Ref 來呼叫，確保是「當下」最新的邏輯
                if (onEndRef.current) {
                    onEndRef.current();
                }
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

  // 3. 播放控制
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
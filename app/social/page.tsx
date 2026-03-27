// app/social/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Script from 'next/script';
import { Share2, Twitter, Music, Instagram, Youtube, ExternalLink } from 'lucide-react';

type SocialTab = 'tiktok' | 'twitter' | 'instagram' | 'youtube';

interface SocialConfig {
  youtube_main?: string;
  youtube_rec_1?: string;
  youtube_rec_2?: string;
  tiktok_ids?: string[];
  [key: string]: any;
}

export default function SocialPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SocialTab>('tiktok');
  const [isMounted, setIsMounted] = useState(false);
  const [config, setConfig] = useState<SocialConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 抓取動態配置
  useEffect(() => {
    setIsMounted(true);
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/social-config');
        const data = await res.json();
        setConfig(data);
      } catch (error) {
        console.error('Failed to load social config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // 2. X (Twitter) 強制重繪邏輯
  useEffect(() => {
    if (activeTab === 'twitter' && isMounted) {
      const timer = setTimeout(() => {
        // @ts-ignore
        window.twttr?.widgets?.load();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isMounted]);

  // 預設值設定
  const youtubeMain = config?.youtube_main || 'KKIKy5dS8i0';
  const youtubeRecs = [config?.youtube_rec_1 || 'k8l_5e1MNqE', config?.youtube_rec_2 || 'Hx1KAdapT1M'];
  const tiktokIds = config?.tiktok_ids || ['7610368115502779668', '7620016992103288085'];
  console.log('Loaded Social Config:', tiktokIds, youtubeMain, youtubeRecs);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Share2 size={48} className="opacity-20" />
          <p className="text-sm font-medium tracking-widest uppercase">Loading SNS Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-slate-900 text-slate-100 pb-20">
      <div className="p-4 lg:p-8 pt-8 lg:pt-10 w-full max-w-[1200px] mx-auto">
        <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-3 mb-8">
          <Share2 className="text-blue-400" size={36} /> SNS
        </h1>

        {/* 分頁標籤切換 */}
        <div className="flex flex-wrap p-1 bg-slate-800/50 border border-slate-700 rounded-2xl mb-8 gap-1">
          {[
            { id: 'tiktok', icon: <Music size={18} />, label: 'TikTok', active: 'bg-[#ff0050]' },
            { id: 'youtube', icon: <Youtube size={18} />, label: 'YouTube', active: 'bg-red-600' },
            { id: 'twitter', icon: <Twitter size={18} />, label: 'X', active: 'bg-[#1DA1F2]' },
            { id: 'instagram', icon: <Instagram size={18} />, label: 'Instagram', active: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SocialTab)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id ? `${tab.active} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[600px] relative">
          {/* TikTok 分頁 */}
          {activeTab === 'tiktok' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiktokIds.map((id) => (
                  <div key={id} className="bg-slate-800/50 rounded-3xl p-4 border border-slate-700 shadow-xl overflow-hidden min-h-[620px] flex flex-col items-center">
                    
                    {/* 1. 官方嵌入區塊 */}
                    <div className="flex-1 w-full flex justify-center">
                      <blockquote 
                        className="tiktok-embed" 
                        cite={`https://www.tiktok.com/@culuavsinger/video/${id}`} 
                        data-video-id={id}
                        // data-embed-from="embed_page"
                        style={{ maxWidth: '605px', minWidth: '325px' }}
                      >
                        <section>
                          <a target="_blank" title="@culuavsinger" href={`https://www.tiktok.com/@culuavsinger?refer=embed`}>
                            @culuavsinger
                          </a>
                        </section>
                      </blockquote>
                    </div>

                    {/* 2. 備案按鈕：當嵌入失效時提供直接連結 */}
                    <div className="mt-4 w-full pt-4 border-t border-slate-700/50">
                      <a 
                        href={`https://www.tiktok.com/@culuavsinger/video/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900/50 hover:bg-[#ff0050]/10 text-[#ff0050] border border-[#ff0050]/30 rounded-xl text-sm font-bold transition-all group"
                      >
                        <Music size={16} />
                        <span>在 TikTok 上觀看影片</span>
                        <ExternalLink size={14} className="group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <Script src="https://www.tiktok.com/embed.js" strategy="afterInteractive" />
            </div>
          )}

          {/* YouTube 分頁 */}
          {activeTab === 'youtube' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="aspect-video w-full rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeMain}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {youtubeRecs.map((vid) => (
                   <a key={vid} href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer" className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-800">
                      <img src={`https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="thumbnail" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                         <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg"><Youtube size={24} fill="white" /></div>
                      </div>
                   </a>
                ))}
              </div>
            </div>
          )}

          {/* Twitter 分頁 */}
          {activeTab === 'twitter' && (
            <div className="animate-in fade-in duration-500 max-w-[600px] mx-auto">
              <a 
                className="twitter-timeline" 
                data-height="800" 
                data-theme="dark" 
                data-chrome="noheader nofooter transparent"
                href="https://twitter.com/culua0211?ref_src=twsrc%5Etfw"
              >
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 italic">
                  Loading Tweets...
                </div>
              </a>
              <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
            </div>
          )}

          {/* Instagram 分頁 */}
          {activeTab === 'instagram' && (
            <div className="flex flex-col items-center justify-center h-[500px] gap-8 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-[30px] flex items-center justify-center shadow-2xl rotate-3">
                <Instagram size={48} className="text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">@culua0211</h2>
                <p className="text-slate-400">Follow CULUA for more photos and updates!</p>
              </div>
              <a href="https://www.instagram.com/culua0211" target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-white text-slate-900 rounded-full font-black hover:scale-105 transition-transform flex items-center gap-2">
                Open Instagram <ExternalLink size={18} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { X, Download, Share2, Music2 } from 'lucide-react';
import { GroupedSong, SongVersion } from '@/utils/dataProcessor';
import { useLanguage } from '@/context/LanguageContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: GroupedSong;
  version: SongVersion;
}

export default function ShareModal({ isOpen, onClose, song, version }: ShareModalProps) {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // ✨ 修正重點：QR Code 的連結邏輯
  // 改為使用「原片連結 (streamUrl)」而非網站首頁
  let shareUrl = version.streamUrl;
  
  // 附加功能：如果有時間戳記 (timestampSeconds)，自動加到網址後方 (?t=120)
  // 這樣掃描 QR Code 就會精準跳到唱歌的時間點
  if (version.timestampSeconds && version.timestampSeconds > 0) {
    const separator = shareUrl.includes('?') ? '&' : '?';
    shareUrl = `${shareUrl}${separator}t=${version.timestampSeconds}`;
  }

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0f172a'
      });

      const link = document.createElement('a');
      link.download = `CULUA-Share-${song.songName}.png`;
      link.href = dataUrl;
      link.click();
      
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 size={18} className="text-blue-400" />
            {t.share_modal_title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center bg-slate-950/50">
          <div className="relative overflow-hidden rounded-xl shadow-lg transform scale-[0.85] sm:scale-100 origin-center">
             <div 
               ref={cardRef}
               className="w-[320px] bg-gradient-to-br from-indigo-900 to-slate-900 border border-slate-700/50 p-6 text-center text-white relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />

                <div className="relative z-10 mx-auto w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-400 to-purple-500 mb-4 shadow-lg">
                   {/* 建議：如果有歌曲專屬封面圖，這裡可以改成顯示歌曲封面，目前維持顯示 CULUA 頭像 */}
                   <img 
                     src="/icon-512x512.png" 
                     alt="CULUA" 
                     className="w-full h-full rounded-full bg-slate-900 object-cover"
                   />
                </div>

                <div className="relative z-10 mb-6">
                  <h2 className="text-xl font-bold leading-tight mb-1 text-blue-100 drop-shadow-md line-clamp-2">
                    {song.songName}
                  </h2>
                  <p className="text-sm text-blue-300/80 font-medium flex items-center justify-center gap-1">
                    <Music2 size={12} /> {song.artist}
                  </p>
                </div>

                <div className="relative z-10 my-4 border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-300 italic font-serif opacity-80">
                    "{t.share_card_desc}"
                  </p>
                </div>

                <div className="relative z-10 bg-white p-2 rounded-lg inline-block shadow-lg mb-2">
                  <QRCodeSVG 
                    value={shareUrl} // ✨ 這裡就會是 YouTube 連結了
                    size={90} //稍微加大一點點方便掃描
                    bgColor="#ffffff" 
                    fgColor="#000000" 
                    level="Q" // 提高容錯率，讓 QR Code 稍微密集一點但更穩
                    imageSettings={{
                        src: "/icon-192x192.png",
                        x: undefined,
                        y: undefined,
                        height: 20,
                        width: 20,
                        excavate: true,
                    }}
                  />
                </div>
                <p className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                  Scan to Listen
                </p>
             </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 {t.share_downloading}
              </>
            ) : (
              <>
                <Download size={18} />
                {t.share_download}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
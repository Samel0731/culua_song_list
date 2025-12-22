'use client';

import { Play, Sparkles, Flame, Star, ChevronUp, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { GroupedSong } from '@/utils/dataProcessor';

// 1. 定義 HeroCard (小元件)
interface HeroCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  playText: string;
  onClick: () => void;
}

function HeroCard({ title, desc, icon, color, playText, onClick }: HeroCardProps) {
  return (
    <button 
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-slate-800 p-4 text-left transition-all hover:bg-slate-750 hover:scale-[1.02] hover:shadow-lg border border-slate-700/50 flex flex-col h-full min-h-[120px]"
    >
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <div className="relative z-10 flex-1">
        <h3 className={`font-bold text-lg mb-1 ${color}`}>{title}</h3>
        <p className="text-slate-400 text-xs lg:text-sm mb-3 line-clamp-2">{desc}</p>
      </div>
      <div className="relative z-10 mt-auto flex items-center gap-2 text-xs font-bold text-slate-500 group-hover:text-white transition-colors">
        <div className={`p-1.5 rounded-full bg-slate-700/50 group-hover:bg-${color.split('-')[1]}-500 transition-colors`}>
          <Play size={12} className="fill-current" />
        </div>
        {playText}
      </div>
    </button>
  );
}

// 2. 定義 HeroSection 的 Props
interface HeroSectionProps {
  onPlayRandom: () => void;  // ✨ 確保這裡有定義
  onPlaySong: (song: GroupedSong) => void;
  onPlayRecommended: (type: 'classic' | 'gap' | 'latest') => void;
}

export default function HeroSection({ 
  onPlayRandom,  // ✨ 確保這裡有解構出來
  onPlaySong,
  onPlayRecommended
}: HeroSectionProps) {
  const { t } = useLanguage();

  // 3. 定義按鈕點擊後的行為
  const onSurprise = () => {
    if (onPlayRandom) {
      onPlayRandom(); // ✨ 這裡呼叫父層傳進來的 playRandom
    }
  };

  return (
    <div className="relative h-full flex flex-col p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        {/* 歡迎標題區 */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight" 
               dangerouslySetInnerHTML={{ __html: t.hero_welcome_title }} 
           />
           <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-lg">
             {t.hero_welcome_desc}
           </p>
        </div>

        {/* 卡片網格區 */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6">
          <div className="col-span-2">
            <HeroCard 
              title={t.hero_card_latest_title}
              desc={t.hero_card_latest_desc}
              icon={<Sparkles size={64} />}
              color="text-emerald-400"
              playText={t.hero_play_now}
              onClick={() => onPlayRecommended('latest')}
            />
          </div>

          <HeroCard 
            title={t.hero_card_classic_title}
            desc={t.hero_card_classic_desc}
            icon={<Star size={64} />}
            color="text-yellow-400"
            playText={t.hero_play_now}
            onClick={() => onPlayRecommended('classic')}
          />

          <HeroCard 
            title={t.hero_card_gap_title}
            desc={t.hero_card_gap_desc}
            icon={<Flame size={64} />}
            color="text-red-400"
            playText={t.hero_play_now}
            onClick={() => onPlayRecommended('gap')}
          />
        </div>

        {/* 隨機播放區塊 */}
        <div className="mt-auto bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-6 text-center shrink-0">
          <h3 className="text-xl font-bold text-white mb-2">{t.hero_surprise_title}</h3>
          <p className="text-slate-400 text-sm mb-4">{t.hero_surprise_desc}</p>
          <button 
            onClick={onSurprise} // ✨ 綁定 onClick
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/50"
          >
            <Sparkles size={18} />
            {t.hero_surprise_btn}
          </button>
        </div>
    </div>
  );
}
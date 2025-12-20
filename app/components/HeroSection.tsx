'use client';

import { Play, Sparkles, Flame, Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext'; // 1. 引入 Hook

interface HeroCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  playText: string; // 新增播放按鈕文字的 prop
  onClick: () => void;
}

function HeroCard({ title, desc, icon, color, playText, onClick }: HeroCardProps) {
  return (
    <button 
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-slate-800 p-4 text-left transition-all hover:bg-slate-750 hover:scale-[1.02] hover:shadow-lg border border-slate-700/50 h-full flex flex-col"
    >
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        {icon}
      </div>
      <div className="relative z-10 flex-1">
        <h3 className={`font-bold text-lg mb-1 ${color}`}>{title}</h3>
        <p className="text-slate-400 text-xs lg:text-sm mb-3">{desc}</p>
      </div>
      <div className="relative z-10 mt-auto">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 group-hover:text-white">
            <div className="bg-slate-700 p-1.5 rounded-full group-hover:bg-blue-600 transition-colors">
                <Play size={12} className="fill-current" />
            </div>
            <span>{playText}</span>
        </div>
      </div>
    </button>
  );
}

interface HeroSectionProps {
  onPlayRecommended: (type: 'classic' | 'gap' | 'latest') => void;
  onSurprise: () => void;
}

export default function HeroSection({ onPlayRecommended, onSurprise }: HeroSectionProps) {
  const { t } = useLanguage(); // 2. 使用 Hook

  return (
    <div className="h-full w-full flex flex-col p-6 lg:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      
      {/* 標題區 */}
      <div className="mb-8 text-center lg:text-left">
        {/* 使用 dangerouslySetInnerHTML 來支援翻譯中的 HTML 顏色標籤 */}
        <h1 
            className="text-3xl lg:text-4xl font-bold text-white mb-2"
            dangerouslySetInnerHTML={{ __html: t.hero_welcome_title }}
        />
        <p className="text-slate-400 max-w-lg">
          {t.hero_welcome_desc}
        </p>
      </div>

      {/* 入坑三部曲 (順序: Latest -> Classic -> Gap) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* 1. 最新主打 */}
        <HeroCard 
          title={t.hero_card_latest_title}
          desc={t.hero_card_latest_desc}
          icon={<Sparkles size={64} />}
          color="text-blue-400"
          playText={t.hero_play_now}
          onClick={() => onPlayRecommended('latest')}
        />

        {/* 2. 入坑必聽 */}
        <HeroCard 
          title={t.hero_card_classic_title}
          desc={t.hero_card_classic_desc}
          icon={<Star size={64} />}
          color="text-yellow-400"
          playText={t.hero_play_now}
          onClick={() => onPlayRecommended('classic')}
        />

        {/* 3. 反差萌 */}
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
      <div className="mt-auto bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">{t.hero_surprise_title}</h3>
        <p className="text-slate-400 text-sm mb-4">{t.hero_surprise_desc}</p>
        <button 
          onClick={onSurprise}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          <Sparkles size={18} />
          {t.hero_surprise_btn}
        </button>
      </div>
    </div>
  );
}
'use client';

// 1. 修正：確保引入了 'X' 圖示
import { Play, Sparkles, Flame, Star, ChevronUp, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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
  onClose?: () => void;
}

export default function HeroSection({ onPlayRecommended, onSurprise, onClose }: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="relative w-full bg-slate-900 h-full flex flex-col">
      
      {/* 手機版關閉按鈕 (雙重保險，雖然 Layout 也有做) */}
      {onClose && (
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 z-30 p-2 bg-slate-800/80 rounded-full text-slate-300 hover:text-white border border-slate-700 shadow-md"
        >
          <X size={20} />
        </button>
      )}

      {/* 內容捲動區 */}
      <div className="flex-1 w-full flex flex-col p-6 lg:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* 標題區 */}
        <div className="mb-6 lg:mb-8 pr-10 lg:pr-0 shrink-0">
          <h1 
              className="text-2xl lg:text-4xl font-bold text-white mb-2"
              dangerouslySetInnerHTML={{ __html: t.hero_welcome_title }}
          />
          <p className="text-slate-400 text-sm lg:text-base max-w-lg">
            {t.hero_welcome_desc}
          </p>
        </div>

        {/* 入坑三部曲 (卡片區) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
          <HeroCard 
            title={t.hero_card_latest_title}
            desc={t.hero_card_latest_desc}
            icon={<Sparkles size={64} />}
            color="text-blue-400"
            playText={t.hero_play_now}
            onClick={() => onPlayRecommended('latest')}
          />

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
            onClick={onSurprise}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <Sparkles size={18} />
            {t.hero_surprise_btn}
          </button>
        </div>
        
        {/* 底部留白，確保手機版滑到底不會太貼邊 */}
        <div className="h-8 lg:hidden shrink-0" />
      </div>
    </div>
  );
}
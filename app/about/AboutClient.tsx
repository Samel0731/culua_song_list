'use client';

// ✨ 修改 1: 引入 Github icon
import { Info, Youtube, ExternalLink, ShieldCheck, Database, Github } from 'lucide-react';
import { stageCopy } from '@/utils/stageCopy';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
  const { t, lang } = useLanguage();

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 overflow-y-auto p-4 lg:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-8 pb-24">
        
        {/* Header */}
        <div className="border-b border-slate-700 pb-4">
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3 text-white mb-2">
            <Info className="text-blue-400" /> {t.about_title}
          </h1>
          <p className="text-slate-400">{t.about_subtitle}</p>
        </div>

        {/* 1. 網站目的 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database size={20} className="text-purple-400" />
            {t.about_intro_title}
          </h2>
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 leading-relaxed text-slate-300">
            <p className="mb-3" dangerouslySetInnerHTML={{ __html: t.about_intro_content_1 }} />
            <p>{t.about_intro_content_2}</p>
          </div>
        </section>

        {/* 2. 資料來源 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Youtube size={20} className="text-red-400" />
            {t.about_source_title}
          </h2>
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 leading-relaxed text-slate-300">
            <ul className="list-disc list-inside space-y-2">
              <li dangerouslySetInnerHTML={{ __html: t.about_source_1 }} />
              <li>{t.about_source_2}</li>
              <li>{t.about_source_3}</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <a 
                href="https://www.youtube.com/@CULUAvsinger" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                {t.about_source_link} <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">{stageCopy[lang].source}</h2>
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-3 text-sm text-slate-300">
            <p>{lang === 'zh' ? '主視覺使用本站設計的品牌文字與霧光背景，未重用官方角色立繪。作品圖片為 YouTube 影片縮圖，影音以官方嵌入播放器呈現。' : lang === 'ja' ? 'メインビジュアルは当サイト独自の文字と光のデザインです。公式立ち絵は転載していません。楽曲の画像はYouTube動画のサムネイル、再生は公式埋め込みプレーヤーを使用しています。' : 'The hero uses original typography and lighting, without reproducing official character artwork. Music images are YouTube thumbnails; playback uses the official embedded player.'}</p>
            <div className="flex flex-wrap gap-5"><a href="https://rkmusic.jp/artist/284/" target="_blank" rel="noopener noreferrer" className="text-purple-300">RK Music / CULUA ↗</a><a href="https://rkmusic.jp/release/610/" target="_blank" rel="noopener noreferrer" className="text-purple-300">KALMIA / MV ↗</a><a href="https://rkmusic.jp/guideline/" target="_blank" rel="noopener noreferrer" className="text-purple-300">{lang === 'zh' ? '二次創作規範' : lang === 'ja' ? '二次創作ガイドライン' : 'Fan creation guidelines'} ↗</a></div>
          </div>
        </section>

        {/* 3. 免責聲明 & GitHub 連結 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-green-400" />
            {t.about_disclaimer_title}
          </h2>
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 leading-relaxed text-slate-300 text-sm">
            <p>{t.about_disclaimer_content}</p>
            
            {/* ✨ 修改 2: 加入 GitHub Repository 連結 */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
              <a 
                href="https://github.com/Samel0731/culua_song_list" // ⚠️ 請記得替換這裡的連結
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-wider"
                title="View Source Code on GitHub"
              >
                <Github size={16} /> Source Code
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
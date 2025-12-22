// utils/translations.ts
export type Language = 'zh' | 'ja' | 'en';

export interface Translation {
  // 通用導航與列表
  title: string;
  search_placeholder: string;
  loading: string;
  no_results: string;
  nav_home: string;
  nav_songs: string;
  nav_artists: string;
  nav_recommend: string;
  on_air: string;
  new_tag: string;
  sort_name: string;
  sort_count: string;
  select_artist_prompt: string;
  total_songs: string;

  // 首頁區塊 (Home Sections)
  section_most_performed: string;
  section_discover: string;
  card_versions: string;
  
  // 首頁底部 CTA
  cta_title: string;
  cta_desc_prefix: string;
  cta_desc_suffix: string;
  cta_btn: string;

  // Hero Section (首頁推薦區)
  hero_welcome_title: string;
  hero_welcome_desc: string;
  hero_card_latest_title: string;
  hero_card_latest_desc: string;
  hero_card_classic_title: string;
  hero_card_classic_desc: string;
  hero_card_gap_title: string;
  hero_card_gap_desc: string;
  hero_play_now: string;
  hero_surprise_title: string;
  hero_surprise_desc: string;
  hero_surprise_btn: string;

  // Right Panel (播放器)
  mode_version_loop: string;
  mode_shuffle: string;
  mode_list_loop: string;
  original_link: string;
  versions: string;
  select_song_prompt: string;
  tag_latest: string;
  stream_archive: string;
  
  // ✨ 新增：專注模式 (Focus Mode)
  focus_mode_btn: string;
  focus_mode_desc: string;
  focus_exit: string;
  focus_next: string;
  focus_time_format: string;
  focus_hint_ui: string;

  // 權威描述 (SEO)
  home_authority_desc: string;
  songs_authority_desc_prefix: string;
  songs_authority_desc_suffix: string;
  
  // 關於頁面 (About)
  about_title: string;
  about_subtitle: string;
  about_intro_title: string;
  about_intro_content_1: string;
  about_intro_content_2: string;
  about_source_title: string;
  about_source_1: string;
  about_source_2: string;
  about_source_3: string;
  about_source_link: string;
  about_disclaimer_title: string;
  about_disclaimer_content: string;

  // Footer
  footer: string;
}

export const translations: Record<Language, Translation> = {
  zh: {
    // 通用
    title: "Culua 歌單",
    search_placeholder: "搜尋歌名、歌手...",
    loading: "載入中...",
    no_results: "沒有找到相關歌曲",
    nav_home: "首頁",
    nav_songs: "所有歌曲",
    nav_artists: "歌手列表",
    nav_recommend: "推薦",
    on_air: "直播中",
    new_tag: "最新",
    sort_name: "依歌名",
    sort_count: "依次數",
    select_artist_prompt: "請選擇一位歌手查看詳細資訊",
    total_songs: "共 {count} 首歌",

    // 首頁區塊
    section_most_performed: "熱門金曲",
    section_discover: "隨機探索",
    card_versions: "個版本",
    
    // 首頁 CTA
    cta_title: "想要找特定的歌？",
    cta_desc_prefix: "搜尋完整的",
    cta_desc_suffix: "首歌庫。",
    cta_btn: "瀏覽完整歌單",

    // Hero Section
    hero_welcome_title: "歡迎來到 <span class='text-blue-400'>CULUA</span><br/>非官方歌回資料庫",
    hero_welcome_desc: "這裡整理了 VSinger CULUA 歷年的歌回錄影與翻唱作品。請從左側選單開始探索，或試試下方的推薦歌單。",
    hero_card_latest_title: "最新原創",
    hero_card_latest_desc: "收聽 CULUA 最新發布的原創曲目。",
    hero_card_classic_title: "必聽經典",
    hero_card_classic_desc: "剛認識 CULUA？先從這首開始。",
    hero_card_gap_title: "反差風格",
    hero_card_gap_desc: "感受帥氣與可愛的強烈反差。",
    hero_play_now: "立即播放",
    hero_surprise_title: "不知道聽什麼？",
    hero_surprise_desc: "讓系統為你隨機挑選一首好歌。",
    hero_surprise_btn: "隨機播放",

    // Right Panel
    mode_version_loop: "換直播",
    mode_shuffle: "隨機",
    mode_list_loop: "換歌",
    original_link: "原片連結",
    versions: "版本紀錄",
    select_song_prompt: "請選擇一首歌開始播放",
    tag_latest: "最新",
    stream_archive: "直播存檔",
    
    // ✨ 專注模式
    focus_mode_btn: "開啟專注模式",
    focus_mode_desc: "純享音樂 BGM • 自動過濾雜談 • 無限循環",
    focus_exit: "退出專注",
    focus_next: "切歌",
    focus_time_format: "zh-TW",
    focus_hint_ui: "移動游標顯示控制項",

    // SEO 描述
    home_authority_desc: "本網站整理 <strong>VTuber／VSinger CULUA</strong> 在 YouTube 上公開演唱過的所有歌曲，包含原創音樂與翻唱作品。資料來源為官方 YouTube 頻道，並以每小時自動更新方式維持完整性。",
    songs_authority_desc_prefix: "以下為 CULUA 目前在 YouTube 上公開可查的完整演唱歌曲列表，此列表由伺服器端自動同步官方資料，並持續更新。目前已收錄",
    songs_authority_desc_suffix: "首歌曲。",
    
    // About
    about_title: "關於本站",
    about_subtitle: "關於 CULUA 歌回資料庫",
    about_intro_title: "網站簡介",
    about_intro_content_1: "本網站是專為 <strong>VSinger CULUA</strong> 建立的非官方歌回資料庫。",
    about_intro_content_2: "我們的目標是整理 CULUA 歷年來在 YouTube 直播中演唱過的每一首歌、每一次翻唱 (Cover) 以及原創曲目。透過自動化的資料同步技術，提供粉絲最完整、最快速的搜尋與播放體驗。",
    about_source_title: "資料來源",
    about_source_1: "所有歌曲資料皆來自 <strong>CULUA Official Channel</strong> 及相關官方社群。",
    about_source_2: "系統會定期（每小時）掃描官方公開的歌單資料表，確保資料的即時性與正確性。",
    about_source_3: "影片播放使用 YouTube 官方嵌入播放器，觀看次數將計入官方影片數據。",
    about_source_link: "前往 CULUA 官方 YouTube 頻道",
    about_disclaimer_title: "免責聲明",
    about_disclaimer_content: "本網站為粉絲自行開發的非官方專案 (Fan-made Project)，與 CULUA 本人及其所屬營運單位無直接關聯。所有影音內容之版權歸原創作者及官方所有。如需聯絡開發者或回報問題，請透過 GitHub 或社群平台聯繫。",

    // Footer
    footer: "© 2025 CULUA DB | 非官方粉絲站"
  },
  ja: {
    // 通用
    title: "Culua ソングリスト",
    search_placeholder: "曲名、歌手で検索...",
    loading: "読み込み中...",
    no_results: "該当する曲が見つかりません",
    nav_home: "ホーム",
    nav_songs: "全曲リスト",
    nav_artists: "歌手リスト",
    nav_recommend: "おすすめ",
    on_air: "配信中",
    new_tag: "最新",
    sort_name: "曲名順",
    sort_count: "回数順",
    select_artist_prompt: "歌手を選択して詳細を表示",
    total_songs: "全 {count} 曲",

    // 首頁區塊
    section_most_performed: "人気の曲",
    section_discover: "ディスカバリー",
    card_versions: "バージョン",

    // 首頁 CTA
    cta_title: "特定の曲をお探しですか？",
    cta_desc_prefix: "全",
    cta_desc_suffix: "曲のアーカイブから検索。",
    cta_btn: "全曲リストを見る",

    // Hero Section
    hero_welcome_title: "<span class='text-blue-400'>CULUA</span><br/>非公式歌枠データベースへようこそ",
    hero_welcome_desc: "VSinger CULUAの歴代の歌枠アーカイブとカバー曲をまとめました。左のメニューから探索するか、下のプレイリストをお試しください。",
    hero_card_latest_title: "最新オリジナル",
    hero_card_latest_desc: "CULUAの最新オリジナル曲を聴く。",
    hero_card_classic_title: "定番の名曲",
    hero_card_classic_desc: "CULUAを知るならまずはこの曲から。",
    hero_card_gap_title: "ギャップの魅力", 
    hero_card_gap_desc: "かっこよさと可愛さのギャップを感じる。",
    hero_play_now: "今すぐ再生",
    hero_surprise_title: "何を聴くか迷っていますか？",
    hero_surprise_desc: "システムがランダムに1曲選びます。",
    hero_surprise_btn: "おまかせ再生",

    // Right Panel
    mode_version_loop: "Ver.切替",
    mode_shuffle: "シャッフル",
    mode_list_loop: "曲切替",
    original_link: "元の動画",
    versions: "バージョン履歴",
    select_song_prompt: "曲を選択して再生を開始",
    tag_latest: "最新",
    stream_archive: "配信アーカイブ",
    
    // ✨ 專注模式
    focus_mode_btn: "作業用BGMモード",
    focus_mode_desc: "音楽のみ • 雑談なし • 無限ループ",
    focus_exit: "終了",
    focus_next: "次へ",
    focus_time_format: "ja-JP",
    focus_hint_ui: "カーソルを動かしてコントロールを表示",

    // SEO
    home_authority_desc: "本サイトは <strong>VTuber／VSinger CULUA</strong> がYouTubeで公開したすべての歌唱曲（オリジナル曲およびカバー曲を含む）をまとめたものです。データは公式YouTubeチャンネルに基づき、1時間ごとの自動更新によって完全性を維持しています。",
    songs_authority_desc_prefix: "以下は、現在YouTubeで公開されているCULUAの全歌唱曲リストです。このリストはサーバーサイドで公式データを自動同期し、継続的に更新されています。現在",
    songs_authority_desc_suffix: "曲を収録しています。",
    
    // About
    about_title: "このサイトについて",
    about_subtitle: "CULUA 歌枠データベースについて",
    about_intro_title: "サイト紹介",
    about_intro_content_1: "本サイトは <strong>VSinger CULUA</strong> のために作られた非公式歌枠データベースです。",
    about_intro_content_2: "CULUAがこれまでのYouTube配信で歌った全楽曲、カバー、およびオリジナル曲を整理することを目的としています。自動データ同期技術により、ファンに最も完全で高速な検索・再生体験を提供します。",
    about_source_title: "情報源",
    about_source_1: "すべての楽曲データは <strong>CULUA Official Channel</strong> および関連する公式コミュニティから取得しています。",
    about_source_2: "システムは定期的に（1時間ごと）公式の公開セットリストをスキャンし、データの即時性と正確性を確保しています。",
    about_source_3: "動画再生にはYouTube公式の埋め込みプレーヤーを使用しており、再生回数は公式動画のデータにカウントされます。",
    about_source_link: "CULUA公式YouTubeチャンネルへ",
    about_disclaimer_title: "免責事項",
    about_disclaimer_content: "本サイトはファンによる非公式プロジェクト（Fan-made Project）であり、CULUA本人および所属運営元とは直接の関係はありません。すべての音声・映像コンテンツの著作権は原作者および公式に帰属します。開発者への連絡や問題の報告は、GitHubまたはSNSを通じてお願いします。",

    // Footer
    footer: "© 2025 CULUA DB | 非公式ファンサイト"
  },
  en: {
    // 通用
    title: "Culua Song List",
    search_placeholder: "Search songs, artists...",
    loading: "Loading...",
    no_results: "No songs found",
    nav_home: "Home",
    nav_songs: "All Songs",
    nav_artists: "Artists",
    nav_recommend: "Recommended",
    on_air: "ON AIR",
    new_tag: "New",
    sort_name: "By Name",
    sort_count: "By Count",
    select_artist_prompt: "Select an artist to view details",
    total_songs: "{count} songs",

    // 首頁區塊
    section_most_performed: "Most Performed",
    section_discover: "Discover",
    card_versions: "versions",

    // 首頁 CTA
    cta_title: "Looking for something specific?",
    cta_desc_prefix: "Search through the complete archive of",
    cta_desc_suffix: "songs.",
    cta_btn: "Browse Full Library",

    // Hero Section
    hero_welcome_title: "Welcome to <span class='text-blue-400'>CULUA</span><br/>Unofficial Song Database",
    hero_welcome_desc: "An archive of VSinger CULUA's karaoke streams and covers. Select a song from the menu or try the recommendations below.",
    hero_card_latest_title: "Latest Original",
    hero_card_latest_desc: "Listen to CULUA's latest original song.",
    hero_card_classic_title: "Classic Hits",
    hero_card_classic_desc: "New to CULUA? Start with this one.",
    hero_card_gap_title: "Gap Appeal", 
    hero_card_gap_desc: "Feel the gap between cool and cute.",
    hero_play_now: "Play Now",
    hero_surprise_title: "Don't know what to listen to?",
    hero_surprise_desc: "Let the system pick a random song for you.",
    hero_surprise_btn: "Surprise Me",

    // Right Panel
    mode_version_loop: "Next Version",
    mode_shuffle: "Shuffle",
    mode_list_loop: "Next Song",
    original_link: "Original Video",
    versions: "Versions",
    select_song_prompt: "Select a song to start playback",
    tag_latest: "LATEST",
    stream_archive: "Stream Archive",
    
    // ✨ 專注模式
    focus_mode_btn: "Start Focus Mode",
    focus_mode_desc: "Music Only • No Chit-chat • Infinite Loop",
    focus_exit: "Exit Focus",
    focus_next: "Next Song",
    focus_time_format: "en-US",
    focus_hint_ui: "Move cursor to show controls",

    // SEO
    home_authority_desc: "This website compiles all songs performed by <strong>VTuber/VSinger CULUA</strong> on YouTube, including original music and cover works. Data is sourced from the official YouTube channel and maintained with hourly automated updates for completeness.",
    songs_authority_desc_prefix: "Below is the complete list of songs performed by CULUA currently available on YouTube. This list is automatically synchronized server-side with official data and continuously updated. Currently contains",
    songs_authority_desc_suffix: "songs.",
    
    // About
    about_title: "About",
    about_subtitle: "About CULUA Song Database",
    about_intro_title: "Introduction",
    about_intro_content_1: "This website is an unofficial song database dedicated to <strong>VSinger CULUA</strong>.",
    about_intro_content_2: "Our goal is to catalog every song, cover, and original track CULUA has performed in YouTube livestreams over the years. Through automated data synchronization, we provide fans with the most complete and fast search and playback experience.",
    about_source_title: "Data Sources",
    about_source_1: "All song data is sourced from the <strong>CULUA Official Channel</strong> and related official communities.",
    about_source_2: "The system periodically (hourly) scans officially released setlists to ensure data timeliness and accuracy.",
    about_source_3: "Video playback uses the official YouTube embedded player, and views are counted towards official video statistics.",
    about_source_link: "Visit CULUA Official YouTube Channel",
    about_disclaimer_title: "Disclaimer",
    about_disclaimer_content: "This website is an unofficial fan-made project and is not directly affiliated with CULUA or her management. All copyright of audio and video content belongs to the original creators and officials. To contact the developer or report issues, please reach out via GitHub or social media.",

    // Footer
    footer: "© 2025 CULUA DB | Fan-made Project"
  }
};
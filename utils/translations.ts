export type Language = 'zh' | 'ja' | 'en';

export const translations = {
  zh: {
    title: 'CULUA 歌回資料庫',
    nav_home: '歌回紀錄',
    nav_songs: '曲名列表',
    nav_artists: '歌手列表',
    search_placeholder: '搜尋曲名或歌手...',
    sort_name: '按名稱',
    sort_count: '按次數',
    sort_date: '按日期',
    loading: '載入中...',
    no_results: '找不到符合的歌曲',
    original_link: '原始連結',
    versions: '其他版本',
    new_tag: '最新',
    select_song_prompt: '請從左側選擇一首歌曲',
    select_artist_prompt: '請從左側選擇一位歌手',
    auto_play_hint: '將會自動播放最新的歌回紀錄',
    now_playing: '正在播放',
    artist: '歌手',
    total_songs: '共 {count} 首歌曲',
    footer: '非官方粉絲資料庫',

    // Hero Section
    hero_welcome_title: "Welcome to <span class='text-blue-400'>CULUA's</span> World",
    hero_welcome_desc: "這裡是粉絲維護的非官方推廣站。探索 CULUA 多變的聲線，從這裡開始。",
    
    hero_card_latest_title: "🆕 最新主打",
    hero_card_latest_desc: "目前最新的作品，跟上最新進度。",
    
    hero_card_classic_title: "👑 入坑必聽",
    hero_card_classic_desc: "傳唱度最高、最能代表 CULUA 聲線的經典之作。",
    
    // === 修改重點 (ZH) ===
    hero_card_gap_title: "⚡ 風格反差",
    hero_card_gap_desc: "駕馭截然不同的曲風，體驗帥氣與溫柔的強烈對比。",
    
    hero_play_now: "立即播放",
    
    hero_surprise_title: "不知道聽什麼？",
    hero_surprise_desc: "交給命運決定，挖掘寶藏歌曲！",
    hero_surprise_btn: "Surprise Me!",
  },
  ja: {
    title: 'CULUA 歌枠データベース',
    nav_home: '歌った曲一覧',
    nav_songs: '曲名一覧',
    nav_artists: '歌手一覧',
    search_placeholder: '曲名または歌手を検索...',
    sort_name: '名前順',
    sort_count: '回数順',
    sort_date: '日付順',
    loading: '読み込み中...',
    no_results: '該当する曲が見つかりません',
    original_link: '元動画',
    versions: '他のバージョン',
    new_tag: 'NEW',
    select_song_prompt: '左側から曲を選択してください',
    select_artist_prompt: '左側からアーティストを選択してください',
    auto_play_hint: '最新の歌枠アーカイブが再生されます',
    now_playing: '再生中',
    artist: 'アーティスト',
    total_songs: '全 {count} 曲',
    footer: '非公式ファンデータベース',

    // Hero Section (JA)
    hero_welcome_title: "<span class='text-blue-400'>CULUA</span> の世界へようこそ",
    hero_welcome_desc: "ここはファンによる非公式の宣伝サイトです。CULUAの多彩な歌声をここから探索しましょう。",
    
    hero_card_latest_title: "🆕 最新の注目曲",
    hero_card_latest_desc: "現在の最新作、活動の最前線をチェック。",
    
    hero_card_classic_title: "👑 定番・入門",
    hero_card_classic_desc: "最も人気があり、CULUAの歌声を代表する名曲。",
    
    // === 修改重點 (JA) - 移除萌え ===
    hero_card_gap_title: "⚡ 表現の幅",
    hero_card_gap_desc: "クールさと美しさ、正反対のスタイルが生み出すコントラスト。",
    
    hero_play_now: "今すぐ再生",
    
    hero_surprise_title: "何を聴くか迷ったら？",
    hero_surprise_desc: "運命に任せて、隠れた名曲を発掘しよう！",
    hero_surprise_btn: "おまかせ再生 (Surprise Me!)",
  },
  en: {
    title: 'CULUA Song Database',
    nav_home: 'Song History',
    nav_songs: 'Song List',
    nav_artists: 'Artist List',
    search_placeholder: 'Search song or artist...',
    sort_name: 'By Name',
    sort_count: 'By Count',
    sort_date: 'By Date',
    loading: 'Loading...',
    no_results: 'No songs found',
    original_link: 'Original Link',
    versions: 'Other Versions',
    new_tag: 'NEW',
    select_song_prompt: 'Please select a song from the list',
    select_artist_prompt: 'Please select an artist from the list',
    auto_play_hint: 'Automatically plays the latest archive',
    now_playing: 'NOW PLAYING',
    artist: 'Artist',
    total_songs: '{count} Songs',
    footer: 'Fan Made Database',

    // Hero Section (EN)
    hero_welcome_title: "Welcome to <span class='text-blue-400'>CULUA's</span> World",
    hero_welcome_desc: "This is an unofficial fan-made site. Explore CULUA's versatile voice starting here.",
    
    hero_card_latest_title: "🆕 Latest Hit",
    hero_card_latest_desc: "Check out the newest release and keep up to date.",
    
    hero_card_classic_title: "👑 Must Listen",
    hero_card_classic_desc: "The most popular classics that represent CULUA's voice.",
    
    // === 修改重點 (EN) ===
    hero_card_gap_title: "⚡ Style Contrast",
    hero_card_gap_desc: "Experience the versatile range between cool and soft styles.",
    
    hero_play_now: "Play Now",
    
    hero_surprise_title: "Not sure what to listen to?",
    hero_surprise_desc: "Let fate decide and discover hidden gems!",
    hero_surprise_btn: "Surprise Me!",
  }
};
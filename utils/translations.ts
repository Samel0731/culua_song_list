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
  nav_stats: string;
  nav_social: string;
  on_air: string;
  new_tag: string;
  sort_name: string;
  sort_count: string;
  select_artist_prompt: string;
  total_songs: string;

  // 首頁區塊 (Home Sections)
  section_most_performed: string;
  section_discover: string;
  section_twitter: string;
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
  
  // 專注模式 (Focus Mode)
  focus_mode_btn: string;
  focus_mode_desc: string;
  focus_exit: string;
  focus_next: string;
  focus_time_format: string;
  focus_hint_ui: string;

  // 權威描述 (SEO)
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
  about_source_fans: string;
  about_source_3: string;
  about_source_link: string;
  about_disclaimer_title: string;
  about_disclaimer_content: string;

  // Footer
  footer: string;

  // 分享功能
  share_btn: string;
  share_modal_title: string;
  share_card_desc: string;
  share_download: string;
  share_downloading: string;

  // 數據統計頁面 (Stats Page)
  stats_title: string;
  stats_quick_filter_all: string;
  stats_quick_filter_year: string;
  stats_card_total_performances: string;
  stats_card_song_library: string;
  stats_card_artists: string;
  stats_card_new_songs: string;
  stats_card_unit_times: string;
  stats_card_unit_songs: string;
  stats_card_unit_groups: string;
  stats_new_song_ratio: string;
  stats_chart_trend: string;
  stats_chart_diversity: string;
  stats_chart_bubble: string;
  stats_chart_top_artists: string;
  stats_diversity_mainstay: string;
  stats_diversity_favorite: string;
  stats_diversity_occasional: string;
  stats_diversity_first: string;
  stats_bubble_legend_current: string;
  stats_bubble_legend_past: string;
  stats_table_rank: string;
  stats_table_song: string;
  stats_table_artist: string;
  stats_table_count: string;
  stats_tooltip_latest_year: string;
}

export const translations: Record<Language, Translation> = {
  zh: {
    title: "Culua 歌單",
    search_placeholder: "搜尋歌名、歌手...",
    loading: "載入中...",
    no_results: "沒有找到相關歌曲",
    nav_home: "首頁",
    nav_songs: "所有歌曲",
    nav_artists: "原唱歌手",
    nav_recommend: "推薦",
    nav_stats: "數據洞察",
    nav_social: "社群動態",
    on_air: "直播中",
    new_tag: "最新",
    sort_name: "依歌名",
    sort_count: "依次數",
    select_artist_prompt: "請選擇一位歌手查看詳細資訊",
    total_songs: "共 {count} 首歌",
    section_most_performed: "演唱最多",
    section_discover: "隨機探索",
    section_twitter: "X 最新動態",
    card_versions: "個版本",
    cta_title: "想要找特定的歌？",
    cta_desc_prefix: "搜尋完整的",
    cta_desc_suffix: "首歌庫。",
    cta_btn: "瀏覽完整歌單",
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
    mode_version_loop: "換直播",
    mode_shuffle: "隨機",
    mode_list_loop: "換歌",
    original_link: "原片連結",
    versions: "版本紀錄",
    select_song_prompt: "請選擇一首歌開始播放",
    tag_latest: "最新",
    stream_archive: "直播存檔",
    focus_mode_btn: "開啟專注模式",
    focus_mode_desc: "歌回音樂 • 指定演唱時間 • 循環播放",
    focus_exit: "退出專注",
    focus_next: "切歌",
    focus_time_format: "zh-TW",
    focus_hint_ui: "移動游標顯示控制項",
    songs_authority_desc_prefix: "以下是本站已整理並公開的 CULUA 歌回紀錄，共",
    songs_authority_desc_suffix: "首。歌單由粉絲整理、經審核後公開，可能仍有缺漏或錯誤，歡迎回報。",
    about_title: "關於本站",
    about_subtitle: "關於 CULUA 歌回資料庫",
    about_intro_title: "網站簡介",
    about_intro_content_1: "本網站是專為 <strong>VSinger CULUA</strong> 建立的非官方歌回資料庫。",
    about_intro_content_2: "歌回資料庫整理 CULUA 在 YouTube 直播中演唱的歌曲與翻唱。官方新聞、原創作品與活動時間軸另外涵蓋同期的 NEUN、MEDA；NEUN、MEDA 的歌單目前尚未收錄。",
    about_source_title: "資料來源",
    about_source_1: "歌回紀錄來自 <strong>CULUA 官方頻道</strong>的直播，由維護者整理並審核後才公開；新聞、作品與活動連結 RK Music 等官方來源原文。",
    about_source_2: "官方新聞與作品會快取，約 30 分鐘後有人瀏覽時才重新讀取，可能比官方公告晚一些；來源暫時無法讀取時會標示，不代表沒有資料。",
    about_source_fans: "早期歌單由粉絲在公開試算表中逐場整理，本站以這份紀錄為基礎繼續補充與審核。感謝每一位整理者；歌單是粉絲的成果，不是官方資料。",
    about_source_3: "影片播放使用 YouTube 官方嵌入播放器，可直接開啟官方原片。",
    about_source_link: "前往 CULUA 官方 YouTube 頻道",
    about_disclaimer_title: "免責聲明",
    about_disclaimer_content: "本網站為粉絲自行開發的非官方專案 (Fan-made Project)，與 CULUA 本人及其所屬營運單位無直接關聯。所有影音內容之版權歸原創作者及官方所有。如需聯絡開發者或回報問題，請透過 GitHub 或社群平台聯繫。",
    footer: "© 2026 CULUA DB | 非官方粉絲站",
    share_btn: "分享",
    share_modal_title: "分享這首神曲",
    share_card_desc: "我在聽這首神曲，你也來聽！",
    share_download: "下載推坑圖",
    share_downloading: "生成中...",
    stats_title: "數據洞察",
    stats_quick_filter_all: "全部時間",
    stats_quick_filter_year: "{year} 年",
    stats_card_total_performances: "演唱總次數",
    stats_card_song_library: "歌曲庫總量",
    stats_card_artists: "涵蓋原唱",
    stats_card_new_songs: "區間內本站首次紀錄的歌曲",
    stats_card_unit_times: "次",
    stats_card_unit_songs: "首",
    stats_card_unit_groups: "組",
    stats_new_song_ratio: "佔區間演唱次數之 {ratio}%",
    stats_chart_trend: "每月演唱活躍趨勢",
    stats_chart_diversity: "歌手翻唱廣度組成",
    stats_chart_bubble: "常唱歌曲分佈（本站最早紀錄日期／次數）",
    stats_chart_top_artists: "最常翻唱的原唱 Top 10",
    stats_diversity_mainstay: "11 次以上",
    stats_diversity_favorite: "5–10 次",
    stats_diversity_occasional: "2–4 次",
    stats_diversity_first: "1 次",
    stats_bubble_legend_current: "今年唱過",
    stats_bubble_legend_past: "區間內最近一次早於今年",
    stats_table_rank: "排名",
    stats_table_song: "歌曲名稱",
    stats_table_artist: "原唱歌手",
    stats_table_count: "次數",
    stats_tooltip_latest_year: "最近演唱年份",
  },
  ja: {
    title: "Culua ソングリスト",
    search_placeholder: "曲名、歌手で検索...",
    loading: "読み込み中...",
    no_results: "該当する曲が見つかりません",
    nav_home: "ホーム",
    nav_songs: "全曲リスト",
    nav_artists: "原曲アーティスト",
    nav_recommend: "おすすめ",
    nav_stats: "統計",
    nav_social: "SNS",
    on_air: "配信中",
    new_tag: "最新",
    sort_name: "曲名順",
    sort_count: "回数順",
    select_artist_prompt: "歌手を選択して詳細を表示",
    total_songs: "全 {count} 曲",
    section_most_performed: "歌唱回数の多い曲",
    section_discover: "ディスカバリー",
    section_twitter: "X 最新ポスト",
    card_versions: "バージョン",
    cta_title: "特定の曲をお探しですか？",
    cta_desc_prefix: "全",
    cta_desc_suffix: "曲のアーカイブから検索。",
    cta_btn: "全曲リストを見る",
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
    mode_version_loop: "同じ曲の別配信",
    mode_shuffle: "シャッフル",
    mode_list_loop: "次の曲",
    original_link: "元の動画",
    versions: "バージョン履歴",
    select_song_prompt: "曲を選択して再生を開始",
    tag_latest: "最新",
    stream_archive: "配信アーカイブ",
    focus_mode_btn: "作業用BGMモード",
    focus_mode_desc: "歌枠アーカイブ • 歌唱位置から再生 • ループ",
    focus_exit: "終了",
    focus_next: "次へ",
    focus_time_format: "ja-JP",
    focus_hint_ui: "カーソルを動かしてコントロールを表示",
    songs_authority_desc_prefix: "本サイトで整理・公開している CULUA の歌枠記録は",
    songs_authority_desc_suffix: "曲です。セトリはファンが整理し、確認後に公開しています。漏れや誤りがあるかもしれません。お気づきの点はお知らせください。",
    about_title: "このサイトについて",
    about_subtitle: "CULUA 歌枠データベースについて",
    about_intro_title: "サイト紹介",
    about_intro_content_1: "本サイトは <strong>VSinger CULUA</strong> のために作られた非公式歌枠データベースです。",
    about_intro_content_2: "歌枠アーカイブは CULUA の YouTube 配信で歌われた楽曲とカバーを整理しています。公式ニュース、オリジナル作品、タイムラインは同期の NEUN・MEDA も対象です。NEUN・MEDA のセトリはまだ収録していません。",
    about_source_title: "情報源",
    about_source_1: "歌枠の記録は <strong>CULUA 公式チャンネル</strong>の配信をもとに、管理者が整理・確認してから公開しています。ニュース、作品、イベントは RK Music などの公式記事へリンクします。",
    about_source_2: "公式ニュースと作品はキャッシュされ、約30分経過後のアクセス時に再取得するため、公式の発表より遅れることがあります。取得できない場合はその旨を表示し、情報がないという意味ではありません。",
    about_source_fans: "初期のセトリはファンが公開スプレッドシートに配信ごとにまとめたもので、本サイトはその記録をもとに追加・確認を続けています。まとめてくださった皆さんに感謝します。セトリはファンの成果であり、公式データではありません。",
    about_source_3: "動画再生にはYouTube公式の埋め込みプレーヤーを使用しており、公式の元動画にもアクセスできます。",
    about_source_link: "CULUA公式YouTubeチャンネルへ",
    about_disclaimer_title: "免責事項",
    about_disclaimer_content: "本サイトはファンによる非公式プロジェクト（Fan-made Project）であり、CULUA本人および所属運営元とは直接の関係はありません。すべての音声・映像コンテンツの著作権は原作者および公式に帰属します。開発者への連絡や問題の報告は、GitHubまたはSNSを通じてお願いします。",
    footer: "© 2026 CULUA DB | 非公式ファンサイト",
    share_btn: "共有",
    share_modal_title: "この神曲を共有",
    share_card_desc: "この曲めっちゃいい！聴いてみて！",
    share_download: "画像を保存",
    share_downloading: "生成中...",
    stats_title: "データインサイト",
    stats_quick_filter_all: "全期間",
    stats_quick_filter_year: "{year} 年",
    stats_card_total_performances: "歌唱回数合計",
    stats_card_song_library: "総楽曲数",
    stats_card_artists: "カバー歌手数",
    stats_card_new_songs: "期間内に初めて記録された曲",
    stats_card_unit_times: "回",
    stats_card_unit_songs: "曲",
    stats_card_unit_groups: "組",
    stats_new_song_ratio: "歌唱回数の {ratio}% を占める",
    stats_chart_trend: "月別歌唱アクティビティ推移",
    stats_chart_diversity: "カバー歌手の多様性",
    stats_chart_bubble: "よく歌う曲の分布（本サイトの最初の記録日 / 回数）",
    stats_chart_top_artists: "カバー回数の多いアーティスト Top 10",
    stats_diversity_mainstay: "11回以上",
    stats_diversity_favorite: "5〜10回",
    stats_diversity_occasional: "2〜4回",
    stats_diversity_first: "1回",
    stats_bubble_legend_current: "今年歌唱",
    stats_bubble_legend_past: "期間内の最新が今年より前",
    stats_table_rank: "順位",
    stats_table_song: "曲名",
    stats_table_artist: "アーティスト",
    stats_table_count: "回数",
    stats_tooltip_latest_year: "最近の歌唱年",
  },
  en: {
    title: "Culua Song List",
    search_placeholder: "Search songs, artists...",
    loading: "Loading...",
    no_results: "No songs found",
    nav_home: "Home",
    nav_songs: "All Songs",
    nav_artists: "Original artists",
    nav_recommend: "Recommended",
    nav_stats: "Stats",
    nav_social: "Social",
    on_air: "ON AIR",
    new_tag: "New",
    sort_name: "By Name",
    sort_count: "By Count",
    select_artist_prompt: "Select an artist to view details",
    total_songs: "{count} songs",
    section_most_performed: "Most Performed",
    section_discover: "Discover",
    section_twitter: "Latest X Posts",
    card_versions: "versions",
    cta_title: "Looking for something specific?",
    cta_desc_prefix: "Search through the complete archive of",
    cta_desc_suffix: "songs.",
    cta_btn: "Browse Full Library",
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
    mode_version_loop: "Next Version",
    mode_shuffle: "Shuffle",
    mode_list_loop: "Next Song",
    original_link: "Original Video",
    versions: "Versions",
    select_song_prompt: "Select a song to start playback",
    tag_latest: "LATEST",
    stream_archive: "Stream Archive",
    focus_mode_btn: "Start Focus Mode",
    focus_mode_desc: "Archived music • Timestamped playback • Loop",
    focus_exit: "Exit Focus",
    focus_next: "Next Song",
    focus_time_format: "en-US",
    focus_hint_ui: "Move cursor to show controls",
    songs_authority_desc_prefix: "This site has compiled and published",
    songs_authority_desc_suffix: "songs from CULUA's streams. Setlists are compiled by fans and published after review; some may be missing or wrong. Please report anything you notice.",
    about_title: "About",
    about_subtitle: "About CULUA Song Database",
    about_intro_title: "Introduction",
    about_intro_content_1: "This website is an unofficial song database dedicated to <strong>VSinger CULUA</strong>.",
    about_intro_content_2: "The song archive catalogs songs and covers CULUA has performed in YouTube streams. Official news, original music and the timeline also cover cohort members NEUN and MEDA; their setlists are not collected yet.",
    about_source_title: "Data Sources",
    about_source_1: "Performance records come from streams on the <strong>CULUA official channel</strong> and are published after maintainers review them. News, works and events link to the original official sources such as RK Music.",
    about_source_2: "Official news and works are cached and re-read on a visit after about 30 minutes, so they can lag behind official announcements. When a source cannot be read, the site says so; it does not mean nothing exists.",
    about_source_fans: "The early setlists were compiled stream by stream by fans in a public spreadsheet; this site builds on that record and keeps adding and reviewing. Thank you to everyone who compiled them. The setlists are fan work, not official data.",
    about_source_3: "Video playback uses the official YouTube embedded player, and links to the original videos are provided.",
    about_source_link: "Visit CULUA Official YouTube Channel",
    about_disclaimer_title: "Disclaimer",
    about_disclaimer_content: "This website is an unofficial fan-made project and is not directly affiliated with CULUA or her management. All copyright of audio and video content belongs to the original creators and officials. To contact the developer or report issues, please reach out via GitHub or social media.",
    footer: "© 2026 CULUA DB | Fan-made Project",
    share_btn: "Share",
    share_modal_title: "Share this song",
    share_card_desc: "Listening to this masterpiece!",
    share_download: "Download Image",
    share_downloading: "Generating...",
    stats_title: "Data Insights",
    stats_quick_filter_all: "All Time",
    stats_quick_filter_year: "Year {year}",
    stats_card_total_performances: "Total Performances",
    stats_card_song_library: "Song Library Size",
    stats_card_artists: "Artists Covered",
    stats_card_new_songs: "First Recorded Here in Period",
    stats_card_unit_times: "times",
    stats_card_unit_songs: "songs",
    stats_card_unit_groups: "groups",
    stats_new_song_ratio: "{ratio}% of performances in this period",
    stats_chart_trend: "Monthly Activity Trend",
    stats_chart_diversity: "Artist Diversity Composition",
    stats_chart_bubble: "Frequently Sung Songs (earliest record here / count)",
    stats_chart_top_artists: "Top 10 Covered Artists",
    stats_diversity_mainstay: "11+ times",
    stats_diversity_favorite: "5–10 times",
    stats_diversity_occasional: "2–4 times",
    stats_diversity_first: "Once",
    stats_bubble_legend_current: "Sang This Year",
    stats_bubble_legend_past: "Last sung in this period before this year",
    stats_table_rank: "Rank",
    stats_table_song: "Song Title",
    stats_table_artist: "Original Artist",
    stats_table_count: "Count",
    stats_tooltip_latest_year: "Last Sang in",
  }
};
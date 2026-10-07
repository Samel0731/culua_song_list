const zh = {
  news: '官方新聞', works: '原創作品', archive: '歌回資料庫', events: '活動時間軸', fanart: '粉絲創作',
  tagline: '跟上每一段歌聲，收藏每一個相遇。', intro: '官方消息、原創音樂與粉絲創作，在這裡相遇。',
  search: '搜尋歌曲、歌手', all: '查看全部', source: '前往官方來源', newsIntro: 'CULUA、NEUN、MEDA 相關公告，直接連結官方原文。',
  worksIntro: '從官方發行資料同步，收錄原創發行與官方 MV。', eventIntro: '演唱會、官方活動與音樂發行，沿著時間慢慢收藏。',
  fanIntro: '精選 X 原帖，保留創作者署名與作品出處。', empty: '目前沒有可顯示的資料，請前往來源查看。',
  upcoming: '即將到來', history: '歷史紀錄', event: '活動', release: '音樂發行', every: '全部',
  noUpcoming: '目前沒有已確認的近期活動。', undated: '發行日期待確認', play: '播放 MV', streaming: '串流平台',
  curated: '精選原創', latest: '最新發行', upcomingTitle: '近期活動', fanEmpty: '精選粉絲作品準備中。',
  openPost: '在 X 查看原帖', embedLoading: '載入原帖中…', embedError: '原帖暫時無法嵌入，請前往 X 查看。',
  status: '資料來源', updated: '最後成功同步', ready: '已同步', stale: '快取資料，等待更新', error: '暫時無法同步', unconfigured: '尚未設定精選',
  songs: '歌曲搜尋', artists: '歌手分類', stats: '演唱統計', originalLanguage: '官方內容保留原文',
  zone: '活動時間依官方公布（日本時間 JST）', about: '關於與來源', unofficial: '非官方粉絲站',
};
type Copy = typeof zh;
const ja: Copy = {
  news: '公式ニュース', works: 'オリジナル作品', archive: '歌枠アーカイブ', events: 'タイムライン', fanart: 'ファンアート',
  tagline: '歌声の続きを、出会いの記憶を。', intro: '公式情報、オリジナル音楽、ファンの作品をひとつに。',
  search: '曲名・アーティストを検索', all: 'すべて見る', source: '公式サイトへ', newsIntro: 'CULUA・NEUN・MEDA 関連のお知らせ。公式記事へリンクします。',
  worksIntro: '公式リリース情報から更新するオリジナル作品と MV。', eventIntro: 'ライブ、公式イベント、音楽リリースの記録。',
  fanIntro: '作者と出典を大切に、X の投稿をピックアップ。', empty: '表示できる情報がありません。公式サイトをご確認ください。',
  upcoming: '開催予定', history: 'これまで', event: 'イベント', release: 'リリース', every: 'すべて',
  noUpcoming: '現在、確認済みの開催予定はありません。', undated: '発売日確認中', play: 'MV を再生', streaming: '配信サービス',
  curated: 'ピックアップ', latest: '最新リリース', upcomingTitle: '近日のイベント', fanEmpty: 'ファン作品の選定を準備中です。',
  openPost: 'X で投稿を見る', embedLoading: '投稿を読み込み中…', embedError: '投稿を表示できません。X でご確認ください。',
  status: '情報源', updated: '最終同期', ready: '同期済み', stale: 'キャッシュ・更新待ち', error: '同期できません', unconfigured: '選定未設定',
  songs: '曲を探す', artists: 'アーティスト', stats: '歌唱統計', originalLanguage: '公式情報は原文で表示',
  zone: 'イベント時刻は公式発表の日本時間（JST）', about: 'このサイト・情報源', unofficial: '非公式ファンサイト',
};
const en: Copy = {
  news: 'Official news', works: 'Original music', archive: 'Song archive', events: 'Timeline', fanart: 'Fan creations',
  tagline: 'Follow the voice. Keep the memories.', intro: 'Official updates, original music, and creations from the community.',
  search: 'Search songs or artists', all: 'View all', source: 'Official source', newsIntro: 'CULUA, NEUN, and MEDA announcements, linked to the original official articles.',
  worksIntro: 'Original releases and music videos synced from official release sources.', eventIntro: 'Concerts, official events, and music releases through time.',
  fanIntro: 'Selected X posts with their original creator credits and sources.', empty: 'No information available. Visit the original source.',
  upcoming: 'Upcoming', history: 'History', event: 'Events', release: 'Releases', every: 'All',
  noUpcoming: 'No confirmed upcoming events at the moment.', undated: 'Release date unconfirmed', play: 'Play MV', streaming: 'Streaming services',
  curated: 'Selected originals', latest: 'Latest releases', upcomingTitle: 'Coming up', fanEmpty: 'Selected fan creations are on their way.',
  openPost: 'View original on X', embedLoading: 'Loading original post…', embedError: 'This post could not be embedded. View it on X.',
  status: 'Sources', updated: 'Last successful sync', ready: 'Synced', stale: 'Cached, awaiting refresh', error: 'Sync unavailable', unconfigured: 'Selection not configured',
  songs: 'Song search', artists: 'Artists', stats: 'Statistics', originalLanguage: 'Official content shown in its original language',
  zone: 'Event times follow official announcements (Japan Standard Time)', about: 'About & sources', unofficial: 'Unofficial fan site',
};
export const hubCopy = { zh, ja, en };

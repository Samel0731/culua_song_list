'use client';
import Link from 'next/link';
import type { GroupedSong } from '@/utils/dataProcessor';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import { hubCopy } from '@/utils/hubCopy';
import { songPath } from '@/utils/songLinks';
import ShareSiteLink from './ShareSiteLink';
export default function SongDetail({ song, selected }: { song: GroupedSong; selected: number }) {
  const { lang, t } = useLanguage(); const c = hubCopy[lang]; const { playSong } = usePlayer();
  const version = song.versions[selected] || song.versions[0];
  const incompleteLabel = lang === 'zh' ? '這場直播的歌單仍在補齊' : lang === 'ja' ? 'この配信のセットリストは確認中です' : 'This stream’s setlist is still being completed';
  return <main className="hub-page song-detail"><Link className="text-link" href="/songs">← {c.archive}</Link><p className="eyebrow">CULUA / SONG ARCHIVE</p><h1>{song.songName}</h1><p className="works-description">{song.artist} · {song.versions.length} {t.card_versions}</p><div className="song-detail-actions"><button className="stage-button primary" onClick={() => playSong(song, version)}>{t.hero_play_now}</button><ShareSiteLink path={songPath(song.songName, version)} title={song.songName}/></div><h2>{t.versions}</h2><div className="song-version-grid">{song.versions.map((v, i) => <article key={`${v.streamUrl}-${v.timestampSeconds}-${i}`}><time>{v.date}</time><h3>{v.streamTitle}</h3><p>{v.timestamp || '0:00'}</p>{v.streamIncomplete && <p className="subtle">{incompleteLabel}</p>}<button className="text-link" onClick={() => playSong(song, v)}>{t.hero_play_now} ↗</button><a className="text-link" href={v.streamUrl} target="_blank" rel="noopener noreferrer">{t.original_link} ↗</a></article>)}</div><p className="subtle">{c.unofficial} · {c.originalLanguage}</p></main>;
}

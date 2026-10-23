'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayer } from '@/context/PlayerContext';
import { experienceCopy } from '@/utils/archive/experienceCopy';
import type { PublicArchive, PublicArchiveIndex, PublicStream } from '@/utils/archive/publicStreams';

export default function StreamSetlists({ demo }: { demo?: PublicArchive }) {
  const { lang } = useLanguage(); const c = experienceCopy[lang];
  const { playSong, refreshSongs } = usePlayer();
  const router = useRouter(), pathname = usePathname(), params = useSearchParams();
  const [fetched, setArchive] = useState<PublicArchiveIndex | null>(demo || null), [busy, setBusy] = useState(false), [error, setError] = useState(false), [refresh, setRefresh] = useState(0);
  const [detail, setDetail] = useState<PublicStream | null>(null), [detailBusy, setDetailBusy] = useState(false), [detailError, setDetailError] = useState(false);
  const archive = demo || fetched;
  useEffect(() => {
    if (demo) return;
    let active = true;
    async function read() {
      setBusy(true); setError(false);
      try {
        const res = await fetch('/api/archive/streams', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error();
        const data: PublicArchiveIndex = await res.json();
        if (active) { setArchive(data); refreshSongs(data.songs); }
      } catch { if (active) setError(true); } finally { if (active) setBusy(false); }
    }
    void read(); return () => { active = false; };
  }, [refresh, demo, refreshSongs]);
  const query = params.get('streamQuery') || '';
  const selected = params.get('video');
  const stream = selected ? archive?.streams.find(s => s.videoId === selected) : archive?.streams[0];
  const videoId = stream?.videoId;
  useEffect(() => {
    if (demo || !videoId) return;
    let active = true;
    async function read() {
      setDetailBusy(true); setDetailError(false);
      try {
        const res = await fetch(`/api/archive/streams?video=${encodeURIComponent(videoId!)}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) { setDetail(data.stream); if (!data.stream) setDetailError(true); }
      } catch { if (active) setDetailError(true); } finally { if (active) setDetailBusy(false); }
    }
    void read(); return () => { active = false; };
  }, [videoId, refresh, demo]);
  const songs = demo ? demo.streams.find(s => s.videoId === videoId)?.songs || [] : detail && detail.videoId === videoId ? detail.songs : [];
  const matches = archive?.streams.filter(s => `${s.title} ${s.date}`.toLowerCase().includes(query.toLowerCase())) || [];
  const date = (value: string) => {
    const parsed = new Date(`${value.replaceAll('/', '-')}T00:00:00+09:00`);
    return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(lang === 'zh' ? 'zh-TW' : lang === 'ja' ? 'ja-JP' : 'en-US', { timeZone: 'Asia/Tokyo' }).format(parsed);
  };
  const update = (key: string, value: string, replace = false) => { const next = new URLSearchParams(params.toString()); if (value) next.set(key, value); else next.delete(key); next.set('view', 'streams'); router[replace ? 'replace' : 'push'](`${pathname}?${next}`, { scroll: false }); };
  const previous = archive?.streams.find((s, i) => i > (archive.streams.findIndex(v => v.videoId === stream?.videoId)) && s.count > 0);
  return <section className="stream-setlists"><div className="stream-toolbar"><h2>{!selected || selected === archive?.streams[0]?.videoId ? c.latest : c.streams}</h2><button onClick={() => setRefresh(n => n + 1)} disabled={busy || detailBusy}>{c.refresh}</button></div><p>{lang === 'zh' ? '按直播日期排序；同日場次不代表直播先後。' : lang === 'ja' ? '配信日順です。同日の配信順は示していません。' : 'Sorted by date; order within the same day does not indicate broadcast order.'}</p>{(busy || detailBusy) && <p role="status">{c.loading}</p>}{(error || detailError) && <p role="alert">{c.failed}</p>}{archive?.stale && <p role="status">{c.stale}</p>}<label>{c.search}<input value={query} onChange={e => update('streamQuery', e.target.value, true)}/></label>{query && !matches.length && <p role="status">{c.noResults}</p>}<label>{c.choose}<select value={stream?.videoId || ''} onChange={e => update('video', e.target.value)}><option value="">{c.choose}</option>{archive?.streams.filter(s => matches.some(m => m.videoId === s.videoId) || s.videoId === stream?.videoId).map(s => <option key={s.videoId} value={s.videoId}>{date(s.date)} · {s.title}</option>)}</select></label>{stream ? <><h3>{stream.title}</h3><p>{date(stream.date)} · {c.count} {stream.count} {stream.count === 1 ? c.unitSingle : c.unit}</p><a href={`https://www.youtube.com/watch?v=${stream.videoId}`} target="_blank" rel="noreferrer">{c.original}</a>{stream.count === 0 && <><p>{c.empty}</p>{previous && <button onClick={() => update('video', previous.videoId)}>{c.previous}</button>}</>}<ol className="stream-tracks">{songs.map(p => <li key={p.id}><button onClick={() => playSong({ songName: p.name, artist: p.artist, versions: [p.version] }, p.version)}><span>{p.position}. {p.name}<small>{p.artist}</small></span><time>{p.version.timestamp}</time></button></li>)}</ol></> : !busy && <p>{selected ? c.notFound : c.noResults}</p>}</section>;
}

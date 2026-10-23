'use client';
import { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { IssueCode } from '@/utils/archive/quality';
import { experienceCopy, issueLabels } from '@/utils/archive/experienceCopy';
import { songPath } from '@/utils/songLinks';
import { timestamp } from './ui';

export type SavedRecord = { command: string; values: Record<string, unknown> };
export default function SavedResult({ record, edit, demo, issues, hasPublic }: { hasPublic: boolean; issues: IssueCode[]; record: SavedRecord; edit: () => void; demo: boolean }) {
  const element = useRef<HTMLElement>(null);
  useEffect(() => { element.current?.scrollIntoView?.({ block: 'start' }); element.current?.focus({ preventScroll: true }); }, [record]);
  const { lang } = useLanguage(); const c = experienceCopy[lang]; const r = record.values;
  const description = record.command === 'stream_save' ? c.streamSaved : record.command === 'song_save' ? c.songSaved : record.command === 'candidate_publish' ? c.published : record.command === 'candidate_reject' ? c.rejected : record.command === 'performance_save' ? c.impact : c.candidateSaved;
  const fields = [['name', c.name], ['title', c.name], ['artist', c.artist], ['stream_date', c.date], ['position', c.position], ['timestamp_seconds', c.time], ['duration', c.duration], ['video_id', c.original]];
  return <section ref={element} className="admin-saved" aria-label={c.saved} tabIndex={-1} id="saved-result"><h2>{c.saved}</h2><p role="status">{description}</p><dl>{fields.filter(([key]) => key in r).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key === 'timestamp_seconds' && typeof r[key] === 'number' ? timestamp(r[key]) : key === 'video_id' ? `https://www.youtube.com/watch?v=${r[key]}` : String(r[key] ?? '—')}</dd></div>)}</dl>{['candidate_save', 'stream_save'].includes(record.command) && <p>{c.missing}: {issues.length ? issues.map(code => issueLabels[lang][code]).join(' · ') : c.ready}</p>}<button onClick={edit}>{c.edit}</button>{!demo && hasPublic && r.video_id ? <a href={`/songs?view=streams&video=${encodeURIComponent(String(r.video_id))}`} target="_blank" rel="noreferrer">{c.public}</a> : !demo && hasPublic && record.command === 'song_save' && r.name ? <a href={songPath(String(r.name))} target="_blank" rel="noreferrer">{c.all}</a> : null}</section>;
}

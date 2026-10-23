'use client';
import { createContext, useContext, useEffect, useRef, useState, type FormHTMLAttributes, type ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { translate, localizeKnown, type CopyKey } from './copy';

export type Command = (command: string, input: Record<string, unknown>) => Promise<unknown>;
export type Run = (work: () => Promise<unknown>) => Promise<boolean>;
export const DraftContext = createContext<{ dirty: (id: string, value: boolean) => void; submit: (form: HTMLFormElement) => void; leave: () => boolean; saved: number }>({
  dirty: () => {},
  submit: () => {},
  leave: () => true,
  saved: 0,
});
export function useAdminCopy() {
  const { lang } = useLanguage();
  return { t: (key: CopyKey) => translate(lang, key), known: (text: string) => localizeKnown(lang, text), lang };
}

export function useDraftText(id: string, value: string) {
  const { dirty } = useContext(DraftContext);
  useEffect(() => () => dirty(id, false), [id, dirty]);
  return (text: string) => dirty(id, text !== value);
}

// Keep forms mounted across language switches and data refreshes. Track the
// version the user actually edited, rather than adopting a fresh server version.
export function DraftForm({ children, onSubmit, onInput, onChange, ...props }: FormHTMLAttributes<HTMLFormElement> & { 'data-record'?: string; 'data-version'?: number }) {
  const { dirty, submit, saved } = useContext(DraftContext);
  const [id] = useState(() => props['data-record'] || crypto.randomUUID());
  const [version] = useState(props['data-version']);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => () => dirty(id, false), [dirty, id]);
  useEffect(() => {
    if (form.current?.dataset.saved === String(saved)) dirty(id, false);
  }, [saved, dirty, id]);
  const mark = () => {
    if (form.current) { form.current.dataset.dirty = 'true'; dirty(id, true); }
  };
  return <form {...props} data-version={version} data-draft-id={id} ref={form} onInput={e => { mark(); onInput?.(e); }} onChange={e => { mark(); onChange?.(e); }} onSubmit={e => { submit(e.currentTarget); onSubmit?.(e); }}>{children}</form>;
}

export async function readResponse(response: Response & { archiveWrite?: boolean; archiveRequestId?: string }) {
  let data;
  try { data = await response.json(); }
  catch { throw Object.assign(new Error('操作失敗'), { status: response.status, uncertain: Boolean(response.archiveWrite), requestId: response.archiveRequestId }); }
  if (!response.ok) throw Object.assign(new Error(data.error || '操作失敗'), { current: data.current, status: response.status, uncertain: response.archiveWrite && response.status >= 500, requestId: response.archiveRequestId });
  return data;
}
export function values(form: HTMLFormElement) { return Object.fromEntries(new FormData(form)); }
export function timestamp(value: number | null) { return value === null ? '' : `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`; }

export function Status({ value }: { value: string }) {
  const { t } = useAdminCopy();
  const key: CopyKey = ({ review: '待審', published: '已發布', rejected: '已排除', success: '已完成', complete: '已完成', ready: '已完成', pending: '等待中', queued: '等待中', running: '執行中', failed: '失敗', error: '失敗', image: '圖片', comment: '留言', youtube: '留言', active: '有效', no_setlist: '尚未找到歌單', comments_disabled: '留言功能已關閉', incomplete: '掃描尚未完成', needs_image: '待提供圖片', needs_ocr: '待辨識圖片' } as Record<string, CopyKey>)[value] || '未確認狀態';
  return <span className={`admin-badge status-${value.replace(/[^a-z]/g, '')}`}>{t(key)}</span>;
}
export function Technical({ children }: { children: ReactNode }) {
  const { t } = useAdminCopy();
  return <details className="admin-technical"><summary>{t('技術詳情')}</summary><pre>{children}</pre></details>;
}
export function Comparison({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const { t } = useAdminCopy();
  const fields: [string, CopyKey][] = [['name', '曲名'], ['artist', '歌手'], ['position', '演唱順序'], ['timestamp_seconds', '時間'], ['title', '標題'], ['stream_date', '直播日期'], ['duration', '影片長度（秒）'], ['published', '公開此紀錄'], ['song_link', '歌曲連結'], ['song_id', '歌曲'], ['status', '全部狀態']];
  const display = (key: string, value: unknown) => key === 'timestamp_seconds' && typeof value === 'number' ? timestamp(value) : typeof value === 'boolean' ? (value ? t('已啟用') : '—') : String(value ?? '—');
  return <div className="admin-comparison"><table><thead><tr><th>{t('欄位')}</th><th>{t('你的草稿')}</th><th>{t('目前版本')}</th></tr></thead><tbody>{fields.filter(([key]) => key in (before || {}) || key in (after || {})).map(([key, label]) => <tr key={key}><th>{t(label)}</th><td>{display(key, before?.[key])}</td><td>{after?.deleted ? t('已刪除') : display(key, after?.[key])}</td></tr>)}</tbody></table></div>;
}

export function ConfirmDialog({ title, detail, accept, cancel }: { title: string; detail?: string; accept: () => void; cancel: () => void }) {
  const { t } = useAdminCopy();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="admin-dialog" aria-labelledby="admin-confirm-title" onCancel={e => { e.preventDefault(); cancel(); }}><h2 id="admin-confirm-title">{title}</h2><p style={{ whiteSpace: 'pre-line' }}>{detail || t('這項操作會變更資料或存取權限，請確認後繼續。')}</p><div className="admin-actions"><button autoFocus onClick={cancel}>{t('取消')}</button><button className="admin-primary" onClick={accept}>{t('確認')}</button></div></dialog>;
}

export function RecordPreview({ rows }: { rows: unknown[] }) {
  const { t } = useAdminCopy();
  return <div className="admin-list">{rows.map((row, i) => {
    const r = row as Record<string, unknown>;
    const content = ['name', 'song_name', 'artist', 'song_artist', 'stream_title', 'stream_date', 'timestamp', 'timestamp_seconds', '曲名', 'アーティスト', '配信日'].filter(key => key in r);
    return <div className="admin-card" key={i}><strong>{i + 1}. {content.map(key => key === 'timestamp_seconds' && typeof r[key] === 'number' ? timestamp(r[key] as number) : String(r[key])).join(' · ') || t('演唱紀錄')}</strong><Technical>{JSON.stringify(row, null, 2)}</Technical></div>;
  })}</div>;
}

export function OcrRows({ text, change }: { text: string; change: (text: string) => void }) {
  const { t } = useAdminCopy();
  const rows = text.split('\n').filter(line => line.trim()).map(line => { const [name, ...artist] = line.normalize('NFKC').split('/'); return [name.trim(), artist.join('/').trim()]; });
  const edit = (index: number, field: number, value: string) => { rows[index][field] = value; change(rows.map(([name, artist]) => `${name}／${artist}`).join('\n')); };
  return <div className="admin-ocr-rows">{rows.map(([name, artist], i) => <div className="admin-grid" key={i}><label>{i + 1}. {t('曲名')}<input aria-label={`${t('曲名')} ${i + 1}`} value={name} onChange={e => edit(i, 0, e.target.value)}/></label><label>{t('歌手')}<input aria-label={`${t('歌手')} ${i + 1}`} value={artist} onChange={e => edit(i, 1, e.target.value)}/></label></div>)}</div>;
}

export function usePinned<T>(value: T) {
  // The form's original data/version is retained until its owner deliberately
  // remounts after a successful save or explicit conflict resolution.
  const [initial] = useState(value);
  return initial;
}

'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { browserClient } from '@/utils/archive/supabaseBrowser';
import { boundedFetch, adminErrorMessage } from '@/utils/archive/adminRequest.mjs';
import type { Dashboard, Stream } from '@/utils/archive/types';
import { videoIdFromUrl } from '@/utils/archive/ingestion.mjs';
import { useLanguage } from '@/context/LanguageContext';
import { CandidateForm, SongManager, PerformanceForm, ImageImport, Migration, Management } from './forms';
import { Comparison, ConfirmDialog, DraftContext, DraftForm, Status, Technical, OcrRows, readResponse, useAdminCopy, usePinned, values, timestamp, type Command, type Run } from './ui';
import { adminCopy, type CopyKey } from './copy';
import { demoDashboard, demoCommand } from './demoData';
import QualityPanel from './QualityPanel';
import SavedResult, { type SavedRecord } from './SavedResult';
import { experienceCopy } from '@/utils/archive/experienceCopy';
import { projectStreams } from '@/utils/archive/publicStreams';
import { inspectQuality, type QualityIssue } from '@/utils/archive/quality';
import './admin.css';

type Failure = Error & { current?: Record<string, unknown>; status?: number; uncertain?: boolean; requestId?: string };
type Section = 'home' | 'streams' | 'songs' | 'management';
const sections: [Section, CopyKey][] = [['home', '工作台'], ['streams', '直播歌單'], ['songs', '歌曲資料'], ['management', '管理']];
const management: [string, CopyKey][] = [['unavailable', '舊資料待補'], ['history', '修改歷史'], ['jobs', '工作狀態'], ['migration', '匯出與匯入'], ['members', '成員']];
const sensitive: Record<string, CopyKey> = { candidate_reject: '排除此候選', alias_add: '核准別名', alias_revoke: '撤銷別名核准', member_revoke: '撤銷存取', revision_restore: '還原修改前內容', enable_auto_publish: '自動更新' };

export default function Admin({ authenticated, allowed, demo = false, configured = true }: { authenticated: boolean; allowed: boolean; demo?: boolean; configured?: boolean }) {
  const { t, known, lang } = useAdminCopy();
  const { setLang } = useLanguage();
  const c = experienceCopy[lang];
  const [result, setResult] = useState<SavedRecord | null>(null);
  const [targetSong, setTargetSong] = useState('');
  const [scenario, setScenario] = useState('normal');
  const [preview, setPreview] = useState(false);
  const receipt = useRef<unknown>(null);
  const demoFailure = useRef(false);
  const writeForm = useRef<HTMLFormElement | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const focused = useRef<object | null>(null);
  const [data, setData] = useState<Dashboard | null>(demo ? demoDashboard() : null);
  const sample = useRef<Dashboard | null>(demo ? demoDashboard() : null);
  const heading = useRef<HTMLHeadingElement>(null);
  const lastSection = useRef<Section>('home');
  const [video, setVideo] = useState(''), [section, setSection] = useState<Section>('home'), [step, setStep] = useState(0), [tab, setTab] = useState('unavailable');
  const [search, setSearch] = useState(''), [songSearch, setSongSearch] = useState(''), [filter, setFilter] = useState('review'), [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [pending, setPending] = useState<string | null>(null), [conflict, setConflict] = useState<{ draft: Record<string, unknown>; current: Record<string, unknown> } | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: CopyKey; detail: string; resolve: (value: boolean) => void } | null>(null);
  const [saved, setSaved] = useState(0), [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set()), [newEpoch, setNewEpoch] = useState(0);
  const dirtyRef = useRef(new Set<string>()), submitted = useRef<HTMLFormElement | null>(null), sequence = useRef(0), lock = useRef(false);
  const lastWrite = useRef<Record<string, unknown> | null>(null), pendingWork = useRef<(() => Promise<unknown>) | null>(null), retrying = useRef(false), wrote = useRef(false);
  const versions = useRef(new Map<string, number>());
  const resolvedVersions = useRef(new Map<string, number>());
  const recordKey = (id: string, version: number) => { if (!dirtyIds.has(id) || !versions.current.has(id)) versions.current.set(id, version); return `${id}:${versions.current.get(id)}`; };
  const dirty = useCallback((id: string, value: boolean) => {
    const next = new Set(dirtyRef.current); if (value) next.add(id); else next.delete(id);
    dirtyRef.current = next; setDirtyIds(next);
  }, []);
  const submit = useCallback((form: HTMLFormElement) => { submitted.current = form; queueMicrotask(() => { if (!lock.current) submitted.current = null; }); }, []);
  const leave = () => dirtyRef.current.size === 0 || window.confirm(t('尚未儲存。離開會捨棄修改，確定離開？'));
  useEffect(() => {
    const before = (event: BeforeUnloadEvent) => { if (dirtyRef.current.size) { event.preventDefault(); event.returnValue = ''; } };
    const navigation = (event: MouseEvent) => { const link = (event.target as HTMLElement).closest('a[href]'); if (link && !link.hasAttribute('download') && link.getAttribute('target') !== '_blank' && dirtyRef.current.size && !window.confirm(t('尚未儲存。離開會捨棄修改，確定離開？'))) event.preventDefault(); };
    window.addEventListener('beforeunload', before); document.addEventListener('click', navigation, true);
    return () => { window.removeEventListener('beforeunload', before); document.removeEventListener('click', navigation, true); };
  }, [lang, t]);
  const load = useCallback(async (targetVideo?: string) => {
    if (demoFailure.current) { demoFailure.current = false; throw new Error('Reload unavailable'); }
    const current = ++sequence.current;
    const fresh = demo ? structuredClone(sample.current!) : await readResponse(await boundedFetch(`/api/admin${(targetVideo || video) ? `?video=${targetVideo || video}` : ''}`, { cache: 'no-store' }));
    if (current === sequence.current) setData((previous: Dashboard | null) => {
      if (!previous) return fresh;
      // Deleted server records do not erase an open dirty draft. Writes still
      // use its original identity/version and are rejected by the server.
      for (const table of ['candidates', 'performances', 'songs', 'streams'] as const) {
        const rows = fresh[table] as { id?: string; video_id?: string }[];
        for (const row of previous[table]) {
          const id = 'id' in row ? row.id : row.video_id;
          if (dirtyRef.current.has(id) && !rows.some(r => (r.id || r.video_id) === id)) rows.push(row);
        }
      }
      return fresh;
    });
  }, [video, demo]);
  useEffect(() => { if (allowed && configured) load().catch(e => setError(previous => previous || e.message)); }, [allowed, configured, load]);
  useEffect(() => {
    if (section === lastSection.current) return;
    lastSection.current = section;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }, [section]);
  useEffect(() => {
    if (!focusRequest || focused.current === focusRequest) return;
    const form = Array.from(document.querySelectorAll<HTMLFormElement>('form[data-record]')).find(f => f.dataset.record === focusRequest.id);
    if (!form) return;
    const details = form.closest('details'); if (details) details.open = true;
    form.scrollIntoView?.({ block: 'center' });
    form.querySelector<HTMLElement>('input,select,button')?.focus();
    focused.current = focusRequest;
  }, [focusRequest, data, section, step, tab]);
  const confirm = (title: CopyKey, detail: string) => new Promise<boolean>(resolve => setConfirmation({ title, detail, resolve }));
  const rawCommand: Command = async (name, input) => {
    const record = String(input.id || input.video_id || '');
    const formVersion = submitted.current?.dataset.version;
    if (input.version !== undefined && formVersion) input = { ...input, version: Number(formVersion) };
    if (resolvedVersions.current.has(record)) input = { ...input, version: resolvedVersions.current.get(record) };
    wrote.current = true;
    const request_id = retrying.current && lastWrite.current?.request_id ? String(lastWrite.current.request_id) : crypto.randomUUID();
    lastWrite.current = { command: name, ...input, request_id };
    if (demo) {
      const result = retrying.current ? receipt.current : demoCommand(sample.current!, name, input); receipt.current = result;
      if (scenario === 'timeout' && !retrying.current) throw Object.assign(new Error('操作失敗'), { uncertain: true, requestId: request_id });
      if (scenario === 'readFailure') demoFailure.current = true;
      return result;
    }
    try { const result = await readResponse(await boundedFetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: name, input: { ...input, request_id } }) })); resolvedVersions.current.delete(record); receipt.current = result; return result; }
    catch (e) { const failure = e as Failure; if (!failure.status || failure.status >= 500) { failure.uncertain = true; failure.requestId = request_id; } throw failure; }
  };
  const command: Command = async (name, input) => {
    if (!retrying.current && sensitive[name]) {
      const target = data?.candidates.find(v => v.id === input.id)?.name || data?.aliases.find(v => v.id === input.id)?.name || data?.members.find(v => v.id === input.id)?.email || String(input.name || input.revision_id || '');
      const effects: Record<string, [string, string, string]> = {
        candidate_reject: ['將保留歷史並排除此候選，不新增公開演唱。', '履歴を残して候補を除外します。歌唱記録は公開されません。', 'Keeps history and excludes this candidate without publishing a performance.'],
        alias_add: ['此名稱將參與自動比對；不會立即發布歌曲。', 'この表記を自動照合に使用します。曲は直ちに公開されません。', 'Uses this spelling for matching; it does not immediately publish songs.'],
        alias_revoke: ['停止用此別名自動比對；不刪除既有公開演唱。', '別名による照合を停止します。公開済みの歌唱記録は削除しません。', 'Stops matching this alias; existing public performances remain.'],
        member_revoke: ['此成員將失去後台與私人圖片存取權限。', 'このメンバーは管理画面と非公開画像にアクセスできなくなります。', 'Removes this member’s access to the dashboard and private images.'],
        revision_restore: ['還原此修訂前的內容，並記錄新的修改歷史；可能影響前台。', '変更前の内容を復元し、新しい履歴を記録します。公開内容に影響する場合があります。', 'Restores the previous values and records a new revision; public content may change.'],
        enable_auto_publish: ['完成七天試運轉後，符合規則的候選才可自動發布。', '7日間の試運転後、条件を満たす候補を自動公開できます。', 'After the seven-day trial, eligible candidates may be published automatically.'],
      };
      if (!await confirm(sensitive[name], `${c.confirmRecord}: ${target || t(sensitive[name])}\n${effects[name]?.[lang === 'zh' ? 0 : lang === 'ja' ? 1 : 2] || c.impact}`)) throw new Error('cancelled');
    }
    return rawCommand(name, input);
  };
  const finishWrite = (value: unknown) => {
    if (!lastWrite.current) return;
    const name = String(lastWrite.current.command);
    const form = writeForm.current;
    if (form) { form.dataset.dirty = 'false'; dirty(form.dataset.record || form.dataset.draftId || '', false); }
    setSaved(n => n + 1);
    if (!['stream_save', 'song_save', 'candidate_save', 'candidate_publish', 'candidate_reject', 'performance_save'].includes(name)) return;
    const raw = value && typeof value === 'object' && ('id' in value || 'video_id' in value) ? value as Record<string, unknown> : {};
    const relatedSong = name === 'performance_save' ? data?.songs.find(s => s.id === raw.song_id || s.id === lastWrite.current?.song_id) : undefined;
    const savedValues: Record<string, unknown> = { ...lastWrite.current, ...raw, ...(relatedSong ? { name: relatedSong.name, artist: relatedSong.artist } : {}) };
    const record = { command: name, values: savedValues };
    setResult(record);
    if (name === 'song_save' && savedValues.id) setTargetSong(String(savedValues.id));
    if (savedValues.video_id) setVideo(String(savedValues.video_id));
    // Merge the receipt before reloading so a failed refresh cannot lose the new record.
    if (Object.keys(raw).length) setData(previous => {
      if (!previous) return previous;
      const table = name === 'stream_save' ? 'streams' : name === 'song_save' ? 'songs' : name === 'performance_save' ? 'performances' : 'candidates';
      const idKey = table === 'streams' ? 'video_id' : 'id';
      const rows = previous[table];
      return { ...previous, [table]: [...rows.filter(row => String((row as unknown as Record<string, unknown>)[idKey]) !== String(raw[idKey])), raw] };
    });
    if (name === 'candidate_save' && lastWrite.current.create) setNewEpoch(n => n + 1);
  };
  const run: Run = async work => {
    if (lock.current || (pending && !retrying.current)) return false;
    lock.current = true; setBusy(true); setError(''); setMessage(''); setConflict(null); pendingWork.current = work; wrote.current = false;
    if (!retrying.current) { lastWrite.current = null; receipt.current = null; writeForm.current = submitted.current; }
    let completed = false;
    try {
      await work(); completed = true; if (wrote.current) finishWrite(receipt.current); setPending(null); setMessage('操作完成');
      // Clear only the submitted draft. Refresh failures retain entered values.
      if (!wrote.current && submitted.current) { const form = submitted.current; const next = saved + 1; form.dataset.saved = String(next); form.dataset.dirty = 'false'; dirty(form.dataset.record || form.dataset.draftId || '', false); setSaved(next); }
      await load(lastWrite.current?.video_id ? String(lastWrite.current.video_id) : undefined);
      return true;
    } catch (e) {
      const failure = e as Failure;
      if (failure.message !== 'cancelled') setError(completed ? '已儲存，清單更新失敗。請重新讀取資料。' : failure.message || '操作失敗');
      if (failure.status === 409) setConflict({ draft: lastWrite.current || {}, current: failure.current || { deleted: true } });
      if (failure.uncertain) setPending(failure.requestId || String(lastWrite.current?.request_id || ''));
      return false;
    } finally { submitted.current = null; lock.current = false; setBusy(false); }
  };
  const reload = async () => { try { await load(); setMessage('資料已重新讀取'); } catch (e) { setError((e as Error).message); } };
  const confirmPending = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      const result = demo ? { found: true, result: receipt.current } : await readResponse(await boundedFetch(`/api/admin?request=${pending}`, { cache: 'no-store' }));
      if (!result.found) { setMessage('目前尚無已提交結果；操作可能仍在執行，請稍後再次確認。'); return; }
      setPending(null); finishWrite(result.result); setMessage('已確認操作完成。'); try { await load(lastWrite.current?.video_id ? String(lastWrite.current.video_id) : undefined); } catch { setError('已確認操作完成，清單更新失敗。請重新讀取資料。'); }
    } catch (e) { setError((e as Error).message); } finally { lock.current = false; setBusy(false); }
  };
  const login = async () => { try { const result = await browserClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'openid email profile' } }); if (result.error) throw result.error; } catch (e) { setError((e as Error).message); } };
  const signout = async () => { if (!leave() || demo) return; try { const result = await browserClient().auth.signOut(); if (result.error) throw result.error; window.location.reload(); } catch (e) { setError((e as Error).message); } };
  const language = <label className="admin-language"><span>Language</span><select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as typeof lang)}><option value="zh">繁體中文</option><option value="ja">日本語</option><option value="en">English</option></select></label>;
  const errorKey = adminErrorMessage(error);
  const translatedError = Object.values(adminCopy).some(pair => pair.includes(error)) ? error : known(errorKey);
  const notice = <>{message && <p role="status" className="admin-message">{known(message)}</p>}{error && <div role="alert" className="admin-warning"><p>{translatedError}</p>{!(errorKey in adminCopy) && <Technical>{error}</Technical>}</div>}</>;
  if (!configured || !authenticated || !allowed) return <section className="admin-shell admin-entry">{language}<h1>{t(!configured ? '歌單工作台' : authenticated ? '此帳號尚未受邀' : '共同維護歌單')}</h1><p>{t(!configured ? '後台尚未啟用。請聯絡網站擁有者完成設定。' : authenticated ? '請由網站擁有者將你的 Google 信箱加入協作者名單，再重新登入。' : '使用受邀的 Google 帳號登入，新增歌曲、校正圖片辨識與發布直播歌單。')}</p>{configured && <button className="admin-primary" onClick={authenticated ? signout : login}>{t(authenticated ? '登出' : '使用 Google 登入')}</button>}{notice}</section>;
  const intro = { home: c.homeIntro, streams: c.streamsIntro, songs: c.songsIntro, management: c.managementIntro }[section];
  const resultSection: Section = result?.command === 'song_save' ? 'songs' : 'streams';
  const stream = data?.streams.find(s => s.video_id === video);
  const candidates = data?.candidates.filter(c => c.video_id === video) || [];
  const filtered = candidates.filter(c => (!filter || c.status === filter) && `${c.name} ${c.artist}`.toLowerCase().includes(songSearch.toLowerCase()));
  const go = (next: Section) => { if (busy || pending || (next !== section && !leave())) return; setSection(next); setMobileNav(false); };
  const openIssue = (issue: QualityIssue) => {
    if (!leave()) return;
    if (issue.entity === 'unavailable') { setSection('management'); setTab('unavailable'); }
    else { setVideo(issue.video); setSection('streams'); setStep(issue.entity === 'stream' ? 0 : 2); setFilter('review'); setSongSearch(''); }
    setFocusRequest({ id: issue.id });
  };
  const changeVideo = (id: string) => { if (id !== video && !leave()) return; setVideo(id); setConflict(null); setError(''); setSongSearch(''); };
  return <DraftContext.Provider value={{ dirty, submit, saved, leave }}><section className="admin-shell">
    <header className="admin-heading"><div><p className="admin-eyebrow">CULUA FAN ARCHIVE</p><h1 id="admin-page-title" ref={heading} tabIndex={-1}>{t(sections.find(([key]) => key === section)![1])}</h1><p id="admin-section-description" className="admin-page-intro">{intro}</p><p>{data && t(data.role === 'owner' ? '擁有者' : '協作者')} · {t('公開網站只會顯示已發布的演唱紀錄。')}</p></div><div className="admin-tools">{language}<button onClick={signout}>{t('登出')}</button></div></header>
    {demo && <p className="admin-demo" role="status">{t('展示模式：所有操作只修改假資料，不會寫入正式後台。')}</p>}
    <div className="admin-layout"><aside className="admin-sidebar"><button className="admin-menu" aria-expanded={mobileNav} aria-controls="admin-navigation" onClick={() => setMobileNav(!mobileNav)}>{t(sections.find(([key]) => key === section)![1])} ☰</button><nav id="admin-navigation" className={mobileNav ? 'is-open' : ''} aria-label={t('管理功能')}>{sections.map(([key, label]) => <button key={key} disabled={busy || !!pending} aria-current={section === key ? 'page' : undefined} onClick={() => go(key)}>{t(label)}</button>)}</nav><p className="admin-sidebar-help">{busy || pending ? c.navigationBlocked : c.candidateOnly}</p></aside>
    <main className="admin-main" aria-labelledby="admin-page-title" aria-describedby="admin-section-description" aria-busy={busy}>
    {busy && <p role="status">{t('處理中…')}</p>}{notice}
    {!data && <div className="admin-card"><p role="status">{t(error?'讀取失敗':'正在載入角色與資料…')}</p><button onClick={reload}>{t('重新讀取資料')}</button></div>}
    {pending && <div role="alert" className="admin-conflict"><p>{t('操作結果尚未確認。識別碼：')}{pending}</p><button disabled={busy} onClick={confirmPending}>{t('確認操作結果')}</button><button disabled={busy} onClick={async () => { const work = pendingWork.current; if (!work) return; retrying.current = true; try { await run(work); } finally { retrying.current = false; } }}>{t('以同一識別碼重試')}</button></div>}
    {conflict && <div role="alert" className="admin-conflict"><p>{t('資料已更新或刪除。你的草稿尚未儲存，請比對後載入最新資料並重新確認。')}</p><Comparison before={conflict.draft} after={conflict.current}/><button onClick={reload}>{t('載入最新資料')}</button>{!conflict.current.deleted && typeof conflict.current.version === 'number' && <button onClick={() => { resolvedVersions.current.set(String(conflict.draft.id || conflict.draft.video_id), Number(conflict.current.version)); setConflict(null); setMessage('重新確認並儲存'); }}>{t('重新確認並儲存')}</button>}</div>}
    {data && <><div className="admin-section-heading"><h2>{t(sections.find(([key]) => key === section)![1])}</h2><button disabled={busy} onClick={reload}>{t('重新讀取資料')}</button></div>
    <fieldset disabled={busy || !!pending} className="admin-work">
    {result && section === resultSection && <SavedResult record={result} hasPublic={result.command === 'candidate_publish' || data.performances.some(p => p.published && (result.values.video_id ? p.video_id === result.values.video_id : p.song_id === result.values.id))} issues={inspectQuality(data).items.find(i => i.id === String(result.values.id || result.values.video_id))?.codes || []} demo={demo} edit={() => { if (result.command === 'song_save') { if (!leave()) return; setTargetSong(String(result.values.id || '')); setSection('songs'); } else { const performance = result.command === 'candidate_publish' ? data.performances.find(p => p.video_id === result.values.video_id && p.position === result.values.position) : undefined; openIssue({ id: String(performance?.id || result.values.id || result.values.video_id || ''), entity: result.command === 'stream_save' ? 'stream' : 'candidate', video: String(result.values.video_id || video), title: '', codes: [] }); if (result.command === 'candidate_publish' && !performance) setFilter('published'); } }}/>}
    {section === 'streams' && video && <details className="admin-card"><summary>{c.quality}</summary><QualityPanel demo={demo ? data : undefined} video={video} revision={saved} open={openIssue}/></details>}
    {section === 'home' && <><div className="admin-welcome"><h2>{t('開始整理直播')}</h2><p>{c.candidateOnly}</p><ol>{(['基本資料', '整理歌曲', '檢查與發布'] as CopyKey[]).map(label => <li key={label}>{t(label)}</li>)}</ol><button className="admin-primary" onClick={() => { go('streams'); setStep(0); }}>{t('開始整理直播')}</button></div><QualityPanel demo={demo ? data : undefined} revision={saved} open={openIssue}/><h3>{t('最近待審歌曲')}</h3><p className="admin-muted">{t('目前載入範圍')} · {data.candidates.filter(c => c.status === 'review').length}</p><div className="admin-list">{data.candidates.filter(c => c.status === 'review').slice(0, 8).map(c => <button key={c.id} className="admin-row" onClick={() => { changeVideo(c.video_id); go('streams'); setStep(2); }}><span>{c.name}<small>{c.artist || '—'}</small></span><Status value={c.status}/></button>)}</div>{!data.candidates.some(c => c.status === 'review') && <p>{t('沒有待處理資料')}</p>}</>}
    {section === 'streams' && <><div className="admin-card"><label>{t('搜尋直播')}<input value={search} onChange={e => setSearch(e.target.value)}/></label><label>{t('選擇直播')}<select aria-label={t("選擇直播")} value={video} onChange={e => changeVideo(e.target.value)}><option value="">{t('請選擇直播／新增直播')}</option>{data.streams.filter(s => `${s.title} ${s.stream_date}`.toLowerCase().includes(search.toLowerCase()) || s.video_id === video).map(s => <option key={s.video_id} value={s.video_id}>{s.stream_date.slice(0, 10)} · {s.title}</option>)}</select></label>{stream && <p><Status value={stream.scan_status}/> {stream.scan_complete ? t('留言掃描完成') : c.scan}{stream.last_error && <Technical>{stream.last_error}</Technical>}</p>}</div>
      <nav className="admin-steps" aria-label={t('直播歌單')}>{(['基本資料', '整理歌曲', '檢查與發布'] as CopyKey[]).map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} disabled={!video && i > 0} onClick={() => setStep(i)}><span>{i + 1}</span>{t(label)}</button>)}</nav>
      <div hidden={step !== 0}><StreamForm key={stream ? recordKey(stream.video_id, stream.version) : `new-stream:${newEpoch}`} stream={stream} run={run} command={command} selected={id => { setVideo(id); setStep(1); }}/></div>
      {video && <><div hidden={step !== 1} className="admin-editor-layout"><aside><h3>{t('來源與圖片')}</h3>{!demo&&!data.evidence.some(e=>e.video_id===video)&&<p>{t('尚無來源。可加入圖片，或直接手動新增歌曲。')}</p>}{demo ? <DemoSources video={video} command={command} run={run}/> : <ImageImport key={video} video={video} evidence={data.evidence} command={command} run={run}/>}</aside><div><CandidateForm key={`new:${video}:${newEpoch}`} video={video} command={command} run={run}/></div></div>
      <div hidden={step === 0}><div className="admin-filters"><label>{t('搜尋歌曲')}<input value={songSearch} onChange={e => setSongSearch(e.target.value)}/></label><label>{t('全部狀態')}<select aria-label={t("全部狀態")} value={filter} onChange={e => setFilter(e.target.value)}><option value="">{t('全部狀態')}</option><option value="review">{t('待審')}</option><option value="published">{t('已發布')}</option><option value="rejected">{t('已排除')}</option></select></label></div><p className="admin-muted">{t('目前載入範圍')} · {filtered.length}</p>{!filtered.length && <p>{t('沒有符合搜尋條件的資料')}</p>}{candidates.map(c => <details hidden={!filtered.some(item=>item.id===c.id)} key={c.id} className="admin-song-item" open={step === 2 && filtered.length === 1}><summary><span>{c.position}. {c.name}<small>{c.artist || '—'} · {timestamp(c.timestamp_seconds)}</small></span><Status value={c.status}/></summary><p className="admin-checklist">{t(c.status==='published'?'這首已發布。請在下方演唱紀錄修改公開內容。':c.status==='rejected'?'已排除':!c.artist || c.timestamp_seconds === null ? '請補上歌手與演唱時間後再發布。' : !stream?.duration ? '請先補上影片長度，並確認演唱時間位於影片內。' : c.timestamp_seconds >= stream.duration ? '演唱時間必須位於影片長度內。' : '準備好發布')}</p>{c.status!=='published'&&<CandidateForm key={recordKey(c.id, c.version)} candidate={c} occupied={data.performances.some(p => p.video_id === c.video_id && p.position === c.position)} duration={stream?.duration} video={video} command={command} run={run}/>}</details>)}
      <h3>{t('演唱紀錄')}</h3>{data.performances.filter(p => p.video_id === video).map(p => <details key={p.id} className="admin-song-item"><summary>{p.position}. {data.songs.find(s => s.id === p.song_id)?.name} · {timestamp(p.timestamp_seconds)}</summary><PerformanceForm key={recordKey(p.id, p.version)} performance={p} songs={data.songs} command={command} run={run}/></details>)}</div></>}
    </>}
    {section === 'songs' && <SongManager selected={targetSong} setSelected={setTargetSong} recordKey={recordKey} songs={data.songs} aliases={data.aliases} command={command} run={run}/>}
    {section === 'management' && <><nav className="admin-tabs" aria-label={t('管理功能')}>{management.filter(([key]) => key !== 'members' || data.role === 'owner').map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => { if (tab !== key && !leave()) return; setTab(key); }}>{t(label)}</button>)}</nav>{tab === 'migration' ? demo ? <p>{t('展示模式：所有操作只修改假資料，不會寫入正式後台。')}</p> : <Migration owner={data.role === 'owner'} run={run}/> : <Management recordKey={recordKey} tab={tab} data={data} video={video} command={command} run={run}/>}</>}
    {demo && <details className="admin-card admin-demo-controls"><summary>{c.demoOptions}</summary><label>{c.demoRole}<select value={data.role} onChange={e => { if (!leave()) return; sample.current!.role = e.target.value as 'owner' | 'editor'; void reload(); }}><option value="editor">{c.editor}</option><option value="owner">{c.owner}</option></select></label><label>{c.demoScenario}<select value={scenario} onChange={e => setScenario(e.target.value)}><option value="normal">{c.normal}</option><option value="readFailure">{c.readFailure}</option><option value="timeout">{c.timeout}</option></select></label><button onClick={() => { if (!leave()) return; sample.current = demoDashboard(); setData(structuredClone(sample.current)); setVideo(''); setResult(null); setPending(null); setNewEpoch(n => n + 1); setScenario('normal'); setSection('home'); }}>{c.reset}</button><button onClick={() => setPreview(v => !v)}>{c.demoPublic}</button>{preview && projectStreams(data.streams, data.performances, data.songs).map(s => <div key={s.videoId}><h3>{s.title}</h3><p>{s.count ? `${c.count} ${s.count} ${s.count === 1 ? c.unitSingle : c.unit}` : c.empty}</p><ol>{s.songs.map(p => <li key={p.id}>{p.name} · {p.artist} · {p.version.timestamp}</li>)}</ol></div>)}</details>}
    </fieldset></>}
    </main></div>
    {confirmation && <ConfirmDialog detail={confirmation.detail} title={t(confirmation.title)} cancel={() => { confirmation.resolve(false); setConfirmation(null); }} accept={() => { confirmation.resolve(true); setConfirmation(null); }}/>}
  </section></DraftContext.Provider>;
}

function StreamForm({ stream: incoming, run, command, selected }: { stream?: Stream; run: Run; command: Command; selected: (id: string) => void }) {
  const stream = usePinned(incoming); const { t, lang } = useAdminCopy();
  const [invalid, setInvalid] = useState(false);
  return <DraftForm data-record={stream?.video_id} data-version={stream?.version} className="admin-card admin-grid" onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); const id = videoIdFromUrl(String(f.video)); if (!id) { setInvalid(true); (e.currentTarget.elements.namedItem('video') as HTMLInputElement).focus(); return; } setInvalid(false); run(async () => { await command('stream_save', { video_id: id, title: f.title, stream_date: f.date, duration: f.duration ? Number(f.duration) : null, version: stream?.version }); selected(id); }); }}><h2>{t(stream ? '編輯直播' : '新增直播')}</h2><p>{experienceCopy[lang].streamImpact}</p><label>{t('YouTube 網址')}<input name="video" required defaultValue={stream ? `https://www.youtube.com/watch?v=${stream.video_id}` : ''} readOnly={!!stream} aria-invalid={invalid} aria-describedby={invalid ? 'video-error' : undefined}/>{invalid && <span id="video-error" role="alert">{t('請提供有效的 YouTube 網址')}</span>}</label><label>{t('標題')}<input name="title" required defaultValue={stream?.title}/></label><label>{t('直播日期')}<input name="date" type="date" required defaultValue={stream?.stream_date.slice(0, 10)}/></label><label>{t('影片長度（秒）')}<input name="duration" type="number" min="1" defaultValue={stream?.duration || ''}/></label><button className="admin-primary">{t('儲存直播')}</button>{stream && <button type="button" onClick={() => run(() => command('stream_retry', { video_id: stream.video_id }))}>{t('重新排入留言掃描')}</button>}</DraftForm>;
}

function DemoSources({ video, command, run }: { video: string; command: Command; run: Run }) {
  const { t } = useAdminCopy(); const [text, setText] = useState('深海少女／ゆうゆ\nサンプル曲／Sample artist');
  return <div className="admin-card"><h3>{t('圖片辨識與校正')}</h3><div className="admin-demo-image" role="img" aria-label={t('原始 set list 圖片')}>SETLIST<br/>深海少女<br/>サンプル曲</div><button onClick={() => setText('深海少女／ゆうゆ\nサンプル曲／Sample artist')}>{t('執行免費 OCR')}</button><p>{t('展示模式：所有操作只修改假資料，不會寫入正式後台。')}</p><DraftForm data-record={`ocr:${video}`} onSubmit={e => { e.preventDefault(); run(() => command('source_ocr', { id: 'demo-source', video_id: video, songs: text.split('\n').filter(Boolean).map((line, i) => { const [name, artist = ''] = line.split('／'); return { position: i + 1, name, artist }; }) })); }}><OcrRows text={text} change={setText}/><details><summary>{t('整段文字編輯')}</summary><label>{t('校正結果（一行一首，可用「曲名／歌手」）')}<textarea rows={6} value={text} onChange={e => setText(e.target.value)}/></label></details><button disabled={!text.trim()}>{t('建立待審歌曲（不會自動發布）')}</button></DraftForm></div>;
}

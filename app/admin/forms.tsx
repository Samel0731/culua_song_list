'use client';
import { experienceCopy } from '@/utils/archive/experienceCopy';
import { useContext, useEffect, useState } from 'react';
import { browserClient } from '@/utils/archive/supabaseBrowser';
import { parseTimestamp } from '@/utils/archive/ingestion.mjs';
import type { Dashboard, Candidate, Song, Performance, Evidence, Alias } from '@/utils/archive/types';
import { boundedFetch } from '@/utils/archive/adminRequest.mjs';
import { useAdminCopy, DraftContext, DraftForm, readResponse, values, timestamp, Status, Technical, Comparison, usePinned, useDraftText, RecordPreview, OcrRows, type Command, type Run } from './ui';
export function CandidateForm({ candidate: incoming, video, command, run, duration, occupied = false }: {
    candidate?: Candidate;
    duration?:number|null;
    occupied?: boolean;
    video: string;
    command: Command;
    run: Run;
}) {
    const { t, lang } = useAdminCopy();
    const { known } = useAdminCopy();
    const c = usePinned(incoming);
    const [dirty, setDirty] = useState(false);
    const [invalid,setInvalid]=useState(false);
    const [newId] = useState(() => crypto.randomUUID());
    return <DraftForm data-record={c?.id} data-version={c?.version} className="admin-card admin-grid" onInput={() => setDirty(true)} onChange={() => setDirty(true)} onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); const seconds = f.time ? parseTimestamp(String(f.time)) : null; if (f.time && seconds === null){setInvalid(true);(e.currentTarget.elements.namedItem('time') as HTMLInputElement).focus();return;}setInvalid(false); run(() => command('candidate_save', { id: c?.id || newId, create: !c, version: c?.version, video_id: video, name: f.name, artist: f.artist, position: Number(f.position), timestamp_seconds: seconds })).then(ok => { if (ok)
        setDirty(false); }); }}>
    <h2>{c ? `${c.position}. ${c.name}` : t("新增歌曲候選")}</h2>{c && <p><Status value={c.status}/> {c.reasons.map(reason => <span key={reason} className="admin-reason">{known(reason)}</span>)}</p>}
    <label>{t("演唱順序")}<input name="position" type="number" min="1" required defaultValue={c?.position || 1}/></label><label>{t("曲名")}<input name="name" required maxLength={300} defaultValue={c?.name}/></label><label>{t("歌手")}<input name="artist" maxLength={300} defaultValue={c?.artist}/></label><label>{t("時間（可暫留空）")}<input name="time" placeholder="12:34" defaultValue={timestamp(c?.timestamp_seconds ?? null)} aria-invalid={invalid} aria-describedby={invalid ? `time-error-${newId}` : undefined}/>{invalid&&<span id={`time-error-${newId}`} role="alert">{t("時間格式需為 mm:ss 或 hh:mm:ss")}</span>}</label>
    {dirty && <p>{t("修改尚未儲存，請先儲存再發布。")}</p>}<button>{t("儲存待審內容")}</button>{c?.status === 'review' && <><p>{occupied ? (lang === 'zh' ? '演唱順序已被使用，請修改既有演唱或改用其他順序。' : lang === 'ja' ? '歌唱順が使用済みです。既存の記録を編集するか、別の順番にしてください。' : 'This position is already used. Edit the existing performance or choose another position.') : dirty || !c.artist.trim() || c.timestamp_seconds === null || !duration || c.timestamp_seconds >= duration ? experienceCopy[lang].blocked : experienceCopy[lang].ready}</p><button disabled={dirty || occupied || !c.name.trim() || !c.artist.trim() || c.timestamp_seconds === null || !duration || c.timestamp_seconds >= duration} type="button" onClick={() => run(() => command('candidate_publish', { id: c.id, version: c.version }))}>{t("發布已儲存版本")}</button><button disabled={dirty} type="button" onClick={() => run(() => command('candidate_reject', { id: c.id, version: c.version }))}>{t("排除此候選")}</button></>}
  </DraftForm>;
}
export function SongManager({ songs, aliases, command, run, recordKey, selected, setSelected }: {
    songs: Song[];
    selected: string;
    setSelected: (id: string) => void;
    recordKey:(id:string,version:number)=>string;
    aliases: Alias[];
    command: Command;
    run: Run;
}) {
    const { t, lang } = useAdminCopy();
    const [search, setSearch] = useState('');
    const song = songs.find(s => s.id === selected);
    const {leave}=useContext(DraftContext);
    return <><div className="admin-card"><label>{t("搜尋歌曲")}<input value={search} onChange={e => setSearch(e.target.value)}/></label><label>{t("歌曲")}<select aria-label={t("歌曲")} value={selected} onChange={e => {if(leave())setSelected(e.target.value);}}><option value="">{t("新增歌曲")}</option>{songs.filter(s => `${s.name} ${s.artist}`.toLowerCase().includes(search.toLowerCase())||s.id===selected).map(s => <option value={s.id} key={s.id}>{s.name} / {s.artist}</option>)}</select></label></div>
  <DraftForm data-record={song?.id} data-version={song?.version} className="admin-card admin-grid" key={song?recordKey(song.id,song.version):'new'} onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); run(async () => {const result=await command('song_save', { id: song?.id, version: song?.version, name: f.name, artist: f.artist });if(!song&&result&&typeof result==='object'&&'id' in result)setSelected(String(result.id));}); }}><h2>{t("歌曲正式名稱")}</h2><p>{experienceCopy[lang].impact}</p><label>{t("曲名")}<input name="name" required defaultValue={song?.name}/></label><label>{t("歌手")}<input name="artist" required defaultValue={song?.artist}/></label><button>{t("儲存名稱（舊網址會保留導向）")}</button></DraftForm>
  {song && <><DraftForm className="admin-card admin-grid" onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); run(() => command('alias_add', { song_id: song.id, name: f.name, artist: f.artist })); }}><h2>{t("核准別名")}</h2><p>{t("只有經人工核准的曲名與歌手組合才參與自動發布判定。")}</p><label>{t("別名曲名")}<input name="name" required/></label><label>{t("別名歌手")}<input name="artist" required/></label><button>{t("核准別名")}</button></DraftForm>{aliases.filter(a => a.song_id === song.id).map(a => <div key={a.id} className="admin-card"><p>{a.name} / {a.artist}{a.route_alias ? t("· 保留舊網址") : ''}</p>{!a.route_alias && <button onClick={() => run(() => command('alias_revoke', { id: a.id }))}>{t("撤銷別名核准")}</button>}</div>)}</>}</>;
}
export function PerformanceForm({ performance: incoming, songs, command, run }: {
    performance: Performance;
    songs: Song[];
    command: Command;
    run: Run;
}) {
    const { t, lang } = useAdminCopy();
    const p = usePinned(incoming);
    return <DraftForm data-record={p.id} data-version={p.version} className="admin-card admin-grid" onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); const seconds = parseTimestamp(String(f.time)); run(async () => { if (seconds === null)
        throw new Error("無效時間格式"); return command('performance_save', { id: p.id, version: p.version, song_id: f.song_id, timestamp_seconds: seconds, song_link: f.link, published: f.published === 'on' }); }); }}><h2>{t("演唱紀錄")} {p.position}</h2><p>{experienceCopy[lang].impact}</p><label>{t("歌曲")}<select name="song_id" defaultValue={p.song_id}>{songs.map(s => <option key={s.id} value={s.id}>{s.name} / {s.artist}</option>)}</select></label><label>{t("時間")}<input name="time" required defaultValue={timestamp(p.timestamp_seconds)}/></label><label>{t("歌曲連結")}<input name="link" type="url" defaultValue={p.song_link}/></label><label><input type="checkbox" name="published" defaultChecked={p.published}/>{t("公開此紀錄")}</label><button>{t("儲存演唱紀錄")}</button></DraftForm>;
}
export function ImageImport({ video, evidence, command, run }: {
    video: string;
    evidence: Evidence[];
    command: Command;
    run: Run;
}) {
    const { t } = useAdminCopy();
    const [source, setSource] = useState<Evidence | null>(null), [url, setUrl] = useState(''), [text, setText] = useState(''), [progress, setProgress] = useState<number | 'complete' | null>(null);
    const [attach, setAttach] = useState('');
    const [imageWarning,setImageWarning]=useState(false);
    const markText=useDraftText(`ocr:${video}`, '');
    const {leave}=useContext(DraftContext);
    const [imageRequest, setImageRequest] = useState(() => crypto.randomUUID());
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100, scale: 2, contrast: 150, invert: false });
    useEffect(() => () => { if (url.startsWith('blob:'))
        URL.revokeObjectURL(url); }, [url]);
    const open = async (e: Evidence) => { const signed = await readResponse(await boundedFetch(`/api/admin/images?id=${e.id}`, { cache: 'no-store' })); const res = await boundedFetch(signed.url); if (!res.ok)
        throw new Error("圖片讀取失敗"); setUrl(URL.createObjectURL(await res.blob())); setSource(e); setText(''); markText(''); };
    const recognize = async () => {
        const image = await createImageBitmap(await (await boundedFetch(url)).blob());
        const width = Math.min(crop.w, 100 - crop.x) * image.width / 100, height = Math.min(crop.h, 100 - crop.y) * image.height / 100;
        if (width <= 0 || height <= 0 || width * height * crop.scale ** 2 > 20000000) {
            image.close();
            throw new Error("裁切區域無效或圖片過大，請縮小倍率");
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * crop.scale);
        canvas.height = Math.round(height * crop.scale);
        const ctx = canvas.getContext('2d')!;
        ctx.filter = `grayscale(1) contrast(${crop.contrast}%) ${crop.invert ? 'invert(1)' : ''}`;
        ctx.drawImage(image, image.width * crop.x / 100, image.height * crop.y / 100, width, height, 0, 0, canvas.width, canvas.height);
        image.close();
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('jpn+eng', 1, { logger: m => setProgress(Math.round((m.progress || 0) * 100)) });
        try {
            const result = await worker.recognize(canvas);
            setText(result.data.text); markText(result.data.text);
            setProgress('complete');
        }
        finally {
            await worker.terminate();
        }
    };
    const saveImage = async (form: FormData) => {
        const file = form.get('file');
        if (file instanceof File && file.size) {
            if (file.size > 10 * 1024 * 1024)
                throw new Error("圖片超過 10 MB");
            const signed = await readResponse(await boundedFetch('/api/admin/images/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video, size: file.size, mime: file.type }) }));
            const uploaded = await browserClient().storage.from('archive-evidence').uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
            if (uploaded.error)
                throw new Error("圖片上傳失敗");
            form.delete('file');
            form.set('storagePath', signed.path);
        }
        else
            form.delete('file');
        const saved = await readResponse(await boundedFetch('/api/admin/images', { method: 'POST', body: form }));
        setAttach('');
        setImageRequest(crypto.randomUUID());
        if (saved.storage_path) {try{await open(saved);setImageWarning(false);}catch{setImageWarning(true);}}
    };
    return <>{imageWarning&&<p role="status">{t("來源已儲存，但圖片預覽失敗。請重新開啟圖片。")}</p>}<DraftForm className="admin-card admin-grid" onSubmit={e => { e.preventDefault(); const element=e.currentTarget; const form = new FormData(element); form.set('video', video); form.set('request_id', imageRequest); if (attach)
        form.set('sourceId', attach); run(() => saveImage(form)).then(ok=>{if(ok)element.reset();}); }}><h2>{t("提供 set list 圖片")}</h2><p>{t("目前綁定影片：")}{video}{t("。請確認貼文中的直播連結相同。")}</p><label>{t("補上既有貼文的圖片")}<select value={attach} onChange={e => setAttach(e.target.value)}><option value="">{t("建立新來源")}</option>{evidence.filter(e => e.video_id === video && e.kind === 'image' && !e.storage_path).map(e => <option key={e.id} value={e.id}>{e.source_url || e.id}</option>)}</select></label><label>{t("X 貼文網址")}<input name="post" type="url" placeholder="https://x.com/culua0211/status/…"/></label><label>{t("X 圖片直連")}<input name="imageUrl" type="url" placeholder="https://pbs.twimg.com/media/…"/></label><label>{t("或上傳圖片（PNG／JPEG，10 MB 以下）")}<input name="file" type="file" accept="image/png,image/jpeg"/></label><button>{t("儲存來源")}</button></DraftForm>
  {evidence.filter(e => e.video_id === video).map(e => <div key={e.id} className="admin-card"><p><Status value={e.kind}/> <Status value={e.status}/></p>{e.source_url && <a href={e.source_url} target="_blank" rel="noreferrer">{t("查看來源 ↗")}</a>}{e.raw_text && <details><summary>{t("留言內容")}</summary><pre>{e.raw_text}</pre></details>}{e.storage_path && <button onClick={() => {if(leave())run(() => open(e));}}>{t("開啟圖片並校正")}</button>}</div>)}
  {url && source && <div className="admin-card"><h2>{t("圖片辨識與校正")}</h2>
    {/* Private blob URLs are deliberately excluded from Next's public image optimizer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="admin-source-image" src={url} alt={t("原始 set list 圖片")}/>
    <details><summary>{t('進階辨識設定')}</summary><div className="admin-grid">{(['x', 'y', 'w', 'h', 'scale', 'contrast'] as const).map(key => <label key={key}>{({ x: t("左側起點 %"), y: t("上側起點 %"), w: t("裁切寬度 %"), h: t("裁切高度 %"), scale: t("放大倍率"), contrast: t("對比 %") })[key]}<input type="number" min={key === 'scale' ? 1 : key === 'w' || key === 'h' ? 1 : 0} max={key === 'scale' ? 4 : key === 'contrast' ? 300 : 100} value={crop[key]} onChange={e => setCrop({ ...crop, [key]: Number(e.target.value) })}/></label>)}</div><label><input type="checkbox" checked={crop.invert} onChange={e => setCrop({ ...crop, invert: e.target.checked })}/>{t("反轉明暗")}</label></details><button onClick={() => run(recognize)}>{t("執行免費 OCR")}</button><p role="status">{progress==='complete'?t("辨識完成，請校正後送審"):progress===null?'':`${t("辨識中…")} ${progress}%`}</p><p>{t("辨識結果僅供校正，不會推測歌手或演唱時間。")}</p><OcrRows text={text} change={value=>{setText(value);markText(value);}}/><details><summary>{t("整段文字編輯")}</summary><label>{t("校正結果（一行一首，可用「曲名／歌手」）")}<textarea rows={12} value={text} onChange={e => {setText(e.target.value); markText(e.target.value);}}/></label></details><button disabled={!text.trim()} onClick={() => run(() => command('source_ocr', { id: source.id, songs: text.split('\n').map(line => line.trim()).filter(Boolean).map((line, i) => { const [name, ...artist] = line.normalize('NFKC').split('/'); return { position: i + 1, name: name.trim(), artist: artist.join('/').trim() }; }) })).then(ok=>{if(ok)markText('');})}>{t("建立待審歌曲（不會自動發布）")}</button></div>}</>;
}
export function Migration({ owner, run }: {
    owner: boolean;
    run: Run;
}) {
    const { t } = useAdminCopy();
    const [restoreId, setRestoreId] = useState(() => crypto.randomUUID());
    const [restoreFile, setRestoreFile] = useState<File | null>(null), [restorePreview, setRestorePreview] = useState<{
        digest: string;
        revision: number;
        songs: number;
        performances: number;
        assets: number;
        created_at: string;
    } | null>(null);
    const [importId, setImportId] = useState(() => crypto.randomUUID());
    const [csv, setCsv] = useState(''), [preview, setPreview] = useState<{
        digest: string;
        counts: Record<string, number>;
        errors: string[];
        unavailable: unknown[];
        rows: unknown[];
    } | null>(null);
    return <><div className="admin-card"><h2>{t("匯出")}</h2><p>{t("匯出歌曲、演唱紀錄與待補資料；圖片及原始留言不會包含在協作者匯出中。")}</p><a href="/api/admin/export" download>{t("下載資料 JSON")}</a>{owner && <><p>{t("完整備份會加密，還原只允許擁有者執行。")}</p><a href="/api/admin/backup" download>{t("下載目前資料的加密備份")}</a><label>{t("預覽要還原的加密備份")}<input type="file" accept=".enc" onChange={e => { const file = e.target.files?.[0]; if (!file)
        return; setRestoreFile(file); setRestorePreview(null); setRestoreId(crypto.randomUUID()); run(async () => { const form = new FormData(); form.set('file', file); setRestorePreview(await readResponse(await boundedFetch('/api/admin/backup', { method: 'POST', body: form }))); }); }}/></label>{restorePreview && restoreFile && <><p>{t("還原會以此備份取代目前的內容資料，成員權限保留，自動發布重新進入試運轉。請先下載目前的備份。")}</p><dl className="admin-summary">{Object.entries(restorePreview).filter(([key]) => ['songs', 'performances', 'assets', 'created_at'].includes(key)).map(([key, value]) => <div key={key}><dt>{({ songs: t('歌曲'), performances: t('演唱紀錄'), assets: t('圖片'), created_at: t('時間') } as Record<string, string>)[key]}</dt><dd>{value}</dd></div>)}</dl><button onClick={() => run(async () => { const form = new FormData(); form.set('file', restoreFile); form.set('commit', 'true'); form.set('request_id', restoreId); form.set('digest', restorePreview.digest); form.set('revision', String(restorePreview.revision)); await readResponse(await boundedFetch('/api/admin/backup', { method: 'POST', body: form })); setRestorePreview(null); })}>{t("確認以此備份還原資料")}</button></>}</>}</div>
  {owner && <div className="admin-card"><h2>{t("首次匯入 Google Sheet")}</h2><p>{t("僅允許空的演唱資料庫匯入。請由 Sheet 下載 CSV；預覽不會修改資料。既有資料會在整批驗證成功後一次寫入。")}</p><label>Google Sheet CSV<input type="file" accept=".csv,text/csv" onChange={async (e) => { const file = e.target.files?.[0]; if (file) {
        setCsv(await file.text());
        setPreview(null);
        setImportId(crypto.randomUUID());
    } }}/></label><button disabled={!csv} onClick={() => run(async () => setPreview(await readResponse(await boundedFetch('/api/admin/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) }))))}>{t("預覽匯入")}</button>{preview && <><dl className="admin-summary">{Object.entries(preview.counts).map(([key, value]) => <div key={key}><dt>{({ songs: t('歌曲'), performances: t('演唱紀錄'), streams: t('直播歌單'), unavailable: t('舊資料待補') } as Record<string, string>)[key] || t('目前載入範圍')}</dt><dd>{value}</dd></div>)}</dl>{preview.errors.map(e => <div key={e} className="admin-warning"><p>{t("發生問題，請確認資料後再試一次。")}</p><Technical>{e}</Technical></div>)}<details><summary>{t("比對前 20 筆資料與播放時間")}</summary><RecordPreview rows={preview.rows.slice(0,20)}/></details>{preview.unavailable.length > 0 && <details><summary>{t("保留")}{preview.unavailable.length}{t("筆非公開待補資料")}</summary><RecordPreview rows={preview.unavailable}/></details>}<button disabled={preview.errors.length > 0} onClick={() => run(async () => { await readResponse(await boundedFetch('/api/admin/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv, commit: true, digest: preview.digest, request_id: importId }) })); setPreview(null); })}>{t("確認匯入上述資料")}</button></>}</div>}</>;
}
export function Management({ tab, data, command, run, recordKey }: {
    tab: string;
    recordKey:(id:string,version:number)=>string;
    data: Dashboard;
    video: string;
    command: Command;
    run: Run;
}) {
    const { t, lang } = useAdminCopy();
    const lastSuccess = data.jobs.find(j => j.status === 'success')?.finished_at;
    const [now]=useState(()=>Date.now());
    const stale = !lastSuccess || now - Date.parse(lastSuccess) > 48 * 3600000;
    return <>    {tab === 'unavailable' && <><p>{t("原始非公開紀錄保留於此。取得影片後，先建立直播與歌曲候選，再標記對應場次。")}</p>{!data.unavailable.length && <p role="status">{experienceCopy[lang].noLegacy}</p>}{data?.unavailable?.map(u => <DraftForm key={recordKey(u.id,u.version)} data-record={u.id} data-version={u.version} className="admin-card" onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); run(() => command('unavailable_resolve', { id: u.id, version: u.version, video_id: f.video_id || null })); }}><h2>{u.raw_data['曲名']} / {u.raw_data['アーティスト']}</h2><Technical>{JSON.stringify(u.raw_data, null, 2)}</Technical><label>{t("補至直播")}<select name="video_id" defaultValue={u.resolved_video_id || ''}><option value="">{t("尚未取得影片")}</option>{data.streams.map(s => <option key={s.video_id} value={s.video_id}>{s.stream_date} · {s.title}</option>)}</select></label><button>{t("儲存補完對應（原始紀錄保留）")}</button></DraftForm>)}</>}
    {tab === 'history' && <><p>{t("最近 100 筆修訂。還原歌曲、候選或演唱紀錄會建立新的修訂；來源與權限紀錄保留供查核。")}</p>{!data.revisions.length && <p role="status">{experienceCopy[lang].noHistory}</p>}{data?.revisions.map(r => <div key={r.id} className="admin-card"><p>{r.created_at} · {t("修改紀錄")} · {t(({songs:"歌曲",candidates:"待審",performances:"演唱紀錄",members:"成員",streams:"直播歌單",evidence:"來源與圖片",settings:"自動更新"} as const)[r.entity as "songs"] || "修改歷史")}<Technical>{r.action} · {r.entity} · {r.actor}</Technical>{t("· 操作者")}{r.actor || t("自動匯入")}</p><details><summary>{t("查看前後差異")}</summary><Comparison before={r.before_data} after={r.after_data}/></details>{r.before_data && ['songs', 'candidates', 'performances'].includes(r.entity) && <button onClick={() => run(async () => { const id = r.entity_id; const current = r.entity === 'songs' ? data.songs.find(s => s.id === id) : r.entity === 'candidates' ? data.candidates.find(s => s.id === id) : data.performances.find(s => s.id === id); if (!current)
        throw new Error("請先選擇這筆資料所屬直播"); return command('revision_restore', { revision_id: r.id, version: current.version }); })}>{t("還原修改前內容")}</button>}</div>)}</>}
    {tab === 'jobs' && <><div className="admin-card"><h2>{t("自動更新")}</h2><p className={stale ? 'admin-warning' : ''}>{lastSuccess ? lastSuccess : t("尚未有成功紀錄")}{stale ? t("；已超過 48 小時或尚未啟用，請檢查排程。") : ''}</p><p>{t("目前模式：")}{data?.settings.auto_publish ? t("符合共識的歌曲會自動發布") : t("試運轉，只建立待審候選")}</p>{data?.role === 'owner' && <button onClick={() => run(() => command('enable_auto_publish', { enabled: !data.settings.auto_publish }))}>{data?.settings.auto_publish ? t("暫停自動發布") : t("啟用自動發布（需滿 7 天試運轉）")}</button>}</div>{data?.jobs.map(j => <div className="admin-card" key={j.id}><p>{j.started_at} · <Status value={j.status}/></p><Technical>{JSON.stringify(j.details, null, 2)}</Technical></div>)}</>}
    {tab === 'members' && data?.role === 'owner' && <><DraftForm className="admin-card" onSubmit={e => { e.preventDefault(); const f = values(e.currentTarget); run(() => command('member_invite', { email: f.email })); }}><h2>{t("邀請協作者")}</h2><p>{t("加入後請將網站網址提供給本人。首次 Google 登入會綁定帳號；不會自動寄信。")}</p><label>{t("Google 信箱")}<input type="email" name="email" required/></label><button>{t("加入／重新啟用")}</button></DraftForm>{data.members.map(m => <div className="admin-card" key={m.id}><p>{m.email} · {t(m.role==='owner'?'擁有者':'協作者')} · {m.active ? t("有效") : t("已撤銷")} · {m.user_id ? t("已登入綁定") : t("待首次登入")}</p>{m.role !== 'owner' && m.active && <button onClick={() => run(() => command('member_revoke', { id: m.id }))}>{t("撤銷存取")}</button>}</div>)}</>}
    </>;
}

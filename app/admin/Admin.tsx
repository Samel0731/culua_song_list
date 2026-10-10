'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { browserClient } from '@/utils/archive/supabaseBrowser';
import { videoIdFromUrl, parseTimestamp } from '@/utils/archive/ingestion.mjs';
import type { Dashboard, Candidate, Song, Performance, Evidence, Alias } from '@/utils/archive/types';
import { boundedFetch, adminErrorMessage } from '@/utils/archive/adminRequest.mjs';
import './admin.css';

type Command=(command:string,input:Record<string,unknown>)=>Promise<unknown>;
async function readResponse(response:Response & {archiveWrite?:boolean;archiveRequestId?:string}) {
  const data=await response.json();
  if(!response.ok)throw Object.assign(new Error(adminErrorMessage(data.error)),{current:data.current,status:response.status,uncertain:response.archiveWrite&&response.status>=500,requestId:response.archiveRequestId});
  return data;
}
function values(form:HTMLFormElement) {return Object.fromEntries(new FormData(form));}
function timestamp(value:number|null){return value===null?'':`${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;}

export default function Admin({authenticated,allowed}:{authenticated:boolean;allowed:boolean}) {
  const [data,setData]=useState<Dashboard|null>(null),[video,setVideo]=useState(''),[tab,setTab]=useState('review');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[conflict,setConflict]=useState<{draft:unknown;current:unknown}|null>(null);
  const [pending,setPending]=useState<string|null>(null);
  const lastWrite=useRef<Record<string,unknown>|null>(null);
  const retrying=useRef(false);
  const pendingWork=useRef<(()=>Promise<unknown>)|null>(null);
  const loadSequence=useRef(0);
  const load=useCallback(async()=>{const sequence=++loadSequence.current;const response=await boundedFetch(`/api/admin${video?`?video=${video}`:''}`,{cache:'no-store'});const fresh=await readResponse(response);if(sequence===loadSequence.current)setData(fresh);},[video]);
  useEffect(()=>{if(allowed)load().catch(e=>setMessage(e.message));},[allowed,load]);
  const run=async(work:()=>Promise<unknown>)=>{
    setBusy(true);setMessage('');setConflict(null);pendingWork.current=work;
    let completed=false;
    try {await work();completed=true;setPending(null);setMessage('操作完成');await load();}
    catch(e){
      const error=e as Error & {current?:unknown;status?:number;uncertain?:boolean;requestId?:string};
      setMessage(completed?'已儲存，清單更新失敗。請重新讀取資料。':error.message||'操作失敗');
      if(error.status===409)setConflict({draft:lastWrite.current,current:error.current||{deleted:true}});
      if(error.uncertain)setPending(error.requestId||String(lastWrite.current?.request_id||''));else setPending(null);
    }
    finally{setBusy(false);}
  };
  const command:Command=async(command,input)=>{
    const request_id=retrying.current&&lastWrite.current?.request_id?String(lastWrite.current.request_id):crypto.randomUUID();
    lastWrite.current={command,...input,request_id};
    try {return await readResponse(await boundedFetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command,input:{...input,request_id}})}));}
    catch(e){const error=e as Error & {status?:number;uncertain?:boolean;requestId?:string};if(!error.status||error.status>=500){error.uncertain=true;error.requestId=request_id;}throw error;}
  };
  const confirmPending=async()=>{
    setBusy(true);
    try {
      const result=await readResponse(await boundedFetch(`/api/admin?request=${pending}`,{cache:'no-store'}));
      if(!result.found){setMessage('目前尚無已提交結果；操作可能仍在執行，請稍後再次確認。');return;}
      setPending(null);setMessage('已確認操作完成。');
      try {await load();}catch{setMessage('已確認操作完成，清單更新失敗。請重新讀取資料。');}
    }catch(e){setMessage(e instanceof Error?e.message:'確認失敗');}finally{setBusy(false);}
  };
  const login=async()=>{try {const result=await browserClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback`,scopes:'openid email profile'}});if(result.error)throw result.error;}catch(e){setMessage(e instanceof Error?e.message:'登入失敗');}};
  if(!authenticated)return <section className="admin-shell"><p className="admin-eyebrow">CULUA FAN ARCHIVE</p><h1>共同維護歌單</h1><p>使用受邀的 Google 帳號登入，新增歌曲、校正圖片辨識與發布直播歌單。</p><button onClick={login}>使用 Google 登入</button><p role="status">{message}</p></section>;
  if(!allowed)return <section className="admin-shell"><h1>此帳號尚未受邀</h1><p>請由網站擁有者將你的 Google 信箱加入協作者名單，再重新登入。</p><button onClick={async()=>{await browserClient().auth.signOut();window.location.reload();}}>登出</button></section>;
  const stream=data?.streams.find(s=>s.video_id===video);
  const lastSuccess=data?.jobs.find(j=>j.status==='success')?.finished_at;
  const stale=!lastSuccess || Date.now()-Date.parse(lastSuccess)>48*3600000;
  return <section className="admin-shell">
    <div className="admin-heading"><div><p className="admin-eyebrow">CULUA FAN ARCHIVE / 管理</p><h1>歌單工作台</h1></div><button onClick={async()=>{await browserClient().auth.signOut();window.location.reload();}}>登出</button></div>
    <p>{data?`你目前是${data.role==='owner'?'擁有者':'協作者'}。公開網站只會顯示已發布的演唱紀錄。`:'正在載入角色與資料…'}</p>
    <div role="status" className="admin-message">{busy?'處理中…':message}</div>
    {pending&&<div role="alert"><p>操作結果尚未確認。識別碼：{pending}</p><button disabled={busy||!pending} onClick={confirmPending}>確認操作結果</button><button disabled={busy||!pendingWork.current} onClick={async()=>{const work=pendingWork.current;if(!work)return;retrying.current=true;try{await run(work);}finally{retrying.current=false;}}}>以同一識別碼重試</button></div>}
    <button disabled={busy} onClick={async()=>{try{await load();setMessage('資料已重新讀取');}catch(e){setMessage(e instanceof Error?e.message:'讀取失敗');}}}>重新讀取資料</button>
    {!!conflict && <div role="alert" className="admin-conflict"><p>資料已更新或刪除。你的草稿尚未儲存，請比對後載入最新資料並重新確認。</p><h3>你的草稿</h3><pre>{JSON.stringify(conflict.draft,null,2)}</pre><h3>目前版本</h3><pre>{JSON.stringify(conflict.current,null,2)}</pre><button onClick={async()=>{try{await load();setMessage('已載入最新版本，請依上方草稿重新確認。');}catch(e){setMessage(e instanceof Error?e.message:'讀取失敗');}}}>載入最新資料</button></div>}
    <nav className="admin-tabs" aria-label="管理功能">{[['review','直播與審核'],['images','圖片與 OCR'],['songs','歌曲與別名'],['performances','演唱紀錄'],['unavailable','舊資料待補'],['history','修改歷史'],['jobs','工作狀態'],['migration','匯出與匯入'],...(data?.role==='owner'?[['members','成員']]:[])].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    {['review','images','performances'].includes(tab)&&<div className="admin-card"><label>選擇直播<select value={video} onChange={e=>setVideo(e.target.value)}><option value="">請選擇直播／新增直播</option>{data?.streams.map(s=><option key={s.video_id} value={s.video_id}>{s.stream_date} · {s.title}</option>)}</select></label>
      {stream&&<p>{stream.scan_status} · {stream.scan_complete?'留言掃描完成':'歌單尚未補齊'} · {stream.last_error||'無讀取錯誤'}</p>}
    </div>}
    <fieldset disabled={busy||!!pending||!data} className="admin-work">
    {tab==='review'&&<>
      <form className="admin-card admin-grid" key={stream?`${stream.video_id}:${stream.version}`:'new'} onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);const id=videoIdFromUrl(String(f.video));if(!id){setMessage('請提供有效的 YouTube 網址');return;}run(async()=>{await command('stream_save',{video_id:id,title:f.title,stream_date:f.date,duration:f.duration?Number(f.duration):null,version:stream?.version});setVideo(id);});}}>
        <h2>{stream?'編輯直播':'新增直播'}</h2><label>YouTube 網址<input name="video" required defaultValue={stream?`https://www.youtube.com/watch?v=${stream.video_id}`:''} readOnly={!!stream}/></label><label>標題<input name="title" required defaultValue={stream?.title}/></label><label>直播日期<input name="date" type="date" required defaultValue={stream?.stream_date.slice(0,10)}/></label><label>影片長度（秒）<input name="duration" type="number" min="1" defaultValue={stream?.duration||''}/></label><button>儲存直播</button>{stream&&<button type="button" onClick={()=>run(()=>command('stream_retry',{video_id:video}))}>重新排入留言掃描</button>}
      </form>
      {video&&<CandidateForm key={`new:${video}`} video={video} command={command} run={run}/>}
      {video&&data?.candidates.filter(c=>c.video_id===video).map(c=><CandidateForm key={`${c.id}:${c.version}`} candidate={c} video={video} command={command} run={run}/>)}
      {!video&&<p>選擇或新增直播，再開始審核歌曲。</p>}
    </>}
    {tab==='images'&&video&&<ImageImport key={video} video={video} evidence={data?.evidence||[]} command={command} run={run}/>}
    {tab==='songs'&&<SongManager songs={data?.songs||[]} aliases={data?.aliases||[]} command={command} run={run}/>}
    {tab==='unavailable'&&<><p>原始非公開紀錄保留於此。取得影片後，先建立直播與歌曲候選，再標記對應場次。</p>{data?.unavailable?.map(u=><form key={`${u.id}:${u.version}`} className="admin-card" onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);run(()=>command('unavailable_resolve',{id:u.id,version:u.version,video_id:f.video_id||null}));}}><h2>{u.raw_data['曲名']} / {u.raw_data['アーティスト']}</h2><pre>{JSON.stringify(u.raw_data,null,2)}</pre><label>補至直播<select name="video_id" defaultValue={u.resolved_video_id||''}><option value="">尚未取得影片</option>{data.streams.map(s=><option key={s.video_id} value={s.video_id}>{s.stream_date} · {s.title}</option>)}</select></label><button>儲存補完對應（原始紀錄保留）</button></form>)}</>}
    {tab==='performances'&&video&&data?.performances.filter(p=>p.video_id===video).map(p=><PerformanceForm key={`${p.id}:${p.version}`} performance={p} songs={data.songs} command={command} run={run}/>)}
    {tab==='history'&&<><p>最近 100 筆修訂。還原歌曲、候選或演唱紀錄會建立新的修訂；來源與權限紀錄保留供查核。</p>{data?.revisions.map(r=><div key={r.id} className="admin-card"><p>{r.created_at} · {r.action} · {r.entity} · 操作者 {r.actor||'自動匯入'}</p><details><summary>查看前後差異</summary><pre>{JSON.stringify({before:r.before_data,after:r.after_data},null,2)}</pre></details>{r.before_data&&['songs','candidates','performances'].includes(r.entity)&&<button onClick={()=>run(async()=>{const id=r.entity_id;const current=r.entity==='songs'?data.songs.find(s=>s.id===id):r.entity==='candidates'?data.candidates.find(s=>s.id===id):data.performances.find(s=>s.id===id);if(!current)throw new Error('請先選擇這筆資料所屬直播');return command('revision_restore',{revision_id:r.id,version:current.version});})}>還原修改前內容</button>}</div>)}</>}
    {tab==='jobs'&&<><div className="admin-card"><h2>自動更新</h2><p className={stale?'admin-warning':''}>{lastSuccess?`上次成功：${lastSuccess}`:'尚未有成功紀錄'}{stale?'；已超過 48 小時或尚未啟用，請檢查排程。':''}</p><p>目前模式：{data?.settings.auto_publish?'符合共識的歌曲會自動發布':'試運轉，只建立待審候選'}</p>{data?.role==='owner'&&<button onClick={()=>run(()=>command('enable_auto_publish',{enabled:!data.settings.auto_publish}))}>{data?.settings.auto_publish?'暫停自動發布':'啟用自動發布（需滿 7 天試運轉）'}</button>}</div>{data?.jobs.map(j=><div className="admin-card" key={j.id}><p>{j.started_at} · {j.status}</p><pre>{JSON.stringify(j.details,null,2)}</pre></div>)}</>}
    {tab==='members'&&data?.role==='owner'&&<><form className="admin-card" onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);run(()=>command('member_invite',{email:f.email}));}}><h2>邀請協作者</h2><p>加入後請將網站網址提供給本人。首次 Google 登入會綁定帳號；不會自動寄信。</p><label>Google 信箱<input type="email" name="email" required/></label><button>加入／重新啟用</button></form>{data.members.map(m=><div className="admin-card" key={m.id}><p>{m.email} · {m.role} · {m.active?'有效':'已撤銷'} · {m.user_id?'已登入綁定':'待首次登入'}</p>{m.role!=='owner'&&m.active&&<button onClick={()=>run(()=>command('member_revoke',{id:m.id}))}>撤銷存取</button>}</div>)}</>}
    {tab==='migration'&&<Migration owner={data?.role==='owner'} run={run}/>}
    </fieldset>
  </section>;
}

function CandidateForm({candidate:c,video,command,run}:{candidate?:Candidate;video:string;command:Command;run:(work:()=>Promise<unknown>)=>Promise<void>}) {
  const [dirty,setDirty]=useState(false);
  const [newId]=useState(()=>crypto.randomUUID());
  return <form className="admin-card admin-grid" onInput={()=>setDirty(true)} onChange={()=>setDirty(true)} onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);const seconds=f.time?parseTimestamp(String(f.time)):null;if(f.time&&seconds===null)return run(async()=>{throw new Error('時間格式需為 mm:ss 或 hh:mm:ss');});run(()=>command('candidate_save',{id:c?.id||newId,create:!c,version:c?.version,video_id:video,name:f.name,artist:f.artist,position:Number(f.position),timestamp_seconds:seconds}));}}>
    <h2>{c?`${c.position}. ${c.name}`:'新增歌曲候選'}</h2>{c&&<p>{c.status} · {c.reasons.join('；')}{c.source_id?` · 來源 ${c.source_id}`:''}</p>}
    <label>演唱順序<input name="position" type="number" min="1" required defaultValue={c?.position||1}/></label><label>曲名<input name="name" required maxLength={300} defaultValue={c?.name}/></label><label>歌手<input name="artist" maxLength={300} defaultValue={c?.artist}/></label><label>時間（可暫留空）<input name="time" placeholder="12:34" defaultValue={timestamp(c?.timestamp_seconds??null)}/></label>
    {dirty&&<p>修改尚未儲存，請先儲存再發布。</p>}<button>儲存待審內容</button>{c?.status==='review'&&<><button disabled={dirty} type="button" onClick={()=>run(()=>command('candidate_publish',{id:c.id,version:c.version}))}>發布已儲存版本</button><button disabled={dirty} type="button" onClick={()=>run(()=>command('candidate_reject',{id:c.id,version:c.version}))}>排除此候選</button></>}
  </form>;
}

function SongManager({songs,aliases,command,run}:{songs:Song[];aliases:Alias[];command:Command;run:(work:()=>Promise<unknown>)=>Promise<void>}) {
  const [selected,setSelected]=useState(''),[search,setSearch]=useState('');const song=songs.find(s=>s.id===selected);
  return <><div className="admin-card"><label>搜尋歌曲<input value={search} onChange={e=>setSearch(e.target.value)}/></label><label>歌曲<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">新增歌曲</option>{songs.filter(s=>`${s.name} ${s.artist}`.toLowerCase().includes(search.toLowerCase())).map(s=><option value={s.id} key={s.id}>{s.name} / {s.artist}</option>)}</select></label></div>
  <form className="admin-card admin-grid" key={`${selected}:${song?.version}`} onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);run(()=>command('song_save',{id:song?.id,version:song?.version,name:f.name,artist:f.artist}));}}><h2>歌曲正式名稱</h2><label>曲名<input name="name" required defaultValue={song?.name}/></label><label>歌手<input name="artist" required defaultValue={song?.artist}/></label><button>儲存名稱（舊網址會保留導向）</button></form>
  {song&&<><form className="admin-card admin-grid" onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);run(()=>command('alias_add',{song_id:song.id,name:f.name,artist:f.artist}));}}><h2>核准別名</h2><p>只有經人工核准的曲名與歌手組合才參與自動發布判定。</p><label>別名曲名<input name="name" required/></label><label>別名歌手<input name="artist" required/></label><button>核准別名</button></form>{aliases.filter(a=>a.song_id===song.id).map(a=><div key={a.id} className="admin-card"><p>{a.name} / {a.artist}{a.route_alias?' · 保留舊網址':''}</p>{!a.route_alias&&<button onClick={()=>run(()=>command('alias_revoke',{id:a.id}))}>撤銷別名核准</button>}</div>)}</>}</>;
}

function PerformanceForm({performance:p,songs,command,run}:{performance:Performance;songs:Song[];command:Command;run:(work:()=>Promise<unknown>)=>Promise<void>}) {
  return <form className="admin-card admin-grid" onSubmit={e=>{e.preventDefault();const f=values(e.currentTarget);const seconds=parseTimestamp(String(f.time));run(async()=>{if(seconds===null)throw new Error('無效時間格式');return command('performance_save',{id:p.id,version:p.version,song_id:f.song_id,timestamp_seconds:seconds,song_link:f.link,published:f.published==='on'});});}}><h2>第 {p.position} 首演唱紀錄</h2><label>歌曲<select name="song_id" defaultValue={p.song_id}>{songs.map(s=><option key={s.id} value={s.id}>{s.name} / {s.artist}</option>)}</select></label><label>時間<input name="time" required defaultValue={timestamp(p.timestamp_seconds)}/></label><label>歌曲連結<input name="link" type="url" defaultValue={p.song_link}/></label><label><input type="checkbox" name="published" defaultChecked={p.published}/>公開此紀錄</label><button>儲存演唱紀錄</button></form>;
}

function ImageImport({video,evidence,command,run}:{video:string;evidence:Evidence[];command:Command;run:(work:()=>Promise<unknown>)=>Promise<void>}) {
  const [source,setSource]=useState<Evidence|null>(null),[url,setUrl]=useState(''),[text,setText]=useState(''),[progress,setProgress]=useState('');
  const [attach,setAttach]=useState('');
  const [imageRequest,setImageRequest]=useState(()=>crypto.randomUUID());
  const [crop,setCrop]=useState({x:0,y:0,w:100,h:100,scale:2,contrast:150,invert:false});
  useEffect(()=>()=>{if(url.startsWith('blob:'))URL.revokeObjectURL(url);},[url]);
  const open=async(e:Evidence)=>{const signed=await readResponse(await boundedFetch(`/api/admin/images?id=${e.id}`,{cache:'no-store'}));const res=await boundedFetch(signed.url);if(!res.ok)throw new Error('圖片讀取失敗');setUrl(URL.createObjectURL(await res.blob()));setSource(e);setText('');};
  const recognize=async()=>{
    const image=await createImageBitmap(await (await boundedFetch(url)).blob());
    const width=Math.min(crop.w,100-crop.x)*image.width/100,height=Math.min(crop.h,100-crop.y)*image.height/100;
    if(width<=0||height<=0||width*height*crop.scale**2>20000000){image.close();throw new Error('裁切區域無效或圖片過大，請縮小倍率');}
    const canvas=document.createElement('canvas');canvas.width=Math.round(width*crop.scale);canvas.height=Math.round(height*crop.scale);
    const ctx=canvas.getContext('2d')!;ctx.filter=`grayscale(1) contrast(${crop.contrast}%) ${crop.invert?'invert(1)':''}`;
    ctx.drawImage(image,image.width*crop.x/100,image.height*crop.y/100,width,height,0,0,canvas.width,canvas.height);image.close();
    const {createWorker}=await import('tesseract.js');
    const worker=await createWorker('jpn+eng',1,{logger:m=>setProgress(`${m.status} ${Math.round((m.progress||0)*100)}%`)});
    try {const result=await worker.recognize(canvas);setText(result.data.text);setProgress('辨識完成，請校正後送審');}finally{await worker.terminate();}
  };
  const saveImage=async(form:FormData)=>{
    const file=form.get('file');
    if(file instanceof File&&file.size) {
      if(file.size>10*1024*1024)throw new Error('圖片超過 10 MB');
      const signed=await readResponse(await boundedFetch('/api/admin/images/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({video,size:file.size,mime:file.type})}));
      const uploaded=await browserClient().storage.from('archive-evidence').uploadToSignedUrl(signed.path,signed.token,file,{contentType:file.type});
      if(uploaded.error)throw new Error('圖片上傳失敗');
      form.delete('file');form.set('storagePath',signed.path);
    } else form.delete('file');
    const saved=await readResponse(await boundedFetch('/api/admin/images',{method:'POST',body:form}));setAttach('');setImageRequest(crypto.randomUUID());if(saved.storage_path)await open(saved);
  };
  return <><form className="admin-card admin-grid" onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);form.set('video',video);form.set('request_id',imageRequest);if(attach)form.set('sourceId',attach);run(()=>saveImage(form));}}><h2>提供 set list 圖片</h2><p>目前綁定影片：{video}。請確認貼文中的直播連結相同。</p><label>補上既有貼文的圖片<select value={attach} onChange={e=>setAttach(e.target.value)}><option value="">建立新來源</option>{evidence.filter(e=>e.video_id===video&&e.kind==='image'&&!e.storage_path).map(e=><option key={e.id} value={e.id}>{e.source_url||e.id}</option>)}</select></label><label>X 貼文網址<input name="post" type="url" placeholder="https://x.com/culua0211/status/…"/></label><label>X 圖片直連<input name="imageUrl" type="url" placeholder="https://pbs.twimg.com/media/…"/></label><label>或上傳圖片（PNG／JPEG，10 MB 以下）<input name="file" type="file" accept="image/png,image/jpeg"/></label><button>儲存來源</button></form>
  {evidence.filter(e=>e.video_id===video).map(e=><div key={e.id} className="admin-card"><p>{e.id} · {e.kind} · {e.status}</p>{e.source_url&&<a href={e.source_url} target="_blank" rel="noreferrer">查看來源 ↗</a>}{e.raw_text&&<details><summary>留言內容</summary><pre>{e.raw_text}</pre></details>}{e.storage_path&&<button onClick={()=>run(()=>open(e))}>開啟圖片並校正</button>}</div>)}
  {url&&source&&<div className="admin-card"><h2>圖片辨識與校正</h2>
    {/* Private blob URLs are deliberately excluded from Next's public image optimizer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="admin-source-image" src={url} alt="原始 set list 圖片"/>
    <div className="admin-grid">{(['x','y','w','h','scale','contrast'] as const).map(key=><label key={key}>{({x:'左側起點 %',y:'上側起點 %',w:'裁切寬度 %',h:'裁切高度 %',scale:'放大倍率',contrast:'對比 %'})[key]}<input type="number" min={key==='scale'?1:key==='w'||key==='h'?1:0} max={key==='scale'?4:key==='contrast'?300:100} value={crop[key]} onChange={e=>setCrop({...crop,[key]:Number(e.target.value)})}/></label>)}</div><label><input type="checkbox" checked={crop.invert} onChange={e=>setCrop({...crop,invert:e.target.checked})}/>反轉明暗</label><button onClick={()=>run(recognize)}>執行免費 OCR</button><p role="status">{progress}</p><label>校正結果（一行一首，可用「曲名／歌手」）<textarea rows={12} value={text} onChange={e=>setText(e.target.value)}/></label><button onClick={()=>run(()=>command('source_ocr',{id:source.id,songs:text.split('\n').map(line=>line.trim()).filter(Boolean).map((line,i)=>{const [name,...artist]=line.normalize('NFKC').split('/');return {position:i+1,name:name.trim(),artist:artist.join('/').trim()};})}))}>建立待審歌曲（不會自動發布）</button></div>}</>;
}

function Migration({owner,run}:{owner:boolean;run:(work:()=>Promise<unknown>)=>Promise<void>}) {
  const [restoreId,setRestoreId]=useState(()=>crypto.randomUUID());
  const [restoreFile,setRestoreFile]=useState<File|null>(null),[restorePreview,setRestorePreview]=useState<{digest:string;revision:number;songs:number;performances:number;assets:number;created_at:string}|null>(null);
  const [importId,setImportId]=useState(()=>crypto.randomUUID());
  const [csv,setCsv]=useState(''),[preview,setPreview]=useState<{digest:string;counts:Record<string,number>;errors:string[];unavailable:unknown[];rows:unknown[]}|null>(null);
  return <><div className="admin-card"><h2>匯出</h2><p>匯出歌曲、演唱紀錄與待補資料；圖片及原始留言不會包含在協作者匯出中。</p><a href="/api/admin/export" download>下載資料 JSON</a>{owner&&<><p>完整備份會加密，還原只允許擁有者執行。</p><a href="/api/admin/backup" download>下載目前資料的加密備份</a><label>預覽要還原的加密備份<input type="file" accept=".enc" onChange={e=>{const file=e.target.files?.[0];if(!file)return;setRestoreFile(file);setRestorePreview(null);setRestoreId(crypto.randomUUID());run(async()=>{const form=new FormData();form.set('file',file);setRestorePreview(await readResponse(await boundedFetch('/api/admin/backup',{method:'POST',body:form})));});}}/></label>{restorePreview&&restoreFile&&<><p>還原會以此備份取代目前的內容資料，成員權限保留，自動發布重新進入試運轉。請先下載目前的備份。</p><pre>{JSON.stringify(restorePreview,null,2)}</pre><button onClick={()=>run(async()=>{const form=new FormData();form.set('file',restoreFile);form.set('commit','true');form.set('request_id',restoreId);form.set('digest',restorePreview.digest);form.set('revision',String(restorePreview.revision));await readResponse(await boundedFetch('/api/admin/backup',{method:'POST',body:form}));setRestorePreview(null);})}>確認以此備份還原資料</button></>}</>}</div>
  {owner&&<div className="admin-card"><h2>首次匯入 Google Sheet</h2><p>僅允許空的演唱資料庫匯入。請由 Sheet 下載 CSV；預覽不會修改資料。既有資料會在整批驗證成功後一次寫入。</p><label>Google Sheet CSV<input type="file" accept=".csv,text/csv" onChange={async e=>{const file=e.target.files?.[0];if(file){setCsv(await file.text());setPreview(null);setImportId(crypto.randomUUID());}}}/></label><button disabled={!csv} onClick={()=>run(async()=>setPreview(await readResponse(await boundedFetch('/api/admin/sheet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csv})}))))}>預覽匯入</button>{preview&&<><pre>{JSON.stringify(preview.counts,null,2)}</pre>{preview.errors.map(e=><p key={e} className="admin-warning">{e}</p>)}<details><summary>比對前 20 筆資料與播放時間</summary><pre>{JSON.stringify(preview.rows.slice(0,20),null,2)}</pre></details>{preview.unavailable.length>0&&<details><summary>保留 {preview.unavailable.length} 筆非公開待補資料</summary><pre>{JSON.stringify(preview.unavailable,null,2)}</pre></details>}<button disabled={preview.errors.length>0} onClick={()=>run(async()=>{await readResponse(await boundedFetch('/api/admin/sheet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csv,commit:true,digest:preview.digest,request_id:importId})}));setPreview(null);})}>確認匯入上述資料</button></>}</div>}</>;
}

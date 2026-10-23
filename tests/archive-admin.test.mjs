import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import * as ingestion from '../utils/archive/ingestion.mjs';
import * as requests from '../utils/archive/adminRequest.mjs';
const require=createRequire(import.meta.url);
let oauth;
const modules=new Map();
const repo=fileURLToPath(new URL('../',import.meta.url));
function loadModule(filename) {
  if(modules.has(filename))return modules.get(filename).exports;
  const mod={exports:{}};modules.set(filename,mod);
  const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const resolver=name=>{
    if(name.endsWith('.css'))return {};
    if(name.includes('adminRequest'))return requests;
    if(name.includes('supabaseBrowser'))return {browserClient:()=>({auth:{signInWithOAuth:async options=>{oauth=options;return {};},signOut:async()=>({})}})};
    if(name.includes('ingestion'))return ingestion;
    if(name.startsWith('.')||name.startsWith('@/')){
      const base=name.startsWith('@/')?path.join(repo,name.slice(2)):path.resolve(path.dirname(filename),name);
      const target=['.tsx','.ts'].map(ext=>base+ext).find(f=>fs.existsSync(f));
      if(target)return loadModule(target);
    }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(resolver,mod,mod.exports);
  return mod.exports;
}
const Admin=loadModule(path.join(repo,'app/admin/Admin.tsx')).default;
const {LanguageProvider}=loadModule(path.join(repo,'context/LanguageContext.tsx'));
const dashboard=role=>({role,streams:[{video_id:'GzB_HSosjw8',title:'歌枠',stream_date:'2026-09-08',duration:4414,version:1,scan_status:'ready',scan_complete:true}],songs:[],aliases:[],unavailable:[],performances:[],evidence:[],candidates:[{id:'candidate',video_id:'GzB_HSosjw8',position:1,name:'深海少女',artist:'ゆうゆ',timestamp_seconds:753,status:'review',reasons:[],version:2}],members:[{id:'owner',email:'owner@example.com',role:'owner',active:true}],revisions:[],jobs:[],settings:{auto_publish:false,dry_run_started_at:'2026-10-10'}});
async function mount(props,role='editor') {
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:3000'});
  const prior={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,FormData:globalThis.FormData,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.FormData=dom.window.FormData;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  window.confirm=()=>true;
  window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  const calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(dashboard(role)),{headers:{'Content-Type':'application/json'}});};
  const root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Admin,props))));
  return {dom,calls,close:async()=>{window.localStorage.clear();await act(async()=>window.dispatchEvent(new window.StorageEvent('storage',{key:'app-language'})));await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,prior);}};
}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
async function chooseStream(){
  await act(async()=>button('開始整理直播').click());
  const select=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='GzB_HSosjw8'));
  await act(async()=>{select.value='GzB_HSosjw8';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
  await act(async()=>button('3檢查與發布').click());
}
const candidateForm=()=>document.querySelector('form[data-record="candidate"]');

test('four menu sections have distinct titles, content and focus in every language',async()=>{
 const {translate}=loadModule(path.join(repo,'app/admin/copy.ts'));
 for(const lang of ['zh','ja','en']) {
  const app=await mount({authenticated:true,allowed:true,demo:true});
  try {
   const language=document.querySelector('.admin-shell select[aria-label="Language"]');
   await act(async()=>{language.value=lang;language.dispatchEvent(new window.Event('change',{bubbles:true}));});
   for(const [name,feature]of [['工作台','開始整理直播'],['直播歌單','新增直播'],['歌曲資料','歌曲正式名稱'],['管理','舊資料待補']]) {
    const nav=[...document.querySelectorAll('#admin-navigation button')].find(b=>b.textContent===translate(lang,name));
    await act(async()=>nav.click());
    assert.equal(document.getElementById('admin-page-title').textContent,translate(lang,name));
    assert.match(document.querySelector('.admin-main').textContent,new RegExp(translate(lang,feature)));
    assert.equal(document.querySelector('#admin-navigation [aria-current="page"]'),nav);
    if(name!=='工作台')assert.equal(document.activeElement,document.getElementById('admin-page-title'));
    const fieldset=document.querySelector('fieldset');assert.equal(fieldset.lastElementChild.classList.contains('admin-demo-controls'),true);
   }
  }finally{await app.close();}
 }
});

test('saved confirmation stays in its own section and reappears when returning',async()=>{
 const app=await mount({authenticated:true,allowed:true,demo:true});
 try {
  await act(async()=>button('歌曲資料').click());const form=button('儲存名稱（舊網址會保留導向）').closest('form');
  form.elements.namedItem('name').value='Scoped song';form.elements.namedItem('artist').value='Artist';
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.match(document.getElementById('saved-result').textContent,/Scoped song/);
  for(const menu of ['工作台','直播歌單','管理']){await act(async()=>button(menu).click());assert.equal(document.getElementById('saved-result'),null);}
  await act(async()=>button('歌曲資料').click());assert.match(document.getElementById('saved-result').textContent,/Scoped song/);
 }finally{await app.close();}
});

test('quality reads every page and rejects incomplete scans instead of showing zero', async()=>{
 const {readAll}=loadModule(path.join(repo,'utils/archive/readAll.ts'));
 const {inspectQuality}=loadModule(path.join(repo,'utils/archive/quality.ts'));
 const source=Array.from({length:1002},(_,i)=>({id:`c${i}`,video_id:'GzB_HSosjw8',name:'Song',artist:'',timestamp_seconds:null,position:i+1,status:'review',reasons:[]}));
 const ranges=[];const rows=await readAll(async(a,b)=>{ranges.push([a,b]);return {data:source.slice(a,b+1),error:null};});
 assert.equal(rows.length,1002);assert.equal(ranges.length,2);
 const data=dashboard('editor');data.candidates=rows;data.performances=[{video_id:'GzB_HSosjw8',position:1,published:true}];
 data.unavailable=[{id:'resolved',resolved_video_id:'GzB_HSosjw8',raw_data:{}},{id:'open',resolved_video_id:null,raw_data:{}}];
 const report=inspectQuality(data);
 assert.equal(report.records,1003);assert.equal(report.counts.artist,1002);assert.equal(report.counts.position,1);assert.equal(report.counts.legacy,1);
 data.candidates[0].status='rejected';assert.equal(inspectQuality(data).counts.position,0);
 await assert.rejects(readAll(async(a,b)=>({data:a?null:source.slice(a,b+1),error:a?new Error('offline'):null})),/incomplete/);
});

test('public projection includes newest empty stream but never unpublished rows or private fields',()=>{
 const {projectStreams}=loadModule(path.join(repo,'utils/archive/publicStreams.ts'));
 const streams=[{video_id:'oldstream01',title:'Old',stream_date:'2026-10-01',last_error:'secret'},{video_id:'newstream01',title:'New',stream_date:'2026-10-13',storage_path:'private'}];
 const performances=[{id:'a',video_id:'oldstream01',position:2,song_id:'song',timestamp_seconds:90,song_link:'',published:true},{id:'b',video_id:'oldstream01',position:1,song_id:'song',timestamp_seconds:30,song_link:'',published:true},{id:'secret',video_id:'newstream01',position:1,song_id:'song',timestamp_seconds:0,published:false}];
 const projected=projectStreams(streams,performances,[{id:'song',name:'Test',artist:'Artist',email:'secret'}]);
 assert.equal(projected[0].videoId,'newstream01');assert.equal(projected[0].count,0);
 assert.deepEqual(projected[1].songs.map(p=>p.position),[1,2]);assert.doesNotMatch(JSON.stringify(projected),/secret|storage_path|last_error|email/);
});

test('timeout receipt locates a newly created song without a second write',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try {
  await act(async()=>button('歌曲資料').click());
  const form=button('儲存名稱（舊網址會保留導向）').closest('form');
  form.elements.namedItem('name').value='Receipt song';form.elements.namedItem('artist').value='Artist';
  let posts=0;
  const song={id:'receipt-song',name:'Receipt song',artist:'Artist',version:1};
  globalThis.fetch=async(url,options)=>{if(options?.method==='POST'){posts++;throw new Error('timeout');}if(String(url).includes('?request='))return new Response(JSON.stringify({found:true,result:song}));const data=dashboard('editor');data.songs=[song];return new Response(JSON.stringify(data));};
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  await act(async()=>button('確認操作結果').click());
  assert.equal(posts,1);assert.equal(document.querySelector('select[aria-label="歌曲"]').value,song.id);
  assert.match(document.getElementById('saved-result').textContent,/Receipt song/);
 }finally{await app.close();}
});

test('saved stream receipt remains inspectable when reload fails',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try {
  await act(async()=>button('開始整理直播').click());
  const form=button('儲存直播').closest('form');form.elements.namedItem('video').value='https://youtu.be/newstream01';form.elements.namedItem('title').value='New stream';form.elements.namedItem('date').value='2026-10-13';
  globalThis.fetch=async(url,options)=>{if(options?.method==='POST')return new Response(JSON.stringify({video_id:'newstream01',title:'New stream',stream_date:'2026-10-13',duration:null,version:1,scan_status:'pending',scan_complete:false}));throw new Error('read failed');};
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.match(document.getElementById('saved-result').textContent,/New stream/);
  assert.match(document.body.textContent,/已儲存，清單更新失敗/);
 }finally{await app.close();}
});

test('confirming a timed-out new candidate clears the create form and retains the saved record',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try {
  await act(async()=>button('開始整理直播').click());
  const select=document.querySelector('select[aria-label="選擇直播"]');
  await act(async()=>{select.value='GzB_HSosjw8';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
  await act(async()=>button('2整理歌曲').click());
  const form=[...document.querySelectorAll('form')].find(f=>f.textContent.includes('新增歌曲候選'));
  form.elements.namedItem('name').value='New candidate';let candidate;let posts=0;
  globalThis.fetch=async(url,options)=>{
   if(options?.method==='POST'){posts++;const {input}=JSON.parse(options.body);candidate={...input,status:'review',source_id:null,reasons:[],human_edited:true,version:1};throw new Error('timeout');}
   if(String(url).includes('?request='))return new Response(JSON.stringify({found:true,result:candidate}));
   const data=dashboard('editor');data.candidates.push(candidate);return new Response(JSON.stringify(data));
  };
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  await act(async()=>button('確認操作結果').click());
  const nextForm=[...document.querySelectorAll('form')].find(f=>f.textContent.includes('新增歌曲候選'));
  assert.notEqual(nextForm,form);assert.equal(nextForm.elements.namedItem('name').value,'');assert.equal(posts,1);
  assert.match(document.getElementById('saved-result').textContent,/New candidate/);
  assert.equal(document.getElementById('saved-result').querySelector('a'),null);
  assert.equal(document.querySelector('.admin-warning'),null);
 }finally{await app.close();}
});

test('an occupied setlist position disables publishing and explains the repair',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try {
  globalThis.fetch=async()=>{const data=dashboard('editor');data.performances=[{id:'p',video_id:'GzB_HSosjw8',position:1,song_id:'song',timestamp_seconds:20,published:true,version:1}];return new Response(JSON.stringify(data));};
  await chooseStream();assert.equal(button('發布已儲存版本').disabled,true);
  assert.match(candidateForm().textContent,/演唱順序已被使用/);
 }finally{await app.close();}
});

test('continue editing after publication focuses the public performance rather than a hidden candidate',async()=>{
 const app=await mount({authenticated:true,allowed:true,demo:true});
 try {
  await act(async()=>button('開始整理直播').click());
  const select=document.querySelector('select[aria-label="選擇直播"]');
  await act(async()=>{select.value='DEMOstream1';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
  await act(async()=>button('3檢查與發布').click());
  await act(async()=>button('發布已儲存版本').click());
  assert.doesNotMatch(document.getElementById('saved-result').textContent,/發布前/);
  await act(async()=>button('繼續編輯').click());
  assert.match(document.activeElement.closest('form').textContent,/演唱紀錄/);
 }finally{await app.close();}
});
test('Google login uses basic identity scopes; uninvited user gets no content controls',async()=>{
  const app=await mount({authenticated:false,allowed:false});
  try{await act(async()=>button('使用 Google 登入').click());assert.equal(oauth.provider,'google');assert.equal(oauth.options.scopes,'openid email profile');assert.equal(app.calls.length,0);}finally{await app.close();}
  const denied=await mount({authenticated:true,allowed:false});
  try{assert.match(document.body.textContent,/此帳號尚未受邀/);assert.equal(denied.calls.length,0);}finally{await denied.close();}
});

test('all three languages preserve stream selection and an unsaved candidate',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  await chooseStream();
  const form=candidateForm(),input=form.elements.namedItem('name');input.value='手動の下書き';
  await act(async()=>input.dispatchEvent(new window.Event('input',{bubbles:true})));
  const language=document.querySelector('select[aria-label="Language"]');
  for(const [lang,label] of [['ja','保存済みの内容を公開'],['en','Publish saved version'],['zh','發布已儲存版本']]){
   await act(async()=>{language.value=lang;language.dispatchEvent(new window.Event('change',{bubbles:true}));});
   assert.equal(candidateForm(),form);assert.equal(input.value,'手動の下書き');assert.equal(button(label).disabled,true);
   assert.equal(document.documentElement.lang,lang==='zh'?'zh-Hant':lang);
  }
 }finally{await app.close();}
});

test('refresh keeps dirty values and their original version; successful save unlocks publication',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  await chooseStream();let current=dashboard('editor');let writes=[];
  const form=candidateForm(),input=form.elements.namedItem('name');input.value='Local edit';
  await act(async()=>input.dispatchEvent(new window.Event('input',{bubbles:true})));
  current.candidates[0].version=3;current.candidates[0].name='Remote edit';
  globalThis.fetch=async(url,options)=>{
   if(options?.method==='POST'){const body=JSON.parse(options.body);writes.push(body);current.candidates[0]={...current.candidates[0],...body.input,version:4};return new Response('{}');}
   return new Response(JSON.stringify(current));
  };
  await act(async()=>button('重新讀取資料').click());
  assert.equal(candidateForm(),form);assert.equal(input.value,'Local edit');
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(writes[0].input.version,2);assert.equal(writes[0].input.name,'Local edit');
  assert.equal(button('發布已儲存版本').disabled,false);assert.equal(candidateForm().elements.namedItem('name').value,'Local edit');
 }finally{await app.close();}
});

test('unconfirmed writes retry the captured payload with exactly the same request ID',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  await chooseStream();const form=candidateForm();form.elements.namedItem('name').value='Captured draft';let bodies=[];
  globalThis.fetch=async(url,options)=>{
   if(options?.method==='POST'){bodies.push(JSON.parse(options.body));if(bodies.length===1)return new Response(JSON.stringify({error:'upstream request timeout'}),{status:504});return new Response('{}');}
   if(String(url).includes('?request='))return new Response('{"found":false}');
   return new Response(JSON.stringify(dashboard('editor')));
  };
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(document.querySelector('fieldset').disabled,true);
  await act(async()=>button('確認操作結果').click());assert.equal(bodies.length,1);
  await act(async()=>button('以同一識別碼重試').click());
  assert.equal(bodies.length,2);assert.deepEqual(bodies[0],bodies[1]);
 }finally{await app.close();}
});

test('a dirty deleted candidate remains visible and cannot be silently recreated',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  await chooseStream();const form=candidateForm();form.elements.namedItem('name').value='Keep deleted draft';
  await act(async()=>form.elements.namedItem('name').dispatchEvent(new window.Event('input',{bubbles:true})));
  let sent;globalThis.fetch=async(url,options)=>{if(options?.method==='POST'){sent=JSON.parse(options.body);return new Response(JSON.stringify({error:'Candidate no longer exists',current:{deleted:true}}),{status:409});}const fresh=dashboard('editor');fresh.candidates=[];return new Response(JSON.stringify(fresh));};
  await act(async()=>button('重新讀取資料').click());assert.equal(candidateForm(),form);
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(sent.input.create,false);assert.equal(sent.input.id,'candidate');assert.ok(!button('重新確認並儲存'));
  assert.equal(form.elements.namedItem('name').value,'Keep deleted draft');
 }finally{await app.close();}
});

test('navigation cancellation keeps a dirty draft and its stream',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  await chooseStream();const form=candidateForm();
  await act(async()=>form.elements.namedItem('name').dispatchEvent(new window.Event('input',{bubbles:true})));
  let prompts=0;window.confirm=()=>{prompts++;return false;};
  await act(async()=>button('歌曲資料').click());assert.equal(candidateForm(),form);assert.equal(prompts,1);
 }finally{await app.close();}
});

test('publication is blocked for unknown duration and timestamps outside the video',async()=>{
 for(const duration of [null,500]){
  const app=await mount({authenticated:true,allowed:true});
  try{
   globalThis.fetch=async()=>{const fresh=dashboard('editor');fresh.streams[0].duration=duration;return new Response(JSON.stringify(fresh));};
   await chooseStream();assert.equal(button('發布已儲存版本').disabled,true);
   assert.match(document.body.textContent,duration===null?/請先補上影片長度/:/演唱時間必須位於影片長度內/);
  }finally{await app.close();}
 }
});

test('explicit conflict review adopts the server version only for the next save',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  await chooseStream();const form=candidateForm();form.elements.namedItem('name').value='Reviewed draft';let bodies=[];let fresh=dashboard('editor');
  await act(async()=>form.elements.namedItem('name').dispatchEvent(new window.Event('input',{bubbles:true})));
  globalThis.fetch=async(url,options)=>{if(options?.method==='POST'){const body=JSON.parse(options.body);bodies.push(body);if(bodies.length===1)return new Response(JSON.stringify({error:'Version conflict',current:{version:3,name:'Remote change'}}),{status:409});fresh.candidates[0]={...fresh.candidates[0],...body.input,version:body.input.version+1};return new Response('{}');}return new Response(JSON.stringify(fresh));};
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  await act(async()=>button('重新確認並儲存').click());assert.equal(bodies.length,1);
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(bodies[1].input.version,3);
  const next=candidateForm();await act(async()=>next.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(bodies[2].input.version,4);
 }finally{await app.close();}
});

test('a malformed success response for a write remains unconfirmed',async()=>{
 const {readResponse}=loadModule(path.join(repo,'app/admin/ui.tsx'));
 const response=Object.assign(new Response('not JSON'),{archiveWrite:true,archiveRequestId:'receipt-id'});
 await assert.rejects(readResponse(response),error=>error.uncertain===true&&error.requestId==='receipt-id');
});

test('consecutive song edits use the refreshed version rather than a stale form version',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try{
  let fresh=dashboard('editor');fresh.songs=[{id:'song',name:'Original',artist:'Artist',version:1}];const bodies=[];
  globalThis.fetch=async(url,options)=>{if(options?.method==='POST'){const body=JSON.parse(options.body);bodies.push(body);fresh.songs[0]={...fresh.songs[0],...body.input,version:body.input.version+1};return new Response(JSON.stringify(fresh.songs[0]));}return new Response(JSON.stringify(fresh));};
  await act(async()=>button('重新讀取資料').click());await act(async()=>button('歌曲資料').click());
  const select=document.querySelector('select[aria-label="歌曲"]');
  await act(async()=>{select.value='song';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
  for(const name of ['First edit','Second edit']){
   const form=document.querySelector('form[data-record="song"]');form.elements.namedItem('name').value=name;
   await act(async()=>form.elements.namedItem('name').dispatchEvent(new window.Event('input',{bubbles:true})));
   await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  }
  assert.deepEqual(bodies.map(body=>body.input.version),[1,2]);
 }finally{await app.close();}
});

test('demo setlist creation and publication never call live APIs',async()=>{
 const app=await mount({authenticated:true,allowed:true,demo:true});
 try{
  globalThis.fetch=async()=>{throw new Error('Demo must not fetch');};
  await act(async()=>button('開始整理直播').click());
  const select=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='DEMOstream1'));
  await act(async()=>{select.value='DEMOstream1';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
  await act(async()=>button('3檢查與發布').click());await act(async()=>button('發布已儲存版本').click());
  assert.match(document.body.textContent,/已發布/);assert.equal(app.calls.length,0);
  await act(async()=>button('管理').click());await act(async()=>button('匯出與匯入').click());
  assert.equal(document.querySelector('a[href^="/api/admin"]'),null);
 }finally{await app.close();}
});
test('editor gets content workflow and export; owner alone gets membership and restore controls',async()=>{
  for(const role of ['editor','owner']){
    const app=await mount({authenticated:true,allowed:true},role);
    try{
      await act(async()=>button('管理').click());
      assert.equal(!!button('成員'),role==='owner');
      await act(async()=>button('匯出與匯入').click());
      assert.ok(document.querySelector('a[href="/api/admin/export"]'));
      assert.equal(!!document.querySelector('a[href="/api/admin/backup"]'),role==='owner');
      assert.equal(document.body.textContent.includes('首次匯入 Google Sheet'),role==='owner');
    }finally{await app.close();}
  }
});
test('unsaved candidate changes disable publication; publish submits the saved version',async()=>{
  const app=await mount({authenticated:true,allowed:true});
  try {
    await chooseStream();
    const publish=button('發布已儲存版本');assert.ok(publish);assert.equal(publish.disabled,false);
    await act(async()=>publish.click());
    const request=app.calls.find(c=>c.options?.method==='POST');const sent=JSON.parse(request.options.body);assert.equal(sent.command,'candidate_publish');assert.equal(sent.input.id,'candidate');assert.equal(sent.input.version,2);assert.match(sent.input.request_id,/^[a-f0-9-]{36}$/);
    const form=button('發布已儲存版本').closest('form');
    await act(async()=>form.querySelector('input[name="name"]').dispatchEvent(new window.Event('input',{bubbles:true})));
    assert.equal(button('發布已儲存版本').disabled,true);assert.match(form.textContent,/修改尚未儲存/);
  }finally{await app.close();}
});


test('successful save followed by failed reload keeps the draft and unlocks controls',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try {
  await chooseStream();
  const form=candidateForm();form.elements.namedItem('name').value='Draft survives';
  globalThis.fetch=async(url,options)=>{if(options?.method==='POST')return new Response('{}');throw new Error('Reload unavailable');};
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.match(document.body.textContent,/已儲存，清單更新失敗/);
  assert.equal(form.elements.namedItem('name').value,'Draft survives');
  assert.equal(document.querySelector('fieldset').disabled,false);
 }finally{await app.close();}
});

test('409 preserves submitted draft and exposes current version without a second write',async()=>{
 const app=await mount({authenticated:true,allowed:true});
 try {
  await chooseStream();
  const form=candidateForm();form.elements.namedItem('name').value='Local draft';let writes=0;
  globalThis.fetch=async()=>{writes++;return new Response(JSON.stringify({error:'Version conflict',current:{version:3,name:'Remote change'}}),{status:409});};
  await act(async()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
  assert.match(document.body.textContent,/Local draft/);assert.match(document.body.textContent,/Remote change/);
  assert.equal(writes,1);assert.equal(form.elements.namedItem('name').value,'Local draft');
 }finally{await app.close();}
});

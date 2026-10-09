import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import * as ingestion from '../utils/archive/ingestion.mjs';
const require=createRequire(import.meta.url);
const code=ts.transpileModule(fs.readFileSync(new URL('../app/admin/Admin.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
let oauth;
const mod={exports:{}};
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(name=>name.endsWith('.css')?{}:name.includes('supabaseBrowser')?{browserClient:()=>({auth:{signInWithOAuth:async options=>{oauth=options;return {};},signOut:async()=>({})}})}:name.includes('ingestion')?ingestion:require(name),mod,mod.exports);
const Admin=mod.exports.default;
const dashboard=role=>({role,streams:[{video_id:'GzB_HSosjw8',title:'歌枠',stream_date:'2026-09-08',duration:4414,version:1,scan_status:'ready',scan_complete:true}],songs:[],performances:[],evidence:[],candidates:[{id:'candidate',video_id:'GzB_HSosjw8',position:1,name:'深海少女',artist:'ゆうゆ',timestamp_seconds:753,status:'review',reasons:[],version:2}],members:[{id:'owner',email:'owner@example.com',role:'owner',active:true}],revisions:[],jobs:[],settings:{auto_publish:false,dry_run_started_at:'2026-10-10'}});
async function mount(props,role='editor') {
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:3000'});
  const prior={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,FormData:globalThis.FormData,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.FormData=dom.window.FormData;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify(dashboard(role)),{headers:{'Content-Type':'application/json'}});};
  const root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(Admin,props)));
  return {dom,calls,close:async()=>{await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,prior);}};
}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
test('Google login uses basic identity scopes; uninvited user gets no content controls',async()=>{
  const app=await mount({authenticated:false,allowed:false});
  try{await act(async()=>button('使用 Google 登入').click());assert.equal(oauth.provider,'google');assert.equal(oauth.options.scopes,'openid email profile');assert.equal(app.calls.length,0);}finally{await app.close();}
  const denied=await mount({authenticated:true,allowed:false});
  try{assert.match(document.body.textContent,/此帳號尚未受邀/);assert.equal(denied.calls.length,0);}finally{await denied.close();}
});
test('editor gets content workflow and export; owner alone gets membership and restore controls',async()=>{
  for(const role of ['editor','owner']){
    const app=await mount({authenticated:true,allowed:true},role);
    try{
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
    const select=document.querySelector('select');
    await act(async()=>{select.value='GzB_HSosjw8';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
    const publish=button('發布已儲存版本');assert.ok(publish);assert.equal(publish.disabled,false);
    await act(async()=>publish.click());
    const request=app.calls.find(c=>c.options?.method==='POST');assert.deepEqual(JSON.parse(request.options.body),{command:'candidate_publish',input:{id:'candidate',version:2}});
    const form=button('發布已儲存版本').closest('form');
    await act(async()=>form.querySelector('input[name="name"]').dispatchEvent(new window.Event('input',{bubbles:true})));
    assert.equal(button('發布已儲存版本').disabled,true);assert.match(form.textContent,/修改尚未儲存/);
  }finally{await app.close();}
});

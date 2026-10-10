import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundedFetch,adminErrorMessage,rpcFailure} from '../utils/archive/adminRequest.mjs';

test('deadline bounds a transport that ignores abort; writes remain uncertain',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=()=>new Promise(()=>{});
 try {
  await assert.rejects(boundedFetch('/api/admin',{},15),error=>!error.uncertain&&/讀取逾時/.test(error.message));
  await assert.rejects(boundedFetch('/api/admin',{method:'POST',body:JSON.stringify({input:{request_id:'fixed-request'}})},15),error=>error.uncertain&&error.requestId==='fixed-request');
 }finally{globalThis.fetch=previous;}
});
test('completed fetch clears its deadline and error messages are actionable',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>new Response('{}');
 try{assert.equal((await boundedFetch('/api/admin',{},15)).status,200);}finally{globalThis.fetch=previous;}
 assert.match(adminErrorMessage('Artist and timestamp required'),/歌手.*時間/);
 assert.match(adminErrorMessage('Candidate no longer exists'),/不能重新建立/);
});

test('deadline also bounds a response body that never completes',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response(new ReadableStream({start(){}}));
 try{await assert.rejects(boundedFetch('/api/admin',{},15),/讀取逾時/);}
 finally{globalThis.fetch=previous;}
});

test('RPC business conflicts are terminal and transport failures remain uncertain',()=>{
 assert.deepEqual(rpcFailure({code:'PT409',message:'Version conflict',details:'{"version":2}'}).current,{version:2});
 assert.equal(rpcFailure({code:'PT409',message:'Version conflict'}).status,409);
 assert.equal(rpcFailure({code:'40001',message:'serialization failure'}).status,503);
 assert.equal(rpcFailure({code:'',message:'Error: fetch failed'}).status,504);
 assert.equal(rpcFailure({code:'57014',message:'statement timeout'}).status,504);
 assert.equal(rpcFailure({code:'42501',message:'Forbidden'}).status,403);
});

test('sheet and restore responses retain their fixed request identity, unlike previews',async()=>{
 const previous=globalThis.fetch;globalThis.fetch=async()=>new Response('{"error":"unavailable"}',{status:504});
 try {
  const write=await boundedFetch('/api/admin/sheet',{method:'POST',body:JSON.stringify({commit:true,request_id:'sheet-fixed'})});
  assert.equal(write.archiveWrite,true);assert.equal(write.archiveRequestId,'sheet-fixed');
  const form=new FormData();form.set('commit','true');form.set('request_id','restore-fixed');
  const restore=await boundedFetch('/api/admin/backup',{method:'POST',body:form});
  assert.equal(restore.archiveWrite,true);assert.equal(restore.archiveRequestId,'restore-fixed');
  const preview=await boundedFetch('/api/admin/sheet',{method:'POST',body:'{}'});
  assert.equal(preview.archiveWrite,false);
 }finally{globalThis.fetch=previous;}
});

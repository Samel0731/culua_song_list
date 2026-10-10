export const adminErrorMessages = {
  'Artist and timestamp required': '請補上歌手與演唱時間後再發布。',
  'Valid stream duration required': '請先補上影片長度，並確認演唱時間位於影片內。',
  'Invalid timestamp': '演唱時間必須位於影片長度內。',
  'Version conflict': '資料已由其他人更新，請比對最新版本後重新確認。',
  'Candidate no longer exists': '此候選已不存在，舊修改不能重新建立資料。',
  'Request identity mismatch': '請求識別碼與內容不一致，請重新載入。',
  'Seven-day dry run is required': '需完成至少七天試運轉才能啟用自動發布。',
};
export function adminErrorMessage(message) {
  if (/statement timeout|lock timeout|upstream request timeout/i.test(message || '')) return '服務等待逾時，請先確認操作結果。';
  return adminErrorMessages[message] || message || '操作失敗';
}

export function rpcFailure(error) {
  const timeout=['57014','55P03'].includes(error.code)||/逾時|timeout|fetch failed/i.test(error.message||'');
  const status=error.code==='PT409'?409:error.code==='42501'?403:timeout?504:!error.code||error.code==='40001'?503:400;
  let current;
  if(status===409){try{current=JSON.parse(error.details);}catch{}}
  return {status,current,message:adminErrorMessage(error.message)};
}

// A deadline bounds the caller's wait even when a transport ignores AbortSignal.
// It does not prove a database transaction was cancelled.
function requestInfo(url,options) {
 let write=Boolean(options.method&&!['GET','HEAD'].includes(options.method.toUpperCase()));
 let requestId;
 try{const body=JSON.parse(options.body);requestId=body.request_id||body.input?.request_id;if(String(url).includes('/sheet')&&!body.commit)write=false;}catch{}
 if(typeof FormData!=='undefined'&&options.body instanceof FormData){requestId=options.body.get('request_id');if(String(url).includes('/backup')&&options.body.get('commit')!=='true')write=false;}
 if(String(url).includes('/images/upload'))write=false;
 return {write,requestId};
}
export async function boundedFetch(url, options = {}, timeoutMs) {
  const longOperation = /\/api\/admin\/(sheet|backup)(?:\?|$)/.test(String(url));
  const limit = timeoutMs ?? (longOperation ? 60000 : 20000);
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  let timer;
  const {write,requestId}=requestInfo(url,options);
  try {
    return await Promise.race([
      (async()=>{const response=await fetch(url,{...options,signal});await response.clone().arrayBuffer();return Object.assign(response,{archiveWrite:write,archiveRequestId:requestId});})(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(Object.assign(new Error(write ? '等待逾時，操作結果尚未確認。請先查詢結果，勿另建重複資料。' : '讀取逾時，保留最後成功的資料。'), { uncertain: Boolean(write), requestId }));
        }, limit);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

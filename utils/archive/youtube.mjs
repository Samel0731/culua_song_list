export class YouTubeError extends Error {
  constructor(message, reason, status) {super(message);this.reason=reason;this.status=status;}
}
export class BudgetExceeded extends Error {}
export function isoDuration(value) {
  const m=String(value).match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return m?Number(m[1]||0)*86400+Number(m[2]||0)*3600+Number(m[3]||0)*60+Number(m[4]||0):null;
}
export function youtubeClient(key,{fetcher=fetch,maxUnits=500,maxMs=600000,now=Date.now}={}) {
  let units=0;const started=now();
  const check=()=>{if(units>=maxUnits || now()-started>=maxMs)throw new BudgetExceeded('本輪執行預算已用完');};
  const get=async(resource,params)=>{
    for(let attempt=0;attempt<3;attempt++) {
      check();units++;
      const url=new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
      for(const [name,value] of Object.entries({...params,key}))if(value!==null&&value!==undefined)url.searchParams.set(name,String(value));
      try {
        const response=await fetcher(url,{signal:AbortSignal.timeout(15000)});
        const data=await response.json();
        if(response.ok)return data;
        const reason=data.error?.errors?.[0]?.reason || 'unknown';
        const error=new YouTubeError(`YouTube ${response.status}: ${reason}`,reason,response.status);
        if(response.status!==429&&response.status<500)throw error;
        if(attempt===2)throw error;
      }catch(error) {
        if(error instanceof YouTubeError && error.status!==429&&error.status<500)throw error;
        if(attempt===2)throw error;
      }
      await new Promise(resolve=>setTimeout(resolve,250*2**attempt));
    }
  };
  return {get,check,get units(){return units;}};
}

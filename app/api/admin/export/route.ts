import { requireMember } from '@/utils/archive/supabaseServer';
import { apiError } from '@/utils/archive/api';
export async function GET() {
  try {
    const {db}=await requireMember();
    const data:Record<string,unknown>={format:1,exported_at:new Date().toISOString()};
    for(const table of ['songs','aliases','streams','candidates','performances','unavailable']) {
      const rows=[];
      for(let start=0;;start+=1000) {
        const page=await db.from(`archive_${table}`).select('*').order(table==='streams'?'video_id':'id').range(start,start+999);
        if(page.error)throw new Error(page.error.message);rows.push(...page.data);if(page.data.length<1000)break;
      }
      data[table]=rows;
    }
    return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="culua-export.json"','Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}

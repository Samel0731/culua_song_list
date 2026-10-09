/** Remove abandoned signed uploads; never remove an asset referenced by evidence. */
export async function cleanupUploads(db,check=()=>{}) {
  const referenced=new Set();
  for(let offset=0;;offset+=1000) {
    check();const page=await db.from('archive_evidence').select('storage_path').not('storage_path','is',null).order('id').range(offset,offset+999);
    if(page.error)throw new Error(page.error.message);for(const row of page.data)referenced.add(row.storage_path);if(page.data.length<1000)break;
  }
  const bucket=db.storage.from('archive-evidence');let removed=0;
  async function walk(prefix,depth) {
    for(let offset=0;;) {
      check();const page=await bucket.list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
      if(page.error)throw new Error(page.error.message);
      const expired=[];
      for(const item of page.data) {
        const path=prefix?`${prefix}/${item.name}`:item.name;
        if(!item.id&&depth<2)await walk(path,depth+1);
        else if(item.id&&!referenced.has(path)&&Date.parse(item.created_at)<Date.now()-86400000)expired.push(path);
      }
      if(expired.length){const response=await bucket.remove(expired);if(response.error)throw new Error(response.error.message);removed+=expired.length;}
      if(page.data.length<1000)break;
      offset+=page.data.length-expired.length;
    }
  }
  await walk('',0);return removed;
}

import { readFile,writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { collectBackup,encryptBackup,decryptBackup,restoreAssets } from '../utils/archive/backup.mjs';
const [command,path]=process.argv.slice(2);
if(!['backup','restore','inspect'].includes(command)||!path)throw new Error('Usage: node scripts/archive-backup.mjs backup|restore|inspect FILE');
const secret=process.env.ARCHIVE_BACKUP_KEY;
if(command==='inspect') {
  const data=decryptBackup(await readFile(path),secret);console.log({created_at:data.created_at,songs:data.songs.length,performances:data.performances.length,assets:data.assets.length});
} else {
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  if(command==='backup') {
    const data=await collectBackup(db);await writeFile(path,encryptBackup(data,secret));console.log('Encrypted backup saved');
  } else {
    // Service key may upload assets, but cannot invoke restore; an active owner JWT is required.
    const ownerToken=process.env.SUPABASE_OWNER_ACCESS_TOKEN;
    if(!ownerToken)throw new Error('Restore requires SUPABASE_OWNER_ACCESS_TOKEN');
    const owner=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${ownerToken}`}},auth:{persistSession:false}});
    const role=await owner.rpc('archive_role');if(role.data!=='owner')throw new Error('Active owner required');
    const data=decryptBackup(await readFile(path),secret);await restoreAssets(db,data);
    const restored=await owner.rpc('archive_restore_backup',{backup:data});if(restored.error)throw new Error(restored.error.message);console.log(restored.data);
  }
}

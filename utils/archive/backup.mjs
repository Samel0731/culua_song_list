import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
const MAGIC=Buffer.from('CULUA1');
function key(value) {if(!/^[a-f\d]{64}$/i.test(value||''))throw new Error('ARCHIVE_BACKUP_KEY must be 64 hex characters');return Buffer.from(value,'hex');}
export function encryptBackup(data,secret) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(secret),iv);
  const compressed=gzipSync(Buffer.from(JSON.stringify(data)));
  const bytes=Buffer.concat([cipher.update(compressed),cipher.final()]);
  return Buffer.concat([MAGIC,iv,cipher.getAuthTag(),bytes]);
}
export function decryptBackup(bytes,secret) {
  if(bytes.length<34||!bytes.subarray(0,6).equals(MAGIC))throw new Error('Invalid backup format');
  const decipher=createDecipheriv('aes-256-gcm',key(secret),bytes.subarray(6,18));decipher.setAuthTag(bytes.subarray(18,34));
  const compressed=Buffer.concat([decipher.update(bytes.subarray(34)),decipher.final()]);
  const data=JSON.parse(gunzipSync(compressed,{maxOutputLength:100*1024*1024}).toString('utf8'));
  if(data.format!==1||!Array.isArray(data.songs)||!Array.isArray(data.assets))throw new Error('Invalid backup contents');
  return data;
}
export async function collectBackup(db) {
  const {data,error}=await db.rpc('archive_export_backup');if(error)throw new Error(error.message);
  const assets=[];let total=0;
  for(const source of data.evidence) {
    if(!source.storage_path)continue;
    const file=await db.storage.from('archive-evidence').download(source.storage_path);
    if(file.error)throw new Error(`Backup image unavailable: ${source.id}`);
    const bytes=Buffer.from(await file.data.arrayBuffer());total+=bytes.length;
    if(total>50*1024*1024)throw new Error('Backup exceeds 50 MB; export assets separately before increasing the limit');
    assets.push({path:source.storage_path,contentType:file.data.type,base64:bytes.toString('base64')});
  }
  return {...data,assets};
}
export async function restoreAssets(db,data) {
  const paths=new Set(data.evidence.filter(e=>e.storage_path).map(e=>e.storage_path));
  const supplied=new Set(data.assets.map(a=>a.path));
  if([...paths].some(p=>!supplied.has(p)))throw new Error('Backup missing image assets');
  for(const asset of data.assets) {
    if(!paths.has(asset.path)||!/^[-\w]{36}\/[\w-]{11}\/[-\w]{36}\.(png|jpg)$/.test(asset.path))throw new Error('Invalid backup image path');
    const bytes=Buffer.from(asset.base64,'base64');if(bytes.length>10*1024*1024)throw new Error('Image exceeds 10 MB');
    const {imageMime}=await import('./ingestion.mjs');const mime=imageMime(bytes);
    const saved=await db.storage.from('archive-evidence').upload(asset.path,bytes,{contentType:mime,upsert:false});
    if(saved.error && !['409','Duplicate'].includes(String(saved.error.statusCode)) && !/already exists/i.test(saved.error.message))throw new Error(saved.error.message);
  }
}

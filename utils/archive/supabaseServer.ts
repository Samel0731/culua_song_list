import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { boundedFetch } from './adminRequest.mjs';

function transport(budgetMs:number) {
  const started=Date.now();
  return async(input:RequestInfo|URL,init?:RequestInit)=>{
    const before=Date.now();
    const response=await boundedFetch(input,init,Math.max(1,Math.min(15000,budgetMs-(before-started))));
    console.info('[archive transport]',{phase:new URL(String(input)).pathname.startsWith('/auth/')?'auth':'data',status:response.status,ms:Date.now()-before});
    return response;
  };
}

export function archiveConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function memberClient(budgetMs=18000) {
  if (!archiveConfigured()) throw new Error('Supabase 尚未設定');
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global:{fetch:transport(budgetMs)},
    cookies: { getAll: () => store.getAll(), setAll: values => {
      try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
      catch { /* Server Components cannot set cookies; proxy refreshes sessions. */ }
    } },
  });
}

export function serviceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('伺服器金鑰尚未設定');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    global:{fetch:transport(55000)},
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class AccessError extends Error {
  constructor(message: string, public status = 403) { super(message); }
}

export async function requireMember(owner = false,budgetMs=18000) {
  const db = await memberClient(budgetMs);
  const { data: { user }, error } = await db.auth.getUser();
  if(error && (!error.status || error.status>=500))throw new AccessError('登入驗證暫時無法完成，請稍後重試。',503);
  if (error || !user) throw new AccessError('請先登入', 401);
  const { data: role, error: roleError } = await db.rpc('archive_role');
  if(roleError)throw new AccessError('成員權限暫時無法讀取，請稍後重試。',503);
  if (!role || (owner && role !== 'owner')) throw new AccessError('此帳號沒有操作權限');
  return { db, user, role: role as 'owner' | 'editor' };
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  if (!origin || origin !== new URL(allowed).origin) throw new AccessError('不允許跨站操作');
}

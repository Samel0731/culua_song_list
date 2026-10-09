import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export function archiveConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function memberClient() {
  if (!archiveConfigured()) throw new Error('Supabase 尚未設定');
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: values => {
      try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
      catch { /* Server Components cannot set cookies; proxy refreshes sessions. */ }
    } },
  });
}

export function serviceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('伺服器金鑰尚未設定');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class AccessError extends Error {
  constructor(message: string, public status = 403) { super(message); }
}

export async function requireMember(owner = false) {
  const db = await memberClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new AccessError('請先登入', 401);
  const { data: role, error: roleError } = await db.rpc('archive_role');
  if (roleError || !role || (owner && role !== 'owner')) throw new AccessError('此帳號沒有操作權限');
  return { db, user, role: role as 'owner' | 'editor' };
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const allowed = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  if (!origin || origin !== new URL(allowed).origin) throw new AccessError('不允許跨站操作');
}

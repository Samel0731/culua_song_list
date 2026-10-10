import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { boundedFetch } from './utils/archive/adminRequest.mjs';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return response;
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global:{fetch:(url,init)=>boundedFetch(url,init,5000)},
    cookies: { getAll: () => request.cookies.getAll(), setAll: values => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    } },
  });
  try {await db.auth.getUser();}catch {
    if(request.nextUrl.pathname.startsWith('/api/admin'))return NextResponse.json({error:'登入驗證暫時無法完成，請重新讀取後再操作。'},{status:503,headers:{'Cache-Control':'private, no-store'}});
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/admin/:path*', '/auth/:path*', '/api/admin/:path*'] };

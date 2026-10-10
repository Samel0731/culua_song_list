import { NextResponse } from 'next/server';
import { memberClient } from '@/utils/archive/supabaseServer';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const db = await memberClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      await db.rpc('archive_claim_invitation');
      return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || url.origin));
    }
  }
  return NextResponse.redirect(new URL('/admin?error=login', process.env.NEXT_PUBLIC_SITE_URL || url.origin));
}

import { NextResponse } from 'next/server';
import { AccessError } from './supabaseServer';
export function apiError(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : '操作失敗' }, {
    status: error instanceof AccessError ? error.status : 500, headers: { 'Cache-Control': 'private, no-store' },
  });
}

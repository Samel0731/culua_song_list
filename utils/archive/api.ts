import { NextResponse } from 'next/server';
import { AccessError } from './supabaseServer';
import { adminErrorMessage, rpcFailure } from './adminRequest.mjs';
export function rpcError(error:{code?:string;message:string;details?:string}) {
  const failure=rpcFailure(error);
  return Object.assign(new AccessError(failure.message,failure.status),{current:failure.current});
}
export function apiError(error: unknown) {
  return NextResponse.json({ error: adminErrorMessage(error instanceof Error ? error.message : '操作失敗'),current:error instanceof AccessError?(error as AccessError & {current?:unknown}).current:undefined }, {
    status: error instanceof AccessError ? error.status : 500, headers: { 'Cache-Control': 'private, no-store' },
  });
}

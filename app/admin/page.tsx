import type { Metadata } from 'next';
import { archiveConfigured, memberClient } from '@/utils/archive/supabaseServer';
import Admin from './Admin';
export const dynamic='force-dynamic';
export const metadata: Metadata={title:'歌單管理',robots:{index:false,follow:false}};
export default async function Page() {
  if(!archiveConfigured())return <section className="admin-shell"><h1>歌單管理</h1><p>後台尚未啟用。請依 PRODUCT_SETUP.md 設定 Supabase 與 Google 登入。</p></section>;
  const db=await memberClient();
  const {data:{user}}=await db.auth.getUser();
  const role=user?(await db.rpc('archive_claim_invitation')).data:null;
  return <Admin authenticated={Boolean(user)} allowed={Boolean(role)}/>;
}

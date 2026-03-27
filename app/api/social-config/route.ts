// app/api/social-config/route.ts
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// 你提供的 SocialConfig 分頁 CSV 連結
const SOCIAL_CONFIG_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=1044648211&single=true&output=csv';

export async function GET() {
  try {
    // 抓取 Google Sheets 資料，設定 revalidate 確保資料會更新（例如 30 分鐘）
    const res = await fetch(SOCIAL_CONFIG_URL, {
      cache: 'no-store'
    });

    if (!res.ok) throw new Error('無法取得 Social Config 資料');

    const csvText = await res.text();
    
    // 解析 CSV 資料
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parseResult.data as any[];
    
    // 將 Key/Value 格式轉為物件
    // 預期表格欄位名稱為 "Key" 與 "Value"
    const config: Record<string, any> = {};
    rows.forEach(row => {
      const key = row.Key || row.key;
      const value = row.Value || row.value;
      if (key) {
        // 如果是 tiktok_ids，將其轉為陣列（用逗號隔開）
        if (key === 'tiktok_ids' && value) {
          config[key] = value.split(',').map((id: string) => id.trim());
        } else {
          config[key] = value;
        }
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Social Config API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
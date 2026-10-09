# 官方同步與精選維護

## 已建立的維護分頁

使用原網站已發布歌回 CSV 對應的 [CULUA_歌った曲リスト 的副本](https://docs.google.com/spreadsheets/d/1j-5LAkXh1fZyqfTz4C26Djp8Dguleu-h4ImpLq80FRs/edit)。既有歌回資料與 SocialConfig 未改動。

| 分頁 | 用途 | 欄位 |
| --- | --- | --- |
| [FanArt](https://docs.google.com/spreadsheets/d/1j-5LAkXh1fZyqfTz4C26Djp8Dguleu-h4ImpLq80FRs/edit#gid=1270000001) | 精選 X 原帖 | `url,artists,order,enabled` |
| [FeaturedWorks](https://docs.google.com/spreadsheets/d/1j-5LAkXh1fZyqfTz4C26Djp8Dguleu-h4ImpLq80FRs/edit#gid=1270000002) | 原創作品置頂 | `source_url,pinned,order,enabled` |

FanArt：貼入作者原帖網址，例如 X 的 `/作者/status/貼文ID`；artists 填 `CULUA`、`NEUN`、`MEDA`，多人作品可填 `CULUA,NEUN`。勾選 enabled 才顯示。order 越小越前面。三個起始空白網址列預設停用，沒有加入未確認作品。

FeaturedWorks：貼入官方發行頁或 LinkCore 網址，勾選 pinned 置頂；只需維護網址與排序，不要複製曲名、日期。預設的 KALMIA 範例不置頂，因此首頁依最新發行排列。此清單策展 CULUA 作品；同期發行由官方資料進入活動時間軸。

## 必須完成的發布設定

2026-10-07 已建立並透過 Google Sheets API 讀回核對新分頁、資料、欄位備註、凍結標題列與勾選控制。瀏覽器沒有登入 Google，無法驗證 Google 原生畫面的欄寬；已使用格式與欄寬 metadata 做替代核對。

新分頁尚未發布到網路，未登入的 CSV 請求回傳 **401**。Google Drive 連接器的編輯權限不等於網站伺服器有匿名讀取權限。

1. 在維護表選「檔案 → 分享 → 發布到網路」。
2. 分別選 FanArt、FeaturedWorks，格式選 CSV 並發布；保留原本歌回分頁的發布設定。
3. 開啟自動重新發布變更。使用無痕視窗確認兩個 CSV 可以開啟，第一列是上表的欄位。
4. 將 Google 提供的兩個 CSV 發布網址填入本機 `.env.local` 或 Netlify 的 `FANART_SHEET_CSV_URL`、`FEATURED_WORKS_SHEET_CSV_URL`，重啟本機服務或重新部署。不要填需登入的 `/edit` 網址。未設定時不抓取策展來源，顯示「尚未設定精選」；已設定但無法讀取時顯示來源同步失敗並記錄 warning，不把未發布資料當成成功同步。

新增 X 原帖後，快取到期的下一次瀏覽會觸發重新驗證；官方資料與策展 CSV 的週期均為 30 分鐘，並非固定排程工作。

## 官方來源

- RK Music Info：公告列表加 CULUA、MEDA 標籤交叉檢查；NEUN 包含於公告標題與共同活動。相同公告合併所屬歌手。
- RK Music Release：Fused、NEUN、MEDA 分類及其分頁，讀取發行內頁的歌手、配信開始日、官方 MV 與串流網址。
- TuneCore CULUA：補充 RK 分類缺漏的作品；LinkCore 原文補查發行日。
- CULUA 官方 YouTube RSS：將近期 Official Music Video 依曲名對應到原創發行，不把歌回或翻唱當成新歌。RSS 只包含近期影片，歷史 MV 由 RK 發行頁補充。
- 歌回：仍使用原本粉絲維護 Sheets；YouTube 影片本身不能替代人工逐曲時間戳。

活動日期只使用官方公演日期列；公告日、票券販售日不當成演唱會日期。未確認發行日的作品不加入時間軸。活動時間保留日本時間。資料來源失敗各自隔離，官方同步失敗會交由 Next.js 快取保留既有成功結果；沒有既有快取時顯示空狀態。超過一小時的成功結果標示為快取待更新。

## 本機查核

```sh
node scripts/verify-content.mjs
node --test --test-isolation=none tests/*.test.mjs
npx tsc --noEmit
npm run build
```

官方 HTML 與 RSS 是外部契約；格式改變會中止該來源更新並記錄來源錯誤，需更新解析器與對應測試。X 嵌入失敗、貼文刪除或腳本被封鎖時，仍保留原帖外連。

# 歌單產品設定與維護

## 目前完成與外部設定

程式提供 `/admin`，包含邀請制 Google 登入、直播管理、歌曲／核准別名、待審候選、逐項發布、演唱紀錄修正、OCR、修訂還原、匯出和加密備份。資料庫變更在交易內執行，版本衝突回傳 409，撤銷成員不依賴 JWT 中的舊權限。

2026-10-10 已接上 Supabase `culua-song-list`（東京，專案 ID `akmktondfagxhsksnsbz`），確認組織方案為 Free。初始 worker migration 分成兩筆远端記錄；加上 owner 綁定與四筆可靠性修正，遠端目前共九筆。請先核對歷史，不重播已套用檔案。私人圖片 bucket、RLS 與預設關閉的自動發布已建立；本地公開資料來源已切換 `supabase`。

唯一擁有者已完成 Google UUID 綁定，瀏覽器後台、正式匯入及同專案備份還原已實測。本機 server-only service role key、備份與快取更新密鑰已設定。YouTube API／GitHub 排程及 Netlify 部署仍待外部帳戶設定。不要把 `.env.local`、服務金鑰、備份密鑰或擁有者 access token 提交 Git。

此專案 Google authorized redirect URI：`https://akmktondfagxhsksnsbz.supabase.co/auth/v1/callback`。Supabase Redirect URLs 加入 `http://localhost:3000/auth/callback` 與 `https://culuasonglist.netlify.app/auth/callback`。在 [Google provider 設定](https://supabase.com/dashboard/project/akmktondfagxhsksnsbz/auth/providers) 啟用 Google 並填入 Google Cloud OAuth client ID／secret；私密資訊只填設定頁。

## 1. 建立免費 Supabase 與 Google 登入

1. 新專案建立 Supabase Free，使用 SQL Editor 按檔名順序執行 `supabase/migrations/` 的所有 migration，或使用 Supabase CLI `supabase db push`。現有專案已套用，遠端版本與本地初始檔名不同，使用 CLI 前先核對 migration history，勿重複執行。
2. 在 Google Cloud 建立 OAuth Web application，用 Supabase Auth 顯示的 callback URL 作為 Google authorized redirect URI。只使用 `openid email profile`；YouTube API key 另設，不向協作者索取 Google Sheet 或 YouTube 存取權。[官方 Google OAuth 設定](https://supabase.com/docs/guides/auth/social-login/auth-google)
3. 在 Supabase Auth 啟用 Google provider，填入 client ID／secret；Site URL 設定正式網站 origin。Redirect URLs 加入 `http://localhost:3000/auth/callback` 和正式網站的 `/auth/callback`。正式部署將 Google OAuth app 設為可供指定協作者使用的狀態。
4. 複製 `.env.example` 到 `.env.local`，填入 Supabase URL、publishable key、server-only service role key。`NEXT_PUBLIC_SITE_URL` 必須與瀏覽器 origin 一致；Netlify 正式環境不能保留 localhost。
5. 產生備份密鑰：`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`，存入 `ARCHIVE_BACKUP_KEY`，並在獨立密碼管理器保存一份。遺失密鑰無法解密備份。
6. 新專案先由 SQL Editor 建立唯一擁有者的 Google 信箱（必須小寫），再執行 `npm ci`、`npm run dev`，開啟 `/admin` 用該 Google 帳號登入。經 Google 驗證的信箱會綁定 Auth UUID，保留 owner 角色並寫入修訂紀錄。現有專案已有 owner，勿重複新增：

```sql
insert into public.archive_members(email,role)
values ('你的 Google 信箱小寫', 'owner');
```

7. 重新進入 `/admin`。在「成員」輸入 Sheet 維護者、CULUA 或 RKMusic 指定人員的 Google 信箱，再自行提供網站網址給本人。系統不自動寄邀請信；首次登入以 Google 驗證信箱綁定 UUID。撤銷後所有後台讀寫及圖片存取皆重新檢查成員資格。已發出的圖片短效簽名最長 60 秒失效。

若已登入却顯示「此帳號尚未受邀」，先核對預先建立的信箱、active 與 UUID 綁定。`owner_invitation_claim` migration 修正早期只允許 editor 首次綁定的問題；既有專案套用該修正後直接重新整理 `/admin`，不需要重建 OAuth 或手動調整角色。未邀請、未驗證或已綁定其他 UUID 的帳號仍不會取得權限。

只有擁有者管理成員、啟用自動發布及還原整份備份。協作者可以編輯、審核、發布、重試與匯出；不能提升自己的權限。此站仍是非官方網站，受邀身分不代表官方背書。

## 2. 一次匯入 Sheet 與切換資料來源

2026-10-10 更新：正式 CSV 已由擁有者後台匯入，658 筆歌曲／歌手、3,131 筆演唱、422 場直播、8 筆非公開待補，格式錯誤 0。逐筆影片 ID、時間、歌曲／歌手、日期與播放連結比對通過。本地已切換 `supabase`，Netlify 正式來源尚未切換。當次 CSV、摘要、比對報告和加密備份保存於不進 Git 的 `.archive-private/`。

本機服務金鑰、備份與快取更新密鑰已設定；擁有者可取得的密鑰副本是 `.archive-private/keys.env`，請另存到自己的安全保管位置。不要貼到聊天或提交版本控制。GitHub／Netlify 的設定不能由本機 `.env.local` 推定完成。

管理讀取與一般寫入等待上限 20 秒，匯入／備份 60 秒；資料庫操作有 statement/lock timeout。逾時顯示結果待確認，先查詢操作結果，再使用原請求識別碼重試；不自動重送。同一操作者與相同內容回傳交易保存的原結果，內容不同拒絕。儲存成功但刷新失敗時保留草稿並提供重新讀取。409 畫面並列草稿與目前版本；已刪除候選不能復活。

新增的四個可靠性 migration 已套用，現有遠端共九筆記錄；新專案仍按本地全部檔名順序建立。`archive_restore_safe_delete` 保留安全更新限制，將整批還原的刪除及重設改為明確主鍵条件。正式同專案還原已實測成功，內容與匯入後備份一致、成員權限保留、自動發布保持關閉。

1. 由 Google Sheet 下載目前工作表 CSV；在「匯出與匯入」選擇檔案並預覽。
2. 比對歌曲、演唱、直播數量及播放時間。舊日期的 `YYYY/MM/DD` 轉成相同日期的 `YYYY-MM-DD`；自動新直播日期使用台灣時區。程式按影片／秒數排序分配演唱順序，完全相同列會去重；不同時間的同首歌曲保留。曲連結欄的「リンク」文字不會當 URL，會使用真正 HTTPS 曲 URL。
3. 有錯誤的列必須修正後重新预覽。明確標示「非公開」的紀錄保存在 `archive_unavailable`，不發布假的 timestamp。「舊資料待補」可查看原始列，取得有效影片後由後台補建正式紀錄，再標記對應直播；原始資料保留，也可匯出。
4. 確認後整批交易匯入；非空的演唱資料庫會拒絕再次 migration，防止覆蓋人工修正。
5. 本次開發讀取的可播放基準為 **639 個曲名、658 種曲名／歌手組合、3,131 筆演唱、422 場直播，另 8 筆非公開待補**。資料庫保留歌手差異，前台依曲名合併所有版本，維持舊網址與數量。Sheet 後續仍可能變更，以上不是未來匯入的硬性門檻。
6. 先在測試環境比對歌曲頁、播放與匯出，下载加密備份並演練還原，再設定 `ARCHIVE_DATA_SOURCE=supabase`。這次設定切換需部署一次；後续資料更新不需要重新部署。
7. 回退可將資料來源切回 `sheet`；切換後不會把後台修正寫回 Sheet，請先匯出保存差異。

公開讀取使用交易生成的兩份最近 snapshot 與 Next 持久快取。資料庫讀取失敗不寫入空資料；暖機使用最後成功版本，冷啟動且無可用快取時退回 repository 的 Sheet 基準 snapshot。這份基準會較舊，並非跨服務故障時仍能取得最新資料的保證。`npm run archive:snapshot` 可在計畫性更新基準時重建；不能用它取代資料庫備份。

## 3. YouTube 自動更新與試運轉

在 Google Cloud 啟用 YouTube Data API v3，建立限制於該 API 的 key。依官方頻道的 channel ID 設定 `YOUTUBE_CHANNEL_ID`，不要填 @handle 或網址。使用 uploads playlist，避免昂貴搜尋；只自動加入啟用時間後、官方頻道已結束且標題含「歌枠」的直播。其他影片在後台手動新增，同樣驗證官方頻道與直播結束狀態。

GitHub repository 設定：

| 種類 | 名稱 |
|---|---|
| Secrets | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`, `ARCHIVE_BACKUP_KEY` |
| Variables | `ARCHIVE_ENABLED=true`, `YOUTUBE_CHANNEL_ID` |
| 選用即時快取更新 | Secret `ARCHIVE_REVALIDATE_SECRET`；Variable `ARCHIVE_SITE_URL=https://你的網站` |

快取更新 secret 同時填入 Netlify server 環境。沒有 webhook 時資料最遲於正常的五分鐘快取週期更新。手動後台發布會直接清除對應快取。

`archive-sync.yml` 台灣時間每日 08:17 執行，允許手動 dispatch；GitHub schedule 可能延遲、漏執行或因公開 repository 長時間不活躍而停用，不當作精準排程。[GitHub schedule 說明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

每輪最多 500 次本程式使用的低 quota 請求，約 9 分半後停止發出新請求，15 秒 timeout，暫時性錯誤重試兩次。每頁 100 則、每影片最多 1,000 則頂層留言；頁碼、掃描世代與證據儲存於 DB，預算耗盡可續跑。達 1,000 則且仍有下一頁時永遠標示 incomplete，不能自動發布，可人工審核。近 14 天影片持續重查，舊影片只有指定重試或未完成分頁才處理。[YouTube commentThreads 文件](https://developers.google.com/youtube/v3/docs/commentThreads/list)

每位作者只有一票；只取有至少兩首時間戳的留言歌單。兩位以上作者曲目順序／數量一致，各位置同一核准歌曲、時間差 ≤3 秒且時間有效才有資格發布。拼字與歌手組合不會自動建立別名；第三份衝突也會阻止該位置發布。符合條件的位置可先發布，其他位置留審。人工修正不覆蓋，已發布資料的新衝突另建候選；重跑及工作租約避免重複寫入。

預設 `auto_publish=false`。至少先觀察 7 天每日候選、漏曲與錯誤，再由擁有者在工作狀態頁啟用；程式會阻止未滿 7 天啟用。七天經過本身不是正確性證明，啟用前仍需檢查实际工作紀錄。超過 48 小時沒有成功工作時後台提醒；在 GitHub 通知設定啟用失敗 workflow 通知。

## 4. 圖片與多人審核

- 先選定 YouTube 影片，再提供 X 貼文、`pbs.twimg.com` HTTPS 圖片直連或 PNG／JPEG 上傳（≤10 MB）。貼文只是來源證據，不依日期、標題序號猜影片，也不使用付費 X API。
- 只有貼文時保留 needs_image；可以在「補上既有貼文的圖片」選擇該來源並補直連／上傳，不必建立重複來源。
- 私人 Storage 存圖，後台短效簽名讀取。直連禁重新導向、檢查檔頭、下載大小和 timeout；不允許任意網址。
- 上傳檔案先使用短期簽名直接傳到私人 Storage，再由伺服器驗證內容及建立來源，避開 Netlify 函式的請求 body 限制。沒有完成來源綁定的一天前圖片會由每日工作在剩餘執行預算內清理；異常時可於 Storage 管理介面檢查。
- 瀏覽器下載 Tesseract 日文／英文模型後執行 OCR；首次下載可能較慢。支援百分比裁切、1–4 倍放大、灰階對比及反相，處理面積上限 2,000 萬像素。
- 一行一首校正結果，建立候選後補歌手及時間。所有 OCR 候選先審核，只有曲名不填假時間。重新送同來源同位置不覆蓋既有人工候選，修改請使用候選表單。
- 「發布已儲存版本」發布 DB 上該版本；先儲存表單修改，再按發布。遇到 409 比對伺服器目前內容，重新載入後重新修正；不做最後寫入者覆蓋。
- 正式曲名修正保留舊名稱導向；原分享連結的 video／t 參數保留。曲名和原唱核准別名由協作者明確建立。
- 誤核准的別名可以撤銷；舊網址導向會保留。自動發布交易再次查驗目前核准名稱及當輪兩位作者的未過期證據，撤銷後不採用工作先前讀到的別名。

兩支樣本留言已建立逐字轉錄測試。貼文 `2096983824911790103` 對應 `z65138fhtm8`，`2091907669770834344` 對應 `oBB1DtC2Vv0`；不得配到留言範例 `GzB_HSosjw8`／`Yg2Iw8x-r5U`。第一篇已實测 Tesseract：裁切20/10/60/80%、1倍、100%對比、反轉明暗後5行可辨識，去除空白後4/10曲名正確，1行誤字、5行漏辨；人工校正10首送審，歌手和時間仍待補。不把單張圖結果當作所有圖片的辨識率。

## 5. 備份、還原與故障排查

每日排程使用 AES-256-GCM 加密壓縮的應用資料及私人圖片，GitHub artifact 保留 7 天；同一工作失敗也會嘗試備份。备份不保存原始 API 留言、作者 ID 或留言 URL；這些資料在主 DB 30 天内清除或由新掃描更新。[YouTube 資料政策](https://developers.google.com/youtube/terms/developer-policies)

備份不是完整 Supabase 專案 dump；Auth 身分、成員權限及工作狀態不會被資料還原覆蓋，帳號與 invitation 另由擁有者管理。只支援同一 Supabase 專案還原，跨專案搬移須先映射 Auth user ID。現有修訂保留，備份缺少的歷史會補回，還原本身另記一筆。

後台還原流程：下載目前資料加密備份 → 選擇舊備份 → 檢查數量 → 確認還原。預覽不修改資料；預覽後資料被他人修改會拒絕還原。整批 DB 還原在交易內完成，成員不變，自動發布重回七天試運轉。API 最多接受 25 MB 加密備份，收集圖片總量最多 50 MB；超限會顯示錯誤，需另行規畫資產備份，不能靜默略圖。

CLI（使用 shell／平台安全環境變數注入密鑰）：

獨立 Node 腳本不會自動載入 Next.js 的 `.env.local`。本機可使用 Node 22 的 `--env-file=.env.local`；CI 由 workflow 注入。超過部署平台 HTTP 請求大小限制的備份請使用 CLI 還原，不要反覆上傳。

```text
npm run archive:backup
node scripts/archive-backup.mjs inspect archive-backup.enc
node scripts/archive-backup.mjs restore archive-backup.enc
```

CLI restore 額外需要 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 和有效 `SUPABASE_OWNER_ACCESS_TOKEN`；service role 本身無權调用資料還原 RPC。CLI 是操作人明確執行的還原，沒有後台的預覽介面，務必先 inspect 並備份目前資料。

| 問題 | 處理 |
|---|---|
| 登入失敗 | 檢查 Google consent、Supabase provider 與 callback allowlist；不要使用 `getSession` 作伺服器授權 |
| 已登入仍無權限 | 確認受邀信箱與 Google 驗證信箱相同、成員 active、首次綁定成功；不要依公司網域放行 |
| 留言關閉／影片非公開 | 保留已發布紀錄，改用圖片或人工建立；不要無限重試 |
| 超過 48 小時未更新 | 查看 GitHub workflow 是否停用、Secrets／quota／DB 狀態，再手動 dispatch |
| 不會自動發布 | 查看候選原因、完整分頁、核准別名、影片長度、試運轉及開關 |
| 後台修正未顯示 | 確認正式站資料來源為 supabase，檢查快取更新與發布狀態 |
| 備份解密失敗 | 使用當時的密鑰，勿重新生成後期待能解舊檔；保留來源檔 |

## 6. 成本、測試與上線門檻

以 NT$0 為目標，不啟用 Pro、付費 AI、X API 或自動加值。Supabase Free 上限及暫停政策、Netlify 帳戶實際計費方案、GitHub private repo 的 Actions／artifact 用量都要在啟用前核對，不能僅靠程式保證每月費用。[Supabase pricing](https://supabase.com/pricing)、[Netlify pricing](https://www.netlify.com/pricing)、[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

每日看工作，每月記錄 DB／Storage／egress、Netlify credits、Actions minutes／artifact storage。接近免費額度先停自動工作或縮短資料保留，維持手動維護；要付費前重新評估 NT$100 預算，不自動升級。免費方案不提供此產品的付費 SLA。

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
```

DB 測試在 PGlite 真實 PostgreSQL 引擎中建立 Auth／Storage 測試 schema，執行全部 migration，檢查 RLS、邀請撤銷、版本衝突、發布交易、重複演唱、試運轉與還原。它不能取代部署後的 Supabase OAuth、Storage 網路、Google API quota 和 Netlify runtime 驗證。

正式啟用門檻：測試專案 migrations 成功、兩個受邀 Google 帳號登入驗證、協作者圖片→OCR→校正→發布完整走過、撤銷驗證、舊資料數量與播放比對、加密下載／還原演練、免費額度核對、七天工作候選人工檢查。先手動發布，最後再開自動發布。

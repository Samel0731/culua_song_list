# 2026-10-10 正式資料匯入與可靠性複驗

- 上線分支後續驗證：50 項測試、ESLint、TypeScript、production build 成功。匯入／還原／圖片 RPC 共用終止衝突與暫時性錯誤分類；伺服器504回應仍保留固定請求識別碼供結果查詢。後台截圖只留本機，不公開內部草稿與識別碼。
- Supabase security advisor 提醒公開 SECURITY DEFINER RPC：公開 snapshot 為刻意提供已發布資料，role RPC 只返回目前帳號角色；管理 RPC 內仍強制 active member／owner 檢查，RLS保留。未宣稱零警示。參考 [公開函式檢查](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)、[已登入函式檢查](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)。密碼外洩保護警示保留；網站登入使用 Google OAuth。

- 48 項自動測試通過（Node test isolation=none），ESLint、TypeScript、Webpack production build 與差異檢查通過。Windows sandbox 下建置子程序 EPERM，經授權在 sandbox 外建置成功。既有相依警示仍在。
- 擁有者瀏覽器後台正式 CSV 匯入成功：658 組歌曲／歌手、3,131 筆演唱、422 場直播、8 筆非公開待補，格式錯誤 0。摘要 `e37329a335c5b1a8d4d35339f74ad902ce4b86bca9281ad258d80c2a2d2175a7`；逐筆影片 ID、時間、歌曲／歌手、日期與歌曲連結比對通過。公開 snapshot 為 639 曲名入口，3,131 演唱。
- 本地來源已切換 Supabase；Netlify 正式部署／來源尚未切換。現有 Google owner 已綁定，未測第二個真實協作者帳號。
- 已套用四個新的可靠性 migrations，遠端共九筆。一般寫入固定 request_id、交易保存結果、20/60 秒前端等待、有限資料庫等待。隔離測試驗證永不回應與 body 卡住、寫入成功刷新失敗、409 草稿保留、重複請求、撤銷與已刪除候選不能復活。
- 真實同專案 owner 還原第一輪遇到 Supabase 安全更新限制，交易回滾；新增明確 WHERE 的 migration 後重試成功。已確認 backup_restore 審計與操作 receipt，還原後歌曲／演唱／待補／別名和匯入後加密備份一致，owner 權限保留，自動發布關閉。
- 官方貼文 `2096983824911790103` 明確綁定 `z65138fhtm8`。JPEG 儲存私人 bucket，瀏覽器 Tesseract 日英 OCR 真實執行兩輪。第二輪裁切 20/10/60/80%、1 倍、對比 100%、反轉明暗：辨識 5 行，去除非原文空白後 4/10 曲名正確、1 行誤字、5 行漏辨。人工補齊 10 首，全部待審、歌手空白、時間 null。這是一張圖的測量，不能外推整體準確率。
- 含私人原圖的加密備份已解密驗證，圖片 SHA-256 與官方原 JPEG 一致；金鑰與副本均未進 Git。匿名／撤銷保護有隔離測試，真實協作者圖片到發布流程仍待指定帳號。
- YouTube Data API 啟用／受限金鑰等待本人確認；GitHub 和 Netlify 管理瀏覽器需本人登入。尚未配置遠端 secrets、啟用每日工作、取得實際七天試運轉或部署後驗收。

以下為較早的歷史驗證，不代表目前狀態。

# 2026-10-10 歌單產品與多人管理實作（早期）

- owner 首次 Google 登入修正：新增 `owner_invitation_claim` migration，允許既有有效 owner/editor 的已驗證 Google 信箱綁定未綁定 UUID，保留角色及審計。42 項測試、lint、TypeScript、正式建置通過；新增測試覆蓋 owner 初次綁定與冪等、未驗證／未確認信箱、撤銷、不同信箱及已綁定 UUID 保護。遠端套用成功，回滾交易以 authenticated role 驗證 owner 綁定與角色成功，不以管理連接器直接永久改寫使用者綁定。瀏覽器刷新後的實際管理流程仍需確認。
- 此次建置仍出現 YouTube RSS 500 快取重驗證錯誤，但建置完成。這是官方內容來源故障，與 Google OAuth/owner 綁定分開，未宣稱已修正 RSS。
- 策展 401 修正：移除尚未發布分頁的預設 CSV 網址，只有明確設定環境變數才請求策展來源。可恢復的來源失敗以 warning 記錄，頁面保留同步失敗狀態。未設定時 `/fanart` 回應 200 並顯示「尚未設定精選」，回應沒有 401 錯誤字串；40 項測試、lint、TypeScript 與正式建置再次通過，建置未出現兩個策展 401。
- 新增 Supabase 三個 migrations、Google 邀請登入、owner/editor RLS、管理後台、樂曲／別名與演唱紀錄、候選審核、圖片來源、瀏覽器日英 OCR、修訂歷史、CSV 初次匯入及加密備份還原。
- 每日 YouTube 工作有 quota／時間／頁數上限、可續跑游標、作者共識及三秒條件、人工修正保護、發布後衝突候選與工作租約；預設關閉自動發布，需七天試運轉及 owner 啟用。
- 真實 Sheet 基準完整通過 PostgreSQL 匯入與還原：639 個曲名入口、658 種曲名／歌手組合、3,131 筆演唱、422 場影片。另有 8 筆非公開原始列待補；不以未知時間零秒發布。斜線日期轉 ISO，同曲名不同歌手保留於資料庫並於公開入口合併版本。
- `npm test`：40 項通過，含實際 PostgreSQL/PGlite migration、RLS、邀請撤銷、過期版本拒絕、交易回滾、逐項發布、別名撤銷／新衝突、證據到期、原始資料 migration 與完整還原，以及 React 管理流程與既有播放器測試。
- `npm run lint`、`npx tsc --noEmit`、`npm run build` 通過；管理及授權路由為 dynamic，公開內容保持 ISR。正式建置會重新產生現有 repository 已追蹤的 PWA 資產。
- 本地正式伺服器 `node scripts/verify-site.mjs` 通過：8 個主要／歌曲頁 200、舊入口 redirect、canonical 與播放 query、646 個 sitemap entry。瀏覽器確認未設定 Supabase 時後台顯示設定提示，沒有開放登入繞過。
- 現有策展 FanArt／FeaturedWorks CSV 仍回傳 401；建置成功不表示這些來源已公開。npm 安裝仍列出既有相依警示，本次不宣稱相依樹已無漏洞。
- Supabase 遠端專案 `akmktondfagxhsksnsbz` 已確認 ACTIVE_HEALTHY、東京與 Free 方案；三個 SQL 檔案完整套用（worker 分兩段，遠端共四筆 migration）。本機 publishable client 的公開 snapshot RPC 成功，匿名查詢成員表回傳 permission denied。已依指定信箱建立唯一 owner，等待首次 Google 驗證綁定。實際 Auth settings 顯示 Google provider 尚未啟用，Auth Users 為零；未宣稱登入流程已在遠端完成。
- Google OAuth、server-only 服務及備份金鑰、YouTube API key、真實 OCR 辨識率、七天工作觀察、初次資料匯入、Netlify 部署及每月實際用量均待設定後驗證。未傳送邀請、未啟用付費方案。完整操作見 `PRODUCT_SETUP.md`。
- 接上遠端後 `/admin` HTTP 200，顯示 Google 登入而非未設定提示。12 張應用表全部啟用 RLS，私人 bucket 限 PNG/JPEG、10 MB，auto_publish=false。Supabase security advisor 提醒 SECURITY DEFINER RPC 可執行；公開 snapshot 與角色查詢、驗證成員的管理命令是刻意開放的介面，這個提醒不等同已允許匿名修改資料。[提醒說明](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)

# 2026-10-08 React 與套件修正驗證

- 修正 `LanguageContext` 的 `react-hooks/set-state-in-effect`：以 `useSyncExternalStore` 訂閱語言偏好；SSR 與 hydration 使用一致的繁中初始值，之後還原儲存的語言。儲存被封鎖或寫入失敗仍可切換語言，並同步其他分頁的語言變更。
- 修正 statistics、social-config API、CSV helper 的型別與 lint 問題。全專案 ESLint 從 13 errors / 1 warning 改為通過。
- React / React DOM：19.2.3 → 19.2.8；Next.js：16.2.1 → 16.3.8；eslint-config-next：16.1.0 → 16.3.8。同步更新 lockfile，保留 React 19.2 與 Next.js 16。
- `npm test`：21 項全部通過，新增 4 項語言 hydration、跨分頁、儲存阻擋與寫入失敗的實際 React/DOM 測試。
- `npm run lint`、`npx tsc --noEmit`、`npm run build`、`git diff --check`：通過。正式建置產生 18 個頁面，Google Sheets 成功讀取 639 首歌曲。
- 正式建置期間部分 RK Music、TuneCore、策展 CSV、YouTube 請求逾時，建置正常完成；未據此宣稱所有外部內容來源已驗證。
- 正式伺服器 smoke test：首頁、關於、歌曲列表、統計 tab、日文單曲頁與 Open Graph 圖片皆回應 200；HTML 頁面皆有 canonical。
- `npm audit`：更新後 Next.js 不再被列為受影響套件，critical 從 1 降為 0；仍有 21 項相依套件警示（18 high / 2 moderate / 1 low），涉及既有 PWA/Workbox、lint 與其他間接相依套件。此修正未使用會降級 PWA 或 ESLint 的 `npm audit fix --force`；不宣稱整個相依樹已無漏洞。
- 安全版本依據：<https://nextjs.org/blog/nextjs-security-update-september-22-2026>、<https://github.com/vercel/next.js/security/advisories>。

以下保留前次改版的歷史驗證紀錄；本次修正未部署至正式站。

# 2026-10-07 改版驗證紀錄

本機正式版預覽：http://localhost:3000/。尚未部署至 Netlify。

## 自動檢查

- 最終 `npm run build`：通過，18 個靜態頁產生、動態歌曲頁可正常存取。
- `npx tsc --noEmit` 與正式建置 TypeScript 檢查：通過。
- `node --test --test-isolation=none tests/*.test.mjs`：17 項通過；包含同期分類、公告與公演日期區分、有效日期、官方發行/MV 合併、X 白名單與去重、YouTube 原創匹配、播放器版本/循環/隨機/持續掛載，以及日文歌曲網址解碼。
- 修改的內容元件、頁面、播放器、解析工具及 Next 設定的針對性 ESLint：通過。
- 全專案 `npm run lint`：仍有既有 13 errors / 1 warning，位於 social-config API、原 stats 移至 StatsContent 的型別、LanguageContext 語言初始化、dataProcessor。未將全專案 lint 誤報為通過。
- `node scripts/verify-site.mjs`：8 個主要/單曲頁回應 200 且 canonical 正確；artists/stats/social 舊入口導向新位置；sitemap 646 個網址；歌曲版本 query 使用同一 canonical。
- `git diff --check`：通過（只有 Git 行尾格式提示）。

## 來源驗證

RK Music 新聞與 CULUA/NEUN/MEDA 發行、TuneCore/LinkCore 發行日期及 CULUA 官方 YouTube RSS 已讀取。WAYPOINT 的活動日期採官方表格 2026-09-23，MEDA×NEUN 採 2026-09-22，沒有把公告日期當公演日期。沒有明確解析到公演日期的新聞仍保留官方新聞入口，不捏造時間軸日期。官方網站改版可能需要調整解析器。

Google Sheets 的 FanArt、FeaturedWorks 分頁已建立並讀回確認；目前匿名 CSV 回應 401，須由擁有者發布這兩個分頁到網路。FanArt 尚未填入精選 X 網址，首頁及粉絲創作頁使用明確空狀態。公開來源與策展來源各自失敗不阻塞整站；初次讀取失敗不代入假內容。

## 瀏覽器驗證

- 桌面、390×844 手機：首頁與新聞/活動/歌曲頁排版，沒有水平溢出；手機選單可開啟、導航後關閉。
- 繁中／日文／英文切換，官方內容保留原文。
- NEUN 時間軸篩選顯示同期演唱會、EP 與歌曲發行。
- 首頁搜尋帶入歌回資料庫，639 首索引提供可爬取單曲入口。
- 官方 RSS 新曲 at dawn 可以播放；換頁保持同一 iframe，下一首切至原創作品。
- 日文單曲網址原先 404 的問題已修正，正式版複驗顯示曲目與 3 筆版本紀錄。
- 桌面預覽截圖：artifacts/home-desktop.jpg。

## 上線後仍需完成

发布 Sheets 策展分頁並填入選定 X 原帖、部署既有 Netlify 站點、於 Search Console 提交 sitemap 並確認收錄。尚無 Search Console/流量帳號數據，不能判定過去少人點擊的實際原因，也不能宣稱改版已提升訪客數。操作見 DATA_SETUP.md、SEARCH_VISIBILITY.md。

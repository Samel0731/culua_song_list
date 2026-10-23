# 歌單操作與維護

協作者先閱讀「整理一場直播」，擁有者另閱讀設定、備份及工作維護。本機介面更新與正式部署分開記錄；日期以前的外部觀察不代表目前帳戶狀態。

## 整理一場直播

1. 使用受邀的 Google 帳號進入 `/admin`。未受邀時請聯絡擁有者加入同一個 Google 驗證信箱；系統不自動寄邀請信。
2. 從工作台開始整理直播，選取或新增 YouTube 直播，填入標題、日期、影片長度。儲存後核對確認卡。直播基本資料可在前台顯示，歌曲需要另行發布。
3. 整理歌曲：逐首填曲名、歌手、時間及演唱順序；也可上傳來源圖片、預覽、辨識，再逐首校正。裁切與倍率在進階設定。OCR 不猜歌手或時間，也不自動發布。
4. 儲存候選表示待審，不表示公開。從缺漏清單補上必要欄位；核對已儲存版本後逐首發布。演唱順序已被使用時修改既有紀錄或改用其他順序。
5. 發布後從確認卡前往 `/songs?view=streams` 查看該場歌單。前台可切換歷史場次、按演唱時間播放及重新整理清單；更新不應中斷播放。

新增正式歌曲只建立歌曲資料，不會自動建立直播演唱。修改已有公開演唱的曲名、歌手、直播資訊或演唱紀錄，儲存後會影響前台；不要將所有「儲存」理解為私人草稿。

工作台缺漏總覽以完整取得的已儲存資料計算。受影響筆數和問題數不同，一筆可以有多個問題。未公開歌單、待人工審核、掃描問題和阻擋發布的缺漏分開列出；掃描完成不證明歌單完整。查詢失敗不代表零問題。可按曲名／直播與問題類型篩選並前往修正。

三語切換沿用網站偏好，首次繁中；歌曲名稱、歌手、來源保留原文。切換語言不丟草稿，離開有修改的區域先確認。版本衝突保留原稿並比較目前版本，確認後再儲存；已刪除資料不能藉更新復活。

### 儲存或讀取失敗

- 「已儲存，清單更新失敗」：寫入已完成，核對確認卡後重新讀取，勿重複新增。
- 「結果待確認」：請先確認操作結果。收據存在就定位該筆資料；尚無收據可能仍在執行。需要重試時使用原識別碼，勿換新 ID 重送。
- 公開歌單資料來源失敗：介面標示既有歌單，可能不是最新，且不包含尚無公開歌曲的直播。
- 「最新直播」按資料庫直播日期排序，不等同官方頻道最新直播；同日順序不代表實際直播先後。

## 擁有者設定

本機使用 `.env.example` 作變數參考，保留既有 `.env.local`。Next.js 自動載入本機設定；獨立 Node 腳本需由安全環境注入或使用 `--env-file=.env.local`。不得將金鑰、備份或私人操作資料提交 Git。

| 變數 | 用途 |
| --- | --- |
| NEXT_PUBLIC_SITE_URL | 網站及 OAuth 返回 origin；本機預設 http://localhost:3000 |
| NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 瀏覽器與成員 client；公開快照讀取 |
| SUPABASE_SERVICE_ROLE_KEY | 僅伺服器／worker；含最小公開直播投影，不得送到瀏覽器 |
| ARCHIVE_DATA_SOURCE | sheet 或 supabase；未設定時為 sheet |
| ARCHIVE_BACKUP_KEY | 64 位十六進位備份金鑰；另存安全保管位置 |
| ARCHIVE_REVALIDATE_SECRET | worker 更新網站快取的 server-only bearer secret |
| YOUTUBE_API_KEY、YOUTUBE_CHANNEL_ID | 官方頻道掃描；key 限制為 YouTube Data API v3 |
| ARCHIVE_SITE_URL | worker 即時更新快取的部署 origin |
| FANART_SHEET_CSV_URL、FEATURED_WORKS_SHEET_CSV_URL | 選填的公開策展 CSV；空白時停用來源 |

新 Supabase 專案才按本地 migration 檔名順序建立，開啟 Google provider、設定 callback，再以經授權的 Google 信箱建立唯一 owner。既有專案已完成 owner 與 migrations，不重播、不重新首次匯入。遠端早期 worker migration 曾拆成兩筆，CLI push 前必須核對歷史。

目前專案 `culua-song-list`／`akmktondfagxhsksnsbz` 位於 Tokyo。Google authorized redirect URI 為 `https://akmktondfagxhsksnsbz.supabase.co/auth/v1/callback`；Supabase redirect allowlist 包含 `http://localhost:3000/auth/callback` 與 `https://culuasonglist.netlify.app/auth/callback`。非預設連接埠需同步配置，勿用正式 origin 測本機登入。

登入只索取基本 Google 身分 scopes。擁有者從管理頁加入協作者信箱，首次登入綁定經驗證 UUID；撤銷後私有讀寫重新查驗資格。私人圖片短效網址最長 60 秒失效。未受邀帳號不能因為已通過 Google 登入而取得權限。

### 匯入、排程與成本

首次匯入限空演唱資料庫：取得 CSV → 預覽及修正錯誤 → 比對數量、影片 ID、時間與曲名／歌手 → digest 確認後交易匯入 → 備份並驗證前台，再切換資料來源。無效／非公開舊列保留待補，不編造時間。

每日工作在 00:17 UTC／08:17 台灣執行，受 GitHub `ARCHIVE_ENABLED=true` 控制；所需 secrets 見 `.github/workflows/archive-sync.yml`。七天試運轉需七個實際成功工作與人工檢查，之後仍需 owner 決定才啟用自動發布。系統要求完整掃描、核准曲名／歌手或別名、兩位不同作者、順序／數量一致、時間差不超過三秒及已知片長。OCR、衝突與未知拼寫留待審。

預算目標 NT$0、每月上限 NT$100。每月核對 Supabase DB／Storage／egress、Netlify 及 Actions／artifact 用量；接近額度先減少或停用工作，不自動升級或加值，不啟用付費 AI OCR／X API。

```sh
node --env-file=.env.local scripts/archive-sync.mjs
```

上列指令會寫入資料庫，不是唯讀測試。`scripts/archive-snapshot.mjs` 會更新 bundled snapshot，也需刻意執行。

## 備份與還原

後台完整備份／還原限 owner。下載目前加密備份 → 選擇舊備份 → 預覽數量 → 確認還原。預覽後有其他修改會拒絕還原。加密為 AES-256-GCM，包含私人圖片；遺失當時金鑰即無法解密。

備份不是 Supabase 整站 dump：Auth、成員權限與工作狀態不覆蓋；現有修訂保留，還原會新增歷史並重設自動發布試運轉。僅支援同專案；跨專案需另處理 Auth ID 對應。每日 artifact 保留七天；原始 API 留言／作者 ID／留言 URL 不收入備份，主資料庫依既有保留規則清理。

API 備份上傳最多 25 MB，收集圖片總量最多 50 MB，超限不得靜默略圖。超過主機 HTTP 上限時使用 CLI，先 inspect 再還原：

```sh
node --env-file=.env.local scripts/archive-backup.mjs backup archive-backup.enc
node --env-file=.env.local scripts/archive-backup.mjs inspect archive-backup.enc
node --env-file=.env.local scripts/archive-backup.mjs restore archive-backup.enc
```

CLI restore 額外需要有效 `SUPABASE_OWNER_ACCESS_TOKEN` 及 publishable key；service role 本身不能取代 owner。先備份目前資料，金鑰與操作檔只放忽略的本機目錄或安全保管處。

## 策展、來源與搜尋維護

[既有維護表](https://docs.google.com/spreadsheets/d/1j-5LAkXh1fZyqfTz4C26Djp8Dguleu-h4ImpLq80FRs/edit) 的 FanArt 欄位為 `url,artists,order,enabled`，FeaturedWorks 為 `source_url,pinned,order,enabled`。前者填作者 X 原帖與 CULUA／NEUN／MEDA 歸屬，後者填官方發行頁或 LinkCore。較小 order 排前；不複製曲名日期、不填未確認作品。

逐一把策展分頁「發布到網路」為 CSV，無痕確認可匿名開啟且首列欄位正確，再填對應環境變數。不要使用需要登入的 edit URL，不改既有歌回發布設定。未設定會顯示尚未設定；失敗保留可見錯誤。2026-10-07 的觀察是匿名 401，未重新驗證發布成功。

官方消息、發行、RSS 與策展快取 30 分鐘，下一次讀取才重新驗證。活動使用實際公演日期與日本時間，不用公告日／售票日替代；未確認發行日不列入時間軸。來源彼此隔離，MV 僅精確匹配官方原創，X 嵌入失敗仍提供作者原帖連結。素材署名與使用方式見 README。

上線後檢查正式域名的 robots、sitemap、canonical，再到 [Google Search Console](https://search.google.com/search-console/) 提交 sitemap 與檢查代表歌曲頁。用連續 28 天的曝光／點擊／CTR 比較，未取得數據不得聲稱已提升流量或知道下降原因。`scripts/verify-site.mjs` 歷史 sitemap 預期值為 646，數量不同須先調查合法資料變更。

## 驗證與尚待完成

### 2026-10-23 發布前複驗

- 接續既有未提交改版，包含後台四區、三語、確認卡、完整分頁缺漏查詢、展示模式、公開直播歌單及更新保留播放狀態。未執行 migration、sync、匯入或還原。
- `npm test` 因 Windows 沙箱子程序 `EPERM` 未能啟動測試；改用 `node --test --test-isolation=none tests/*.test.mjs`，71 項全部通過。lint、TypeScript、production build、差異檢查通過。build 以獲准的沙箱外執行方式完成，仍有 Browserslist 資料過期提示；沒有更新相依套件，也不宣稱無 audit 警示。
- 以 `npm start -- --port 3004` 啟動正式模式；`node scripts/verify-site.mjs http://localhost:3004` 通過。歷史 sitemap 預期 646 本次仍成立，為 639 個曲名頁加七個主要頁面。
- 新增可重跑的唯讀 `node scripts/verify-release.mjs <網址>`，本機通過：422 場直播、639 個曲名、3,131 筆演唱，公開索引與單場歌單數量／時間連結一致，公開 DTO 精確欄位白名單、canonical、robots、sitemap、管理頁 noindex 及 private/no-store、匿名管理／缺漏／匯出／備份 API 401。第二次讀取的來源時間更新至 `2026-10-23T14:40:09.808Z`，確認既有快取會重新查詢；不以首次回應宣稱即時資料。
- `node scripts/verify-content.mjs` 成功讀取官方發行與發行商來源；當次消息索引沒有符合的同期消息，不外推為官方沒有新消息。瀏覽器存取未獲授權，本輪沒有新增瀏覽器、真人協作者登入或真實圖片 OCR 驗收。

### 2026-10-23 正式發布確認

[PR #6](https://github.com/Samel0731/culua_song_list/pull/6) 已合併為 `30e7495cb82df714232075d7147645ff15b888a5`。PR 的 [Product checks 39972429488](https://github.com/Samel0731/culua_song_list/actions/runs/39972429488) 與合併後 [main 檢查 39972830132](https://github.com/Samel0731/culua_song_list/actions/runs/39972830132) 全部成功，包含 Node 22 的預設 `npm test`、lint、TypeScript 及 build。Netlify 預覽成功，預覽站 `verify-site` 通過；既有 GitHub 整合隨 main 更新發布正式站，未透過管理頁變更設定。

正式站原先 `/admin/demo` 為 404，發布後為 200。`node scripts/verify-release.mjs https://culuasonglist.netlify.app` 全部通過，來源時間為 `2026-10-23T14:51:39.420Z`；422 場、639 曲名、3,131 演唱及646筆 sitemap 保持一致。公開索引與 `z65138fhtm8` 單場歌單的數量／時間連結、公開白名單、頁面 canonical、robots、管理頁 noindex／private/no-store、匿名後台 API 401 均已從正式網址讀回確認。部署包含既有 OP／ED 解析修正；沒有重跑 worker 或變更自動發布設定。

可直接從正式 [展示後台](https://culuasonglist.netlify.app/admin/demo) 測試假資料，從 [直播歌單](https://culuasonglist.netlify.app/songs?view=streams) 查看公開內容。正式 owner／第二協作者登入及真實 OCR 新介面仍需真人驗收；七個實際成功試運轉日與 owner 決策、每月用量及 Search Console／策展發布仍未在本輪驗證。Git 命令列推送缺少可用登入流程，改用已連線 GitHub 外掛；發布前核對檔案樹雜湊與本機驗證版本一致。未提交本機設定截圖、金鑰或備份。

### 手機 Codex Cloud 接手

先讓完成的程式碼進入 GitHub `main`，手機雲端才取得已發布版本；本機未提交修改、`.env.local` 與本機對話不會因此自動變成雲端工作。接手時先讀 README、AGENTS 與本文件的最新有日期紀錄。

1. 在網頁或桌面版選擇 Work in → Cloud → Select environment → Create environment，選取 `Samel0731/culua_song_list`。若要求 GitHub 連線，由帳戶擁有者完成授權。
2. 要求 Node.js 22+、使用 npm/package-lock，安裝執行 `npm ci`。使用上方完整檢查指令；啟動預覽用 `npm run dev -- --hostname 0.0.0.0 --port 3000`。閱讀展示頁 `/admin/demo` 不需要正式憑證。
3. 一般程式碼工作保留 `ARCHIVE_DATA_SOURCE=sheet`，或使用 bundled fallback；無需複製本機 `.env.local`。正式 service role、備份金鑰、worker key 與 owner token 繼續保留原部署服務。雲端需要資料庫特有功能時，另由 owner 配置該工作真正需要的最小權限，勿貼入對話或提交 Git。
4. 檢查環境設定與實際安裝／測試結果，再選 Publish。網路需允許 npm 安裝套件；唯讀官方內容檢查另需對應來源域名。保留既有免費方案與成本限制。
5. 手機開啟 Codex，選擇已發布環境並建立工作。同一雲端工作可跨裝置續用；新工作使用環境範本，重要修改仍需提交 GitHub。這個本機 chat 不會因此被轉移。
6. 手機任務可寫：「在 Samel0731/culua_song_list，先讀三份專案文件並確認 main；完成這項修改，跑測試、lint、TypeScript、build 與差異檢查，建立 PR。不要操作正式資料、自動發布或金鑰。需要部署時先核對 CI，再合併並執行 node scripts/verify-release.mjs https://culuasonglist.netlify.app。」

依 [OpenAI Cloud environments 官方文件](https://learn.chatgpt.com/docs/environments/cloud-environments)於 2026-10-23 核對。這是專案接手設定說明，本輪未建立或發布使用者帳戶中的 Cloud 環境。

### 有日期的外部證據

2026-10-10：PR #4 合併為 `002d1477bf91fd1e2ee977d15923050258834e23`，Netlify deploy `6aca53f56a59be00080e2d14` 發布，正式來源為 Supabase。正式 owner Google OAuth 成功；匿名 admin／私人圖片 API 為 401 與 private/no-store。YouTube key、GitHub 工作閘門已設定；Actions `38062304452` 成功、用量六單位、發布零筆、七天加密 artifact 已驗證。這不是未來排程成功或目前設定的保證。

當時匯入基準：639 個曲名、658 種歌曲／歌手、3,131 筆演唱、422 場直播、8 筆私人待補。owner 同專案備份還原成功且成員保留；圖片雜湊比對成功。遠端 migration 歷史為九筆，包含 owner 綁定與四筆可靠性修正；不可僅依本地檔名推定遠端版本。

真實日英 setlist 圖曾量測一張：去除空格後 4/10 正確、1 誤字、5 漏辨；人工校正十首送審，沒有補造歌手或時間。不可外推整體 OCR 準確率。真實留言 OP／ED 日文引號與數字曲名修正，重跑為 9／7 候選、零發布，演唱數維持 3,131；解析修正的後續部署未由此證明。

試運轉起點 `2026-10-10T15:07:17.116324Z`。須完成七個實際成功日與 owner 決策才可開自動發布，不能只等日期經過。

### 2026-10-13 本機改版

上一輪完成四區後台、三步驟整理、三語、OCR 逐首校正及草稿／衝突流程；61 項測試、lint、TypeScript、build 和桌機／375px 展示檢查通過。此次新增確認卡、缺漏總覽、公開直播歌單、清單更新與三份文件整理。新增後可核對已儲存欄位、來源與缺漏；逾時確認會定位同一筆資料，發布後繼續編輯會前往公開演唱紀錄。尚未部署、未修改正式資料、自動發布保持既有設定。

### 2026-10-14 完成本輪本機驗證

- 69 項回歸測試全部通過，包含完整分頁缺漏查詢、公開白名單、儲存後讀取失敗、逾時收據定位與清空新增表單、已使用演唱順序阻擋發布、發布後編輯定位及刷新保留播放狀態。`npm test` 的隔離子程序曾受 EPERM 阻擋，使用專案允許的 `node --test --test-isolation=none tests/*.test.mjs` 完成。
- ESLint、`npx tsc --noEmit`、Webpack production build、`git diff --check` 通過。build 仍提示 Browserslist 資料過期，未為此變更相依套件。根目錄 Markdown 僅保留 README、AGENTS、PRODUCT_SETUP，本機文件連結檢查無失效。
- 使用 headless Edge 實際操作假資料：繁中／日文／英文各在 1440px 與 375px 完成新增直播、核對、建立候選、補欄位、儲存、發布及展示歌單預覽；切換語言保留輸入，沒有水平溢出、頁面例外或正式 admin API 寫入。日英前台另以固定歌單測最新場零歌曲、前一場、搜尋空結果、重新整理及瀏覽器返回。
- 日英各完成逾時確認與儲存後讀取失敗、模擬 OCR 逐首校正、無效時間就地提示與焦點；確認對話框包含對象及影響，起始焦點為取消，Tab 切換與 Escape 關閉通過。這是 AI／自動化檢查，未重新量測真實 OCR 辨識率。
- 本機 HTTP 唯讀檢查：匿名 `/api/admin/quality` 為 401 且 private/no-store；無效公開影片 ID 為 400；`/api/archive/streams` 為 200，讀得 422 場且當次未退回舊快照，未回傳成員、私人圖片、原始留言或操作錯誤欄位。這不是正式部署驗證。

同日收到繁中使用者回饋：「四個選單頁面看起來一樣」。確認功能原本有切換，但共用頁首與跨頁儲存結果造成辨識困難；改為各頁獨立標題與用途說明，切換後定位頁首，儲存卡限所屬區域，展示設定移到功能下方，管理區補上空資料提示。三語在 1440px／375px 的四個選單共 24 次瀏覽器切換通過，沒有水平溢出、頁面例外或正式 admin API 寫入；71 項回歸、lint、TypeScript、build 與差異檢查通過。

預覽另外發現組合歌單快取超過 Next.js 2 MB 上限，改為快取必要來源欄位，再投影公開歌單。當次快取 872,586 bytes，連續兩次公開讀取的查詢時間相同，422 場資料可重用 300 秒快取；維持發布後失效與公開白名單。

繁中可從 `http://localhost:3002/admin/demo` 測試假資料；前台入口為 `http://localhost:3002/songs?view=streams`。連接埠依本機啟動方式可變，正式 Google 登入須使用已設定的 callback origin。已收到並處理選單辨識回饋，完整真人操作任務仍待完成，不宣稱真人新手驗收完成。

仍需真人第二協作者 Google 登入、實際圖片 OCR 新介面驗收、七天工作人工觀察、每月用量及 Search Console／策展發布檢查。相依套件曾有 audit 警示，不宣稱無漏洞。

### 繁中實測任務與日英文檢查

你使用本機 `/admin/demo` 的協作者角色，依序：新增直播 → 核對確認卡 → 建立缺歌手／時間的候選 → 從待補資料找到並修正 → 儲存後發布 → 預覽展示歌單。再試切換語言保留草稿、逾時後確認，以及儲存成功但清單讀取失敗。每輪可重設，不寫入正式資料。

回報「任務、卡住位置、看到的文字、預期結果、是否需要提示」即可，不需提供帳號個資。目前只收到選單辨識回饋，完整繁中操作實測仍待完成；你不是獨立新手樣本，不外推其他人的上手能力。日英由 AI／自動化檢查流程、長文案、375px、鍵盤、焦點與狀態播報，不稱真人測試。

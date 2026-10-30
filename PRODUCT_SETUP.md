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

## 製作 Live House

進入 `/live-house`，不需登入。這是非官方虛擬演出，畫面登台不代表本人參與、背書或音源中存在合唱。

1. 初次開啟預覽六曲萬聖節場次：MEDA「Sing-ularity」0:00–3:50 → CULUA「ベビ・デビ」0:00–3:02 → NEUN「Heiliges Requiem」0:00–4:41，這三首僅主唱登台；再依序 MEDA「Id-Entity」0:00–3:52 → CULUA「夢追い人」0:00–4:28 → NEUN「Engelslied」0:00–4:30，三人同台。每人主唱兩首，總長 24:23；同台不代表音源有合唱。已有草稿保留原樣，需按「載入萬聖節演出」並確認才更新。
2. 按「編輯歌單與舞台」開啟抽屜。在「選歌與表演者」新增姓名、代表色、造型與選填素材來源。三位指定表演者使用各自低多邊形角色；其他人預設通用角色。頭像接受 PNG／JPEG、單張最多 5 MB，只在瀏覽器縮至長邊 512px，不上傳。
3. 搜尋公開歌庫並選演唱版本，或手動填曲名、原唱、YouTube 網址、起點與終點；「原唱」和「主表演者」分開。每場最多 12 位表演者、200 首，可重複加入。歌庫加入的片段沒有終點，需按「編輯」補齊；缺漏會列出歌曲並定位欄位，不能開演。時間接受秒數、分:秒、時:分:秒，終點必須晚於起點。上下移動按鈕可用鍵盤操作。
4. 「設計舞台」提供歌單情緒、文字主題、參考圖片。三語關鍵字匹配萬聖節／星空／雨夜／森林／霓虹；圖片只擷取配色，不辨識內容或重新繪圖。可調燈色、動態強度及種子；強度零與系統減少動態偏好停用角色動畫。舞台提供全景、主唱、重設視角，拖曳與縮放限制在舞台前方；WebGL 2 不可用時顯示靜態舞台與提示，播放仍可操作。
5. 按「開演／重新開演」使用當時快照；之後編輯只改草稿，重新開演才套用。每首到終點或原片自然結束時前進一次，最後一首停止。角色在各自安全區走動、踏步、揮手與輕跳；換曲重設站位並淡入，暫停、緩衝或錯誤時落地待機。追光跟隨主唱，兩道紫橘掃光緩慢移動，不分析音訊或宣稱精準跟拍。原片播放器保留播放／暫停、前後曲目與來源連結，可能受自動播放及嵌入限制，不保證無縫串接。
6. 按舞台「全螢幕」，原片維持至少 200×200，歌單預設收起，可按「演出順序」展開。桌機原片在右側，手機直向在下方；退出按鈕或 Escape 返回原按鈕。瀏覽器不支援或拒絕時改用填滿視窗的劇院模式並提示。模式只屬於目前介面，不會寫入專案。

場次自動存入此瀏覽器的 IndexedDB，不會同步其他裝置。在「場次與來源」使用匯出／匯入 JSON，內含縮小後圖片、造型識別與來源；格式為版本 2，仍接受版本 1，舊歌曲缺終點會保留待補，不猜時長。匯入最多 10 MB，驗證格式、圖片與角色引用後，確認才取代草稿，不改播放快照。讀取與寫入共用保存佇列，切換頁面會等待先前寫入；保存失敗保留目前分頁的記憶體草稿並提示匯出。重新載入整個網頁或清除瀏覽器資料可能遺失未保存內容。

所有舞台及角色動作由本機程式繪製，不分析音訊、不生成歌聲或 AI 圖片。新增服務費目標 NT$0，既有主機及影音流量仍受各服務額度約束。請自行提供有權使用的圖片並保留作者來源。

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

### 2026-10-30 角色配色與初期造型校正

- 依後續使用者附圖修正輪廓：MEDA 側髮縮薄、移除兩側尖尾，保留單束高馬尾；CULUA 增加後頸三束短狼尾；NEUN 增加兩側角、蝴蝶結中心與垂帶。以本機三視圖工具檢查白光與舞台色光，截圖為 `.archive-private/live-house-qa/hair-corrections.jpg`；屬 AI 視覺檢查，待真人驗收。

- 依序校正 NEUN、MEDA、CULUA，保留 Q 版比例與原有 rig。NEUN 依[指定肖像](https://hololist.net/wp-content/uploads/2024/08/neun-portrait-66.jpg)改為非金屬銀白長髮、白色外套與灰紫裙，增加耳側捲髮、頭飾、玫瑰和蝴蝶結；MEDA／CULUA 依 [RK Music 初期官方圖](https://hd.gree.net/jp/ja/news/press/2024/0514-01.html)改為莓紅／深藍髮及各自白黑／炭灰紫服裝。配色為目視近似值，不是官方色票。
- 將髮、服裝、袖、襪、鞋、飾件分成角色材質設定，額前貼面使用明確 sRGB 貼圖；只有硬體扣件使用金屬材質。白光檢查發現 MEDA 白色上身被黑內層遮住，以及 MEDA／CULUA 後腦露出頭部底色，均已修正。既有 appearance、保存版本 2、草稿、素材來源與播放／走位／全螢幕邏輯未改；新增三語「造型參考」連結，不把參考圖作為遠端執行時貼圖。
- 使用已讀取的 [threejs-materials skill](https://github.com/full-stack-skills/threejs-skills/blob/main/skills/threejs-materials/SKILL.md) 與 Three.js 材質文件。新增可重跑的 `node scripts/preview-character-looks.mjs [port]`，只綁定 `127.0.0.1`，固定檔案白名單，直接使用正式角色 factory／mixer；單一 WebGL context 輸出三人正面、60 度與背面，可切白光、紫橘光和動畫，不連接資料庫。
- `npm test` 87 項、lint、TypeScript 通過。新增 raycast 取樣核對實際服裝表面面積、後髮覆蓋、髮材質非金屬及貼圖色彩空間；保留單一 iframe、快照、匯入／匯出、動畫待機、減少動態與資源釋放回歸。AI 瀏覽器已檢查三人白光／色光三視圖及動畫；白光／紫橘光截圖保存在忽略的 `.archive-private/live-house-qa/looks-white.jpg`、`looks-colored.jpg`。這是 AI 檢查，未取得真人造型驗收。
- 正式 build、`git diff --check` 及 QA 腳本的額外 ESLint 通過。`npm start -- --port 3007` 後 `verify-site.mjs`／`verify-release.mjs` 通過，仍為 422 場、639 曲名、3,131 演唱與 647 sitemap entries；來源時間為 `2026-10-25T02:39:18.530Z`，不宣稱目前即時資料。`verify-content.mjs` 成功讀取官方作品與發行商，當次同期新聞為空。build 仍有 Browserslist 過期提示，不宣稱依賴無漏洞；PWA 檔由 build 產生。
- 正式模式實際檢查換曲、NEUN 主唱鏡頭、三人同台、暫停、375px 手機及全螢幕入口；手機全螢幕原片為 202×202、只有一個 iframe，普通手機版未水平溢出。日英造型參考文案與原素材來源同時顯示，最後回到繁中並暫停第六首三人段。頁面 console 未讀得 warning/error。減少動態與舊資料相容由既有測試覆蓋，沒有切換實機作業系統偏好，也沒有重播整場 24:23。
- 規格／標準兩軸審查沒有剩餘 P1／P2。檢閱網址 `http://localhost:3007/live-house`；未部署、未寫正式歌庫、未新增付費服務。角色三視圖工具為 `http://127.0.0.1:3010`，關閉後可用前述指令重開。

### 2026-10-25 六曲演出與全螢幕

- 六首完整官方 MV，先 MEDA／CULUA／NEUN 各自獨唱，再依同順序三人同台，總長 24:23。新增三首的作者、時長及當次可嵌入狀態已在規劃時讀取 YouTube 公開資料；播放可用性仍由 YouTube 當下決定。舊草稿不會自動換成六曲。
- 劉海改為貼面曲面與本機材質；保留後髮與髮飾。角色以 AnimationMixer 混合踏步、小跑、揮手與輕跳，路徑與肢體分開；每人時序依 ID／seed 決定，換曲在新站位短暫淡入以避免穿身。暫停落地待機，減少動態／強度零仍更新主唱站位。追光跟隨主唱，紫橘掃光與光束同向，只有主唱光源投射陰影。
- 參考社群 [threejs-animation](https://github.com/full-stack-skills/threejs-skills/blob/main/skills/threejs-animation/SKILL.md)、[threejs-materials](https://github.com/full-stack-skills/threejs-skills/blob/main/skills/threejs-materials/SKILL.md)、[threejs-lights](https://github.com/full-stack-skills/threejs-skills/blob/main/skills/threejs-lights/SKILL.md)，不是付費生成或舞台藝術專用服務。沒有新增依賴、雲端寫入或部署，保存版本仍為 2。
- `npm test` 86 項、lint、TypeScript 通過；最後的全螢幕取消回應修正另重跑 Live House 15 項通過。測試涵蓋六曲去重與最後停止、角色路徑間距／跳躍落地、真實 mixer 回到待機、貼面材質、減少動態換位、背景停繪與清理；原生全螢幕、拒絕後劇院備援、Escape 焦點、離頁／返回及延遲請求由 DOM 邊界測試驗證。
- AI 瀏覽器在開發模式實際檢查獨唱／三人同台、前額與側髮、走位、輕跳、追光與掃光；375×812 繁中／日文／英文、全螢幕歌單展開、按鈕與 Escape 返回均可操作。手機全螢幕舞台 canvas 約 374×527，原片 202×202，控制列底端約 594、原片從約 600 開始，未重疊或水平溢出。這些是 AI 檢查，尚未取得真人繁中驗收；未切換實機減少動態偏好。
- 正式 build、`git diff --check` 通過，使用 `npm start -- --port 3007`；`verify-site.mjs`／`verify-release.mjs` 通過，仍為 422 場、639 曲名、3,131 演唱與 647 sitemap entries。回應來源時間為 `2026-10-24T15:07:24.060Z`，不是本輪即時保證。`verify-content.mjs` 成功讀取官方作品／發行商，當次同期新聞為空，不外推為官方沒有新消息。build 保留 Browserslist 過期提示及既有依賴 audit 限制；PWA 檔由 build 產生。
- 正式模式匯入六首各 6 秒的測試場次，不手動跳曲即從前三首單人播到三人段，最後停在「本場已結束：Engelslied」；iframe 始終只有一個，播放器 widget 身分未變。之後確認還原完整 24:23 預設，檢閱第四首三人段與 1440×1000 全螢幕，最後暫停供檢閱。未將短片段測試宣稱為完整 24:23 實播；正式版 console 未讀得 warning/error。拒絕 Fullscreen API 的備援與延遲回應由 DOM 測試模擬，未強制變更實機瀏覽器設定。
- 規格與標準兩軸唯讀審查後，修正減少動態換曲未套站位及交換位置穿身，複查沒有剩餘 P1／P2。可從 `http://localhost:3007/live-house` 檢閱；本輪仍未部署或操作正式資料。

### 2026-10-24 3D 萬聖節改版

- 舞台改用按需載入的 Three.js `0.186.1`／型別 `0.186.0`；程式建立三位立體角色、南瓜、枯樹、月亮、薄霧與階梯。大型舞台搭配預設關閉的編輯抽屜；共用播放器仍是同一個 iframe。沒有新增付費服務、正式資料寫入或部署。
- `npm test` 84 項通過，包含必填終點、版本 1 遷移、版本 2 匯出入、缺漏定位、直接呼叫 `startLive` 防護、三首順序與最後停止、終點／自然結束去重、快照、播放器回歸。使用真實 Three.js 幾何測試角色體積、差異與資源釋放；模擬 GPU 邊界驗證背景／減少動態停繪、初始化失敗回收及重複清理。非法匯入會開啟抽屜並聚焦錯誤。Windows 正常隔離模式可執行；另試 `--test-isolation=none` 時兩個 DOM 檔的全域 hooks 衝突，未採為通過結果。
- `npm run lint`、`npx tsc --noEmit`、`npm run build`、`git diff --check` 通過。正式模式 `npm start -- --port 3006` 的 `verify-site.mjs`／`verify-release.mjs` 通過：422 場、639 曲名、3,131 演唱、647 sitemap entries，來源讀回時間 `2026-10-24T15:07:24.060Z`。`verify-content.mjs` 成功讀取官方作品及發行商，當次沒有符合的同期新聞；不代表官方沒有新消息。build 保留 Browserslist 過期提示，PWA 檔案由 build 產生。
- AI 瀏覽器以 1440×1000、375×812 檢查繁中／日文／英文、主唱鏡頭、換曲換人、抽屜及 Escape 返回焦點，未見水平溢出。桌機舞台約 1123×700、佔主要區域約 80%；手機 canvas 約 344×486（舞台外框約 488 高），原片 320×202 在下方，桌機原片約 235×202。三首切換後仍只有一個 iframe。繁中同樣是 AI 操作，尚未取得真人驗收。
- 正式 build 的 AI 瀏覽器連續大幅拖曳兩側及上下、滾輪縮放，鏡頭維持舞台前方；全景／主唱／重設按鈕可用。實播發現換片送出的舊 PAUSED 事件會誤暫停新曲，已改為新請求收到 PLAYING 後才接受 iframe PAUSED，並加入回歸。匯入三首各 6 秒的本機測試場次後，不手動跳曲即自動到 NEUN，再顯示「本場已結束」，全程單一 iframe。之後還原完整 11:33 預設並暫停；未宣稱連續完整 MV 實播。正式版本 console 未讀得 warning/error。
- WebGL 不可用、儲存失敗、系統減少動態與背景停止繪製由 DOM／runtime 測試模擬；沒有切換實機作業系統偏好。真人繁中驗收尚待進行，AI 日英文檢查不等於真人新手驗收。依賴仍有 npm audit 警示，不宣稱無漏洞。本輪本機檢閱網址為 `http://localhost:3006/live-house`；未部署。

### 2026-10-24 Live House 本機完成

- 新增 `/live-house` 的公開歌庫選版、外部 YouTube 片段、主唱與其他登台角色、三語編輯、2D 舞台、本機頭像及圖片取色、IndexedDB 保存與 JSON 匯入／匯出。舞台使用程式規則，沒有新增付費服務、資料庫寫入、migration、sync、還原或部署。
- `npm test` 的 77 項測試、`npm run lint`、`npx tsc --noEmit`、`npm run build` 與 `git diff --check` 通過。新增回歸涵蓋格式／時間／角色引用、重複歌曲排序、主題與配色、開演快照、有限佇列、片段只結束一次、延遲舊結束事件、緩衝後自然結束、唯一 iframe、儲存失敗和跨頁保存佇列。build 仍有 Browserslist 資料過期提示，未更新套件或宣稱無 audit 警示；PWA 檔案由 build 產生，沒有手改。
- 本機 `npm start -- --port 3005`；`node scripts/verify-site.mjs http://localhost:3005` 與 `node scripts/verify-release.mjs http://localhost:3005` 通過。公開投影仍為 422 場、639 曲名、3,131 演唱；首次來源時間為 `2026-10-23T14:40:09.808Z`，最後讀回為 `2026-10-24T13:48:19.416Z`，保留查詢時間而不宣稱即時資料。Sitemap 從 646 增為 647，新增的是工具入口，不含本機場次。已將 `verify-site` 的歷史固定數字改為核對公開主要頁及實際歌曲索引，並讓兩個檢查腳本包含 Live House。
- AI 瀏覽器在開發及正式 build 實際驗證新增表演者、歌庫選版、外部片段、登台角色、文字主題、圖片取色、匯出後驗證匯入、預設取消焦點及重開還原。800×600 測試圖確實縮為 512×384；錯誤終點保留原輸入並聚焦提示；鍵盤排序後焦點留在可操作按鈕。開演後改草稿不改演出快照，片段到終點自動前進，最後停止。瀏覽器 console 未讀得頁面錯誤。
- 繁中／日文／英文均檢查 375px 與 1440px，未出現水平溢出。正式版原片 iframe 在手機為 200×200、桌機約 355×201，並保持單一播放器。強度零已實際確認停用動態；系統減少動態分支有 CSS 支援，但本輪未切換作業系統偏好。自動播放受阻／嵌入錯誤與儲存失敗另由 DOM 測試模擬，不宣稱所有真實瀏覽器與影片都可播放，也不將 AI 三語檢查當成真人新手驗收。

可從 `http://localhost:3005/live-house` 檢閱本機結果。正式站尚未部署本輪功能，真人操作與個別影片的可嵌入性仍需依實際使用確認。

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
- 本次髮型修正後重新執行：87 項測試、lint、TypeScript、build、差異檢查及本機 `verify-site.mjs http://localhost:3007` 通過。

### 2026-10-30 表演與自動攝影示範

- 單人以 24 秒通用循環走位、踏步、揮手及輕跳，鏡頭在停穩段推近，走位／跳躍維持全身；三人共用時間進行主唱招手、側後方回應與同步跳躍。尚無人工歌曲段落標記，不宣稱跟拍。
- 新增三語「自動攝影」開關；選固定視角或拖曳後交回手動，按開關恢復。暫停、減少動態與強度零不自動運鏡。狀態不寫入專案，未改播放器。
- 示範檢查：88 項測試、lint、TypeScript、build 及 3009 本機網站檢查通過；瀏覽器確認單人／三人曲切換、固定視角停用與按鈕恢復自動攝影，iframe 保持 widget2。手機構圖檢查發現側邊裁切，已加寬直向視野並使自動鏡頭置中；此修正另重跑完整檢查。尚未逐首標記或觀看整場，尚待使用者真人驗收。
- 最終直向視野修正後：88 項測試、lint、TypeScript、build 再次通過。3009 已重啟新版；瀏覽器可開始單人演出，最後三人複查遭瀏覽器輸入逾時中止，因此不宣稱完成最終手機三人視覺驗收。

### 2026-10-31 自動攝影排程修正

- 發現自動鏡頭 `controls.update()` 的 change 事件會在繪製中排入下一幀，繪製尾端又無條件新增另一幀，造成多條 RAF 迴圈且無法完整取消。尾端改用同一個去重 invalidate，最多保留一個待執行回呼。自動攝影預設關閉，仍可手動開啟；未移除角色動畫與鏡頭功能。
- 修正後 88 項測試、lint、TypeScript、build、git diff --check 與 `verify-site.mjs http://localhost:3011` 通過。未測得實機 FPS 或長時間 GPU 數據，不宣稱已完成流暢度真人驗收；瀏覽器工具無法關閉舊示範分頁。請關閉舊演出分頁後使用 3011 修正版，避免舊迴圈繼續消耗資源。

### 2026-10-31 桌機優先測試版發布準備

- 依使用者決定加入繁中／日文／英文測試版標示，取代頁首 VIRTUAL CONCERT 小字，不擴大標題區；自動攝影預設關閉。未部署或合併。
- 發布驗收已確認 Chrome 375px 無水平溢出、普通原片 320×202、劇院備援 202×202、Escape 返回入口焦點及唯一 widget2。匯出檔已實際下載；匯入重開、完整六曲不間斷實播與實體手機驗收尚未完成。使用者選擇桌機優先測試版，不將這些項目記為通過。
- 已讀取 [RK Music 官方二創規範](https://rkmusic.jp/guideline/)（2026-10-31）：個人非營利創作須遵守規範，避免官方誤認、註冊商標及第三方權利侵害；該規範不代表第三方素材或所有音樂用途均獲授權。保留現有來源及非官方聲明，未代為聯繫或取得個別授權。
- 發布流程：先使用預覽網址檢查 HTTPS 的播放器、開始播放、下一首、最後停止、JSON 還原與 PWA 更新，再核對 CI／部署連動後合併；保留上一版本可回退。正式上線後執行 verify-site／verify-release，另確認播放器與網站前後台可用；不重跑 migration、worker 或正式資料寫入。
- 本輪 88 項測試、lint、TypeScript、build、git diff --check 及 `verify-site.mjs http://localhost:3014` 通過；HTTP 讀回確認頁首含「桌機優先測試版」。未將 HTTP 檢查當作手機或完整實播驗收。

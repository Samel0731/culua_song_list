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

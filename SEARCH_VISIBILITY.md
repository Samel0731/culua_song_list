# 搜尋曝光與上線後檢查

## 程式已處理

- 每個主要內容頁擁有獨立 canonical、標題、描述、Open Graph 與 X 分享卡。
- 歌曲有獨立 `/songs/<曲名>` 頁，伺服器輸出演唱版本與原片連結；可分享含指定影片及時間戳的本站連結。
- `/songs` 提供完整的歌曲連結索引，搜尋引擎不需操作無限捲動才找得到歌曲頁。
- sitemap 包含首頁、原創、新聞、活動、粉絲創作、關於與所有歌曲頁；不把導向頁或 query 篩選重複列入。
- 來源集合使用 CollectionPage / ItemList，歌曲頁標示實際的版本連結。沒有把連結索引冒充本站撰寫的官方新聞，也沒有以缺漏場地與時間的活動資料宣稱可得到 Google Event rich results。
- PWA 只快取静態資產，內容頁使用網路與 Next.js 資料快取，避免離線快取長期遮住最新消息。
- 根 metadata 已有 Google Search Console 驗證 token，沿用既有設定。

## 網站擁有者上線後要做

1. 部署到既有 Netlify 站點，確認不是測試部署網址；檢查 `/robots.txt`、`/sitemap.xml`、各頁 canonical 與 200 回應。
2. 在 [Google Search Console](https://search.google.com/search-console/) 選此站的資源，提交 `https://culuasonglist.netlify.app/sitemap.xml`。
3. 使用 URL 檢查工具檢查首頁、歌曲索引及幾首代表曲目，查看即時測試與收錄原因，再對重要頁要求建立索引。
4. 在效能報表用連續 28 天比較曝光、點擊、CTR 與搜尋字詞；先判斷是否未收錄，再判斷是否標題與內容不符合搜尋意圖。收錄或結構化資料不保證排名與點擊。
5. 由站主在自己的公開社群介紹歌回搜尋及歌曲連結功能，並把網址放在自己的相關個人介紹。每次分享使用能直接解決問題的歌曲頁或活動頁，避免只有首頁網址。此改版沒有自動替你發文或私訊作者。

目前沒有接入流量追蹤帳號，不能據程式推斷網站歷史訪客數或實際掉流量原因。先使用 Search Console 檢查自然搜尋；需要其他來源的流量數據時，再選擇分析服務與相關隱私設定。

官方參考：[建立及提交 Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)、[要求重新檢索](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)、[標題連結](https://developers.google.com/search/docs/appearance/title-link)。

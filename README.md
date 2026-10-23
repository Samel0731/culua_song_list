# CULUA Song List

CULUA 的非官方、非營利歌回資料庫，提供歌曲搜尋、直播歌單、共用播放器，以及 CULUA／NEUN／MEDA 的官方消息與活動整理。

CULUA の非公式・非営利の歌枠アーカイブです。曲・配信のセットリストを検索できます。

An unofficial, non-commercial CULUA music archive with searchable songs and stream setlists. Interface languages: Traditional Chinese, Japanese and English.

[正式網站](https://culuasonglist.netlify.app) · [操作與維護](PRODUCT_SETUP.md) · [開發規範](AGENTS.md)

## 本機啟動與檢查

使用 Node.js 22+、npm。保留既有 `.env.local`；需要設定時參考 `.env.example`，不要覆蓋或提交金鑰。

```sh
npm ci
npm run dev
```

開啟 `http://localhost:3000`。`/admin/demo` 是假資料展示，可切換協作者／擁有者、重設及模擬儲存失敗情境；不會寫入正式資料。`/admin` 需要受邀 Google 帳號。

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

正式模式啟動後，以 `node scripts/verify-release.mjs http://localhost:3000` 檢查頁面、公開歌單、時間連結及匿名後台權限；部署後將網址換成正式站。手機 Codex Cloud 的環境與接手步驟見 [操作與維護](PRODUCT_SETUP.md#手機-codex-cloud-接手)。

若測試子程序遭 `EPERM` 阻擋，使用 `node --test --test-isolation=none tests/*.test.mjs`。正式預覽用 `npm run build` 後接 `npm start`。本機檢查不會部署。

Next.js 16.3.8 App Router、React 19.2.8、TypeScript strict、Tailwind 4、Supabase。開發與 build 使用 Webpack 配合 next-pwa；開發時不產生 PWA service worker。

`ARCHIVE_DATA_SOURCE` 未設定時使用公開 Sheet；Supabase 模式需設定伺服器與公開金鑰。官方消息與策展按需快取 30 分鐘，歌單快取 5 分鐘；每日 YouTube 工作是獨立排程。細節見維護文件。

## 內容來源與聲明

本站不是 CULUA 或經紀公司的官方網站，未獲官方背書。音樂、影片、圖片及創作權利屬原作者與權利人；保留原始來源及作者署名。

- [RK Music CULUA](https://rkmusic.jp/artist/284/)：人物資料以三語摘要呈現；消息與發行頁連回官方，不複製文章全文。
- [RK Music](https://rkmusic.jp/)、TuneCore／LinkCore 官方發行頁、CULUA 官方 YouTube 頻道 `UCn1Zf28m6WbhMDjMjdIjOIA`：發行、日期、原創 MV 與影片資訊。精選不是完整官方目錄。
- YouTube 縮圖隨對應影片顯示，使用官方 iframe API 播放，不抽取音訊、不下載重包裝官方美術。禁止嵌入時仍提供原片連結。
- 歌回資料來自既有粉絲維護 Sheet 與經審核的資料庫。歌曲保留原名、原唱及演唱時間；無法確認的資料不編造補齊。
- 粉絲作品使用經策展的 X 原帖嵌入、作者署名與原帖外連，不將圖片複製到專案。
- 首頁與分享圖使用程式繪製的文字和燈光；未將官方角色圖或標誌當成可任意使用素材。[RK Music 二次創作規範](https://rkmusic.jp/guideline/)於 2026-10-07 查閱，未據此宣稱所有官方美術可直接重用。

歡迎透過 issue／PR 回報錯誤。修改播放、資料來源或權限前，請閱讀開發規範並執行相應測試。

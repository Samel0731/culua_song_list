# Culua Song Database (Unofficial)

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Status](https://img.shields.io/badge/Status-Active-success)]()

**Culua Song Database** is an open-source, non-official archive project documenting the musical activities of VSinger **Culua**.

The primary goal is to provide a structured, searchable, and constantly updated index of all songs performed by Culua on YouTube, including original releases and cover songs from live streams.

🔗 **Live Website:** [https://culuasonglist.netlify.app](https://culuasonglist.netlify.app)

---

### 🇯🇵 日本語紹介
**Culua 歌枠データベース**は、VSinger **Culua** の音楽活動を記録する非公式のアーカイブプロジェクトです。
YouTubeでの歌枠（生配信）やカバー動画、オリジナル曲を網羅し、検索可能なデータベースとして提供しています。データはサーバーサイドで定期的に同期され、常に最新の状態を保つよう設計されています。

### 🇹🇼 專案簡介
**Culua 非官方歌回資料庫** 是一個開源的粉絲專案，旨在完整記錄 VSinger **Culua** 的音樂歷程。
本專案透過自動化技術整理 Culua 在 YouTube 上演唱過的所有歌曲（包含原創曲與翻唱），提供快速檢索與播放功能，並透過伺服器端渲染 (SSR) 確保資料的完整性與 SEO 友善度。

---

## ✨ Key Features

* **Comprehensive Indexing:** Tracks original songs, covers, and stream archives.
* **Server-Side Rendering (SSR):** Optimized for SEO and AI search discoverability.
* **Automated Synchronization:** Uses **Incremental Static Regeneration (ISR)** to periodically fetch the latest data from the official source (Google Sheets / YouTube) without manual rebuilding.
* **Multilingual Support:** Fully localized in English, Japanese, and Traditional Chinese.
* **Progressive Web App (PWA):** Installable on mobile devices for an app-like experience.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Data Source:** Published Google Sheets CSV & YouTube iframe API
* **Live hosting:** Netlify

## ⚠️ Disclaimer

This is a **fan-made, non-commercial project**. It is not affiliated with, endorsed by, or connected to Culua or her management team.

* **Content Rights:** All copyrights for the audio, video, and images belong to the original creators and the official rights holders.
* **Media Usage:** This website uses the official YouTube Embedded Player API. Links to the original videos are provided.

---

## 🤝 Contribution

Contributions are welcome! If you find any bugs or have suggestions for new features, please feel free to open an issue or submit a pull request.
## Local preview and validation

Use Node.js 20.9+ and run commands from this directory:

```sh
npm ci
npm run dev
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Development uses Webpack to match the existing PWA integration and avoid stale Turbopack stylesheet caching observed during the redesign. Open http://localhost:3000. PWA generation is disabled in development; use `npm run build` followed by `npm start` to check the production service worker.

The stage redesign uses shared black/purple styles, three-language navigation, a curated original-work collection, and the existing searchable performance archive. A single YouTube iframe survives client-side route changes and player expansion. Closing playback destroys it. The visible mini-video is retained in focus mode. Some archived videos may be deleted or have embedding disabled; the player displays an error with original-video and next-song actions.

`npm test` runs React/DOM regression tests with a mocked YouTube API, without fetching external media. It covers timestamp changes within one stream, replay/loop/shuffle behavior, empty-data fallback, player persistence and blocked/error callbacks. Asset decisions and sources are recorded in [ASSET_SOURCES.md](ASSET_SOURCES.md).

The repository has pre-existing ESLint findings in statistics, social integrations, CSV helpers and language initialization; run ESLint directly to inspect the current results. This redesign does not publish to Netlify.

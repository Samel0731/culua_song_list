# 改版驗證紀錄

2026-10-07，本機正式版預覽：http://localhost:3000/

## 自動檢查

- `npx tsc --noEmit`：通過。
- `npm run build`：通過。
- `npm test`：5 項播放器回歸測試通過，包含同影片不同時間點、循環、隨機、空資料、持續掛載、播放受阻與錯誤處理。
- 全專案 ESLint：仍有既有 16 errors / 7 warnings，位於 social-config、social、stats、LanguageContext 原有語言初始化、next.config、dataProcessor 和未使用的 HeroSection；本次新增元件及測試已通過針對性檢查。
- `git diff --check` 原有 HeroSection 的行尾空白保留，避免修改使用者既有工作。

## 瀏覽器檢查

- 桌面、768px 平板與 390px 手機：導覽、主視覺、歌曲卡片、固定控制列及展開影片。
- 歌曲搜尋、排序、繁中／日文／英文切換、歌手索引、分享圖片下載。
- 可見 YouTube 影片播放；展開、收合、換頁、專注模式沿用同一 iframe。
- 正式版停止關閉再重新播放成功，沒有播放器初始化錯誤。
- 舊歌回的部分影片已無法播放：顯示提示、手動播放、下一首及原影片入口。

角色主圖未取得明確使用授權，採用文字、霧光與作品縮圖的備用設計；來源見 ASSET_SOURCES.md。未發布至 Netlify。

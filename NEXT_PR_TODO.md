# 下一個 PR：正式上線與自動匯入驗收

2026-10-10 接續執行。PR #3 已關閉；可靠性修正、migration 與報告已提交到 `codex/archive-production-rollout` 的 PR #4。GitHub Product checks 通過；50 項測試、lint、TypeScript、production build 與本地公開頁面驗證通過。尚未合併或部署，因 Netlify／GitHub 設定頁尚未登入，YouTube API 啟用與受限金鑰授權仍待完成。不要重播遠端 migration。

## 已完成的實際狀態

- 正式 Sheet 已交易匯入 Supabase：658 組歌曲／歌手、3,131 筆演唱、422 場直播、8 筆非公開待補。CSV 摘要與逐筆比對資料在忽略的 `.archive-private/`。
- 本地 `ARCHIVE_DATA_SOURCE=supabase`；Netlify 正式來源尚未切換。
- owner 已綁定；同專案加密備份還原成功、內容一致、成員權限保留。
- 真實官方私人圖片已儲存，日英 OCR 人工校正10首，保留待審、無假時間／歌手。圖片加密備份雜湊驗證成功。
- 已套用四個可靠性修正，遠端共九筆 migration；衝突使用 PT409，真實雙視窗草稿／目前版本提示成功。48 項自動測試通過。

## 接續工作

1. 檢查本地變更、最新 production build 的結束狀態；完成 lint、TypeScript、build、diff check，提交已完成修改並建立新的 `codex/` 分支／PR。不要提交金鑰、CSV、加密備份或 `.archive-private/`。
2. 本人登入 GitHub 與 Netlify 管理頁；确认允許 Google Cloud 啟用 YouTube Data API v3（包含 API 條款）及建立只限該 API 的金鑰。未確認前不啟用或建立金鑰。
3. 安全配置 GitHub／Netlify 服務金鑰、備份與快取密鑰；本機副本 `.archive-private/keys.env` 另存擁有者安全保管位置。核對免費額度，不啟用付費方案或加值。
4. 設定官方頻道 `UCn1Zf28m6WbhMDjMjdIjOIA`，執行候選 worker 與重跑驗收、啟用每日08:17台灣時間工作，確認實際成功與備份 artifact。重新記錄有效試運轉起點，自動發布保持關閉，完成七天實際運行後由 owner 決定。
5. 邀請明確指定的第二個真實 Google 帳號，驗收協作者圖片→校正→審核→發布與撤銷；隔離測試不能代替真實登入流程。
6. 已核對10首 OCR 候選均有同影片同曲名的正式演唱；透過真實 owner 後台全部標記為排除，保留來源與審計。演唱仍為3,131筆。OCR 第二輪只有4/10曲名正確（去多餘空白）、1誤字、5漏辨；繼續改善圖片處理，維持人工審核。
7. 新 PR 通過檢查後依 repository 流程合併、部署 Netlify，正式環境切換 `supabase`；驗收來源、OAuth、私人圖片、搜尋／統計、舊網址、timestamp 播放。可切回 `sheet`，不刪資料庫。
8. 更新部署版本、工作用量與測試報告。尚未取得部署／每日工作成功證據前，不宣稱產品上線完成。

詳細實測見 `BACKEND_TEST_REPORT.md`、`VERIFICATION.md`；設定見 `PRODUCT_SETUP.md`。正式歌單已匯入，下一階段不得再次首次匯入。

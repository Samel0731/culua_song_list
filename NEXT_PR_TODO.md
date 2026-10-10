# 上線後待辦

2026-10-10：PR #4 已合併，main `002d1477` 已發布至 Netlify；正式網站使用 Supabase，Google owner 登入成功。每日候選工作閘門已啟用，Actions 工作38062304452及加密備份成功。真實留言解析修正另以 `codex/archive-live-parser-fix` 接續 PR，不重播 migration、不重新首次匯入。

1. 完成解析修正 PR 的 CI、合併及正式部署驗證；日文引號 OP／ED 排除、數字曲名保留，本地真實重跑9／7筆待審，演唱仍3,131筆。
2. 從2026-10-10T15:07:17.116324Z開始完成七天實際每日工作及人工檢查；自動發布保持關閉，最早10月17日晚間由 owner 決定。
3. 使用 owner 明確指定的第二個 Google 帳號驗收協作者登入、圖片→校正→審核→發布與撤銷，不能用隔離測試代替。
4. 改善日英 OCR；真實圖片目前去多餘空白後4/10正確、1誤字、5漏辨，維持人工審核，不猜時間及歌手。重複的十筆 OCR 候選已排除並保留歷史。
5. 定期驗證 Actions 備份及還原；首個 artifact 已下載解密，658首、3,131演唱、422直播、1張圖片，圖片雜湊與既有備份一致。owner 同專案還原已成功。
6. 記錄 Netlify／Supabase／YouTube／GitHub 每月實際用量，維持免費方案及NT$100上限；檢查相依套件警示及 Actions 執行環境更新。
7. 發布可選策展 Sheet 分頁及填入來源、Search Console 後續；不影響 Supabase 正式歌單。

詳細見 BACKEND_TEST_REPORT.md、VERIFICATION.md、PRODUCT_SETUP.md。金鑰、原始 CSV、備份與內部畫面只留忽略的本機目錄。

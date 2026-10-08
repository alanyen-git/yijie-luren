# 異界旅人

獨立 RPG 專案，程式、資料、美術、存檔與發佈流程均由此儲存庫維護。

- 正式儲存庫：https://github.com/alanyen-git/yijie-luren
- 遊戲原始碼：`game/`
- 網頁版：https://alanyen-git.github.io/yijie-luren/app/
- APK：https://github.com/alanyen-git/yijie-luren/releases/tag/android-apk-latest
- Android 識別碼：`com.alanyen.yijieluren`
- 本機存檔、手動槽及診斷資料使用 `yijie_luren_` 名稱，與其他遊戲分開。舊版存檔可透過匯出／匯入移轉。

網頁與 Android 共用本專案 `game/` 原始碼。所有更新檢查只連到本儲存庫，不連動其他遊戲。

## 驗證與建置

```sh
npm test
npm run prepare:web
npm run test:bundle
npm run prepare:android
```

目前版本：CURRENT-1.134.0；完成所有既有城鎮資料盤點，補齊 22 個可遊玩城鎮的地圖鏈、設施、道路、NPC 與地方委託，並將 30 個推演聚落明確標記為鎖定的地圖背景；跨區旅行仍維持劇情或通行證解鎖。版本分離前的 Git 紀錄僅供歷史追溯。

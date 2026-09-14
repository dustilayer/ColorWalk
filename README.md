[繁體中文](README.md) ｜ [简体中文](README.zh-CN.md) ｜ [English](README.en.md)

# ColorWalk · 色彩漫步

把散步變成顏色收集遊戲：選擇主題色與嚴格度，用相機記錄沿途顏色，結束後保存色卡並查看檔案。在線體驗：https://color-walk-sable.vercel.app。

## 第一次使用

先安裝 Node.js 22.12+ LTS，下載並解壓倉庫，在包含 package.json 的文件夾打開終端，然後依次執行：

```sh
npm ci
npm run dev
```

保持終端打開，在瀏覽器訪問終端顯示的地址。結束時在終端按 Ctrl+C。

初次使用先選主題、設置規則，再允許相機訪問。localhost 可使用相機，公開部署需 HTTPS。照片使用瀏覽器本地存儲；刪除站點數據會丟失檔案。可選 Supabase 配置用於統計，未配置時相關功能不可用；生產端權限需單獨核驗。README 的三語言入口不等於每個界面文本都完成了翻譯測試。未經授權，請勿用於商業用途。

## 讀代碼或修改時看哪裡

| 文件 | 作用 |
|---|---|
| `src/App.jsx` | 頁面切換、行走流程與舊數據遷移 |
| `src/pages` | 各功能頁面 |
| `src/utils/colorUtils.js` | 顏色匹配規則 |
| `src/utils/i18n.js` | 界面翻譯 |
| `src/utils/storage.js` | 照片本地存儲 |

## 修改後怎麼檢查

運行 `npm run lint` 執行已配置的類型檢查，運行 `npm run build` 構建生產文件。通過檢查不代表相機權限、數據恢復或所有頁面都已實測。

## 詳細參考

[原有說明](README.original.md) 保留歷史細節和來源署名，語言保持原樣。部分描述屬於舊版本；有差異時以當前源碼和本入口說明為準。

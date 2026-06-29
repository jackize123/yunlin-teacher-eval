# CLAUDE.md — 雲林縣數位教學評估系統（智慧黑板進階檢核）

給 Claude / 開發者下次接手時快速進入狀況用。

## 這是什麼
雲林縣國中小教師「數位教學能力」自評系統。老師選身分→填 20 題（A/B/C/D 四維度各 5 題）
→送出存進 Firestore；學校端與縣府端可看統計與匯出 Excel。

## 技術棧
- Vite + React 18 + TypeScript（**整支 app 在單一檔案 `src/App.tsx`**，約 1300 行）
- Tailwind CSS v3（+ `tailwindcss-animate`）
- Firebase Firestore（雲端資料庫）
- lucide-react（圖示）
- 樣式為 RWD，手機優先（多數老師用手機填報）

> 註：原本用 recharts 畫迷你折線圖，已移除（不再是相依套件中的必要項）。

## 重要指令（在 `website/` 目錄）
```powershell
npm install          # 安裝
npm run dev          # 本機開發 (http://localhost:5173)
npm run build        # 產出 dist/
```
本機環境：Windows + PowerShell 5.1，node v24。

## 部署：GitHub → Vercel（自動部署）
- GitHub repo：https://github.com/jackize123/yunlin-teacher-eval
- Vercel 連結此 repo，**推到 main 就自動重新部署**。
- 更新流程：`git add . && git commit -m "..." && git push`
- 設定檔：`vercel.json`（framework=vite, output=dist, SPA rewrite）
- 注意：push 偶爾會超過 2 分鐘工具逾時，但通常已成功；用 `git status -sb` 確認是否與 origin 同步。

## Firebase / Firestore
- 專案 ID：`yunlin-teacher-eval`（config 直接寫在 `src/App.tsx` 最上方）
- 集合：`assessments`（每次填報一筆 doc）
- **Firestore 規則**：要允許 `assessments` 讀寫，否則老師送出會失敗。測試用寬鬆規則：
  ```
  match /assessments/{doc} { allow read, write: if true; }
  ```
  正式上線應收緊（目前尚未收緊）。

## 登入與權限（現況）
- 三個分頁：首頁 / 教師自評 / 各校後台 / 大數據後台
- **各校後台**密碼 = 學校 6 碼代碼（`handleSchoolAdminLogin`）。表格與匯出已用 `schoolCode` 過濾，
  各校匯出為「單一以校名命名的工作表」。
- **大數據後台**密碼寫死在 `handleSuperAdminLogin`（`'056341014'`），匯出全縣多工作表 Excel。

## 已知待辦 / 風險（尚未處理）
- ⚠️ **各校後台登入安全弱點**：密碼就是公開可見的學校代碼，任何人選別校+輸入該校代碼即可進入看別校資料。
  待補強方案：每校獨立密碼，或「代碼＋通關碼」。
- Firestore 規則尚為測試用寬鬆規則，未收緊。

## 踩過的雷（重要 context）
- **舊資料 schema 不相容**：Firestore 既有舊紀錄的 `qualitative` 欄位名是
  `selfAnalysis`/`supportNeeds`，新版改為 `currentStatus`/`supportPlans`。
  載入舊資料時若直接 `.includes()` 會 `undefined` 崩潰→整頁空白。
  已修：載入時補齊欄位並對應舊名（`handleVerifyProfile`），渲染處加 `(x || [])` 防護。
  → **改任何讀取 Firestore 既有資料的邏輯時，務必對缺欄位/舊欄位做防呆。**

## 本地驗證手法（這個專案慣用）
改完 UI 會用 Playwright 無頭瀏覽器跑流程＋截圖驗證（含手機 390px 直式），
驗證完即清掉暫存測試檔（`test-*.mjs`、`*.png`）與移除 playwright 相依，保持 repo 乾淨。
（Playwright 並非專案執行所需，只是臨時驗證工具。）

## 其他文件
- `README.md`：本機預覽 + Firebase Hosting 部署 + 換成自己 Firebase 專案的步驟
- `GITHUB-VERCEL.md`：GitHub + Vercel 部署的完整圖文步驟

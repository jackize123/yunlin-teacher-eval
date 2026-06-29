# 雲林縣數位教學評估系統（智慧黑板進階檢核）

這是把原本的 `0629數位評估表.tsx` 包裝成可實際運行的網站。
技術：Vite + React + TypeScript + Tailwind CSS + Firebase Firestore。

---

## 一、在自己電腦上預覽（馬上就能用）

打開「終端機 / PowerShell」，切到本資料夾，執行：

```powershell
cd "C:\Users\user\MyClaudeProject\.claude\智慧黑本進階檢核\website"
npm install      # 第一次才需要，安裝套件
npm run dev      # 啟動開發伺服器
```

執行後會出現一個網址（通常是 http://localhost:5173 ），
用瀏覽器打開就能看到並操作整個系統。按 Ctrl+C 可停止。

---

## 二、正式上線到網際網路（Firebase Hosting）

程式裡的 Firebase 設定已指向專案 `yunlin-teacher-eval`，
上線後網址會是： https://yunlin-teacher-eval.web.app/

> 前提：你要有這個 Firebase 專案的 Google 帳號權限。
> 若那不是你的專案，請見最下方「換成自己的 Firebase 專案」。

### 步驟

1. 安裝 Firebase 工具（第一次才需要）：
   ```powershell
   npm install -g firebase-tools
   ```

2. 登入 Google 帳號（會打開瀏覽器，請用有權限的帳號登入）：
   ```powershell
   firebase login
   ```

3. 建置網站（產生 dist 資料夾）：
   ```powershell
   cd "C:\Users\user\MyClaudeProject\.claude\智慧黑本進階檢核\website"
   npm run build
   ```

4. 部署：
   ```powershell
   firebase deploy --only hosting
   ```

完成後終端機會顯示「Hosting URL」，那就是正式網址，任何人都能連。
之後每次改完程式，只要重複「步驟 3 + 步驟 4」即可更新。

---

## 三、Firestore 資料庫權限（重要）

系統會把老師填的評估結果寫進 Firestore。請到 Firebase 主控台
（https://console.firebase.google.com/ → 選 yunlin-teacher-eval →
Firestore Database → 規則 Rules）確認規則允許寫入。
測試期間可用以下寬鬆規則（正式上線建議再收緊）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 四、換成自己的 Firebase 專案（如果上面不是你的專案）

1. 到 https://console.firebase.google.com/ 建立新專案。
2. 在專案內「新增網頁應用程式」，複製它給你的 firebaseConfig。
3. 打開 `src/App.tsx`，找到最上面的 `firebaseConfig = { ... }`，整段換成你的。
4. 在專案內啟用 Firestore Database。
5. 把本資料夾的 `.firebaserc` 裡的 `yunlin-teacher-eval` 換成你的專案 ID。
6. 重新執行「二、正式上線」的步驟。

---

## 五、其他上架平台（不想用 Firebase 的話）

這是純前端網站（build 後就是靜態檔），也能放到這些免費平台：

- **Vercel**（最簡單）：到 vercel.com 註冊 → Import 專案 → 自動偵測 Vite →
  Deploy。需先把專案放到 GitHub。
- **Netlify**：netlify.com → 拖曳 `dist` 資料夾即可上線，或連 GitHub 自動部署。
- **GitHub Pages**：把程式碼上傳到 GitHub，用 GitHub Actions 部署 dist。

> 注意：不論放哪個平台，資料庫（Firestore）仍然用 Firebase，
> 所以第三點的 Firestore 設定還是要做。

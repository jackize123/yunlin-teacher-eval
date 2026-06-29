# 用 GitHub + Vercel 自動部署

專案已經初始化成 git 倉庫並完成第一次提交。
接下來把它推到 GitHub，再用 Vercel 連結，之後每次推送都會自動更新網站。

---

## 步驟 1：在 GitHub 建立一個新倉庫

1. 到 https://github.com/new
2. Repository name 填例如：`yunlin-teacher-eval`
3. 設為 **Private（私人）** 或 Public 都可以
4. **不要**勾選 "Add a README"、.gitignore、license（保持空白，因為本地已經有了）
5. 按「Create repository」

建好後，GitHub 會顯示倉庫網址，像：
`https://github.com/你的帳號/yunlin-teacher-eval.git`

---

## 步驟 2：把本地程式推上去

在 PowerShell 執行（把網址換成你剛剛建立的）：

```powershell
cd "C:\Users\user\MyClaudeProject\.claude\智慧黑本進階檢核\website"
git remote add origin https://github.com/你的帳號/yunlin-teacher-eval.git
git push -u origin main
```

> 第一次 push 會跳出登入視窗，請用瀏覽器登入 GitHub 授權（或輸入帳號 +
> Personal Access Token）。授權一次之後就會記住。

推送成功後，重新整理 GitHub 倉庫頁面，就會看到所有程式碼。

---

## 步驟 3：用 Vercel 連結並部署

1. 到 https://vercel.com/ ，按「Sign Up」或「Log In」，
   選擇 **Continue with GitHub**（用 GitHub 帳號登入最方便）。
2. 進到 Dashboard 後按 **Add New… → Project**。
3. 找到剛剛的 `yunlin-teacher-eval` 倉庫，按 **Import**。
4. Vercel 會自動偵測這是 Vite 專案，設定通常不用改：
   - Framework Preset：**Vite**
   - Build Command：`npm run build`
   - Output Directory：`dist`
5. 按 **Deploy**，等一兩分鐘。
6. 完成後會給你一個網址（像 `yunlin-teacher-eval.vercel.app`），那就是正式網站。

---

## 之後要更新網站

只要改完程式，在 PowerShell 執行：

```powershell
cd "C:\Users\user\MyClaudeProject\.claude\智慧黑本進階檢核\website"
git add .
git commit -m "說明這次改了什麼"
git push
```

Vercel 偵測到推送後會**自動重新部署**，不用做別的。

---

## 重要：資料庫（Firestore）設定別忘了

老師填的評估結果會寫進 Firebase Firestore。不論放在哪個平台，
都要到 Firebase 主控台確認 Firestore「規則」允許寫入，
否則使用者按「送出」會失敗。詳見 `README.md` 第三點。

另外，若 `src/App.tsx` 裡的 Firebase 專案 `yunlin-teacher-eval`
不是你有權限的專案，請依 `README.md` 第四點換成自己的。

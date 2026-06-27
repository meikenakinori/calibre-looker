# 📚 Calibre 圖書館查看器

一個輕量級的 Calibre 圖書館網頁查看器，支援書籍搜尋、分頁瀏覽與 CSV 匯出。
使用瀏覽器端 WebAssembly 解析 `metadata.db`，資料存放於 Netlify Blobs，無需自架資料庫。

---

## 🚀 部署方式

### 方式一：拖放部署（最簡單，無需安裝任何工具）

1. 下載並解壓縮這個資料夾
2. 前往 [app.netlify.com/drop](https://app.netlify.com/drop)
3. 將整個資料夾**直接拖放**到網頁上
4. 幾秒鐘後網站就上線了！

> ⚠️ **完成後還需要做一件事（必要）**，請繼續看下方「設定 API Token」

---

### 方式二：一鍵部署（有 GitHub 帳號，全自動）

點擊按鈕，填入 Token，Netlify 會自動 Fork 倉庫並完成所有設定：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/meikenakinori/calibre-looker)

---

## 🔑 設定 API Token（所有部署方式都需要）

無論使用哪種部署方式，都必須完成這個步驟，否則上傳書單時會出現錯誤。

### 第一步：取得您的 Netlify Personal Access Token

1. 登入 Netlify，前往 [User Settings → Applications](https://app.netlify.com/user/applications)
2. 點選 **「Personal access tokens」** → **「New access token」**
3. 輸入任意名稱（例如 `calibre`），點選 **「Generate token」**
4. **立即複製這個 Token**（離開頁面後就看不到了！）

### 第二步：在您的 Netlify 網站加入環境變數

1. 前往您部署的 Netlify 網站
2. 點選 **Site configuration → Environment variables**
3. 點選 **「Add a variable」**，填入：

   | Key | Value |
   |-----|-------|
   | `NETLIFY_API_TOKEN` | 剛才複製的 Token |

4. 點選 **「Save」**

### 第三步：重新部署讓設定生效

- 在 Netlify 控制台點選 **Deploys → Trigger deploy → Deploy site**
- 或直接重新拖放資料夾到 [app.netlify.com/drop](https://app.netlify.com/drop)

---

## 📖 上傳書單

部署並設定好 Token 之後：

1. 前往您的網站網址
2. 點選右上角 **「📤 上傳 metadata.db」**
3. 選擇您 Calibre 書庫根目錄下的 `metadata.db` 檔案
4. 網頁會在瀏覽器中解析資料庫並自動上傳，完成後即可搜尋與瀏覽

> 💡 `metadata.db` 通常位於 Calibre 書庫根目錄
> - Windows：`文件\Calibre 書庫\metadata.db`
> - macOS：`~/Calibre 書庫/metadata.db`

---

## 🛠️ 本地開發（選用）

```bash
npm install
netlify dev
```

開啟 `http://localhost:8888` 即可在本地測試。

---

## 📦 檔案結構

```
calibre-viewer-deploy/
├── netlify.toml              # 建置設定、API 路由、環境變數定義
├── package.json              # 依賴：僅需 @netlify/blobs
├── README.md                 # 本說明文件
├── public/
│   └── index.html            # 前端介面（含上傳、搜尋、分頁、CSV 匯出）
└── netlify/
    └── functions/
        ├── upload.js         # 接收書籍資料並存入 Blobs（支援分批上傳）
        ├── books.js          # 查詢書單（支援關鍵字搜尋、分頁）
        ├── stats.js          # 圖書館統計數據
        └── export.js         # 匯出 CSV（UTF-8 with BOM，Excel 可直接開啟）
```

---

## ❓ 常見問題

**Q: 上傳時出現「上傳失敗 HTTP 500」**
A: 通常是 `NETLIFY_API_TOKEN` 沒有設定或設定後沒有重新部署。請確認上方「設定 API Token」的步驟都完成了。

**Q: 上傳後重整頁面資料消失？**
A: 資料儲存在 Netlify Blobs 中，不應該消失。請確認部署成功且 Token 設定正確。

**Q: metadata.db 多大可以上傳？**
A: 前端解析上限為 100MB，實際上大多數 Calibre 書庫的 metadata.db 都在幾 MB 以內，不需要擔心。

# 會議室預約系統 - 部署指南

## 🚀 快速開始

### 本地開發

1. **安裝相依套件**
   ```bash
   npm install
   ```

2. **設定環境變數**
   ```bash
   cp .env.example .env
   ```

3. **初始化資料庫**
   ```bash
   npm run db:push
   npm run db:seed  # 可選：生成測試資料
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   
   伺服器將在 http://localhost:3000 啟動

### 🌐 部署到 Zeabur

#### 準備工作

1. **推送程式碼到 Git 倉庫**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Meeting room booking system"
   git branch -M main
   git remote add origin <your-git-repo-url>
   git push -u origin main
   ```

#### Zeabur 部署步驟

1. **登入 Zeabur 控制台**
   - 前往 [Zeabur.com](https://zeabur.com)
   - 登入你的帳號

2. **建立新專案**
   - 點擊 "Create Project"
   - 選擇你的 Git 倉庫
   - 選擇 meetingroom 專案

3. **設定環境變數**
   
   在 Zeabur 專案設定中新增以下環境變數：
   ```
   DATABASE_URL=file:./data/booking.db
   BACKUP_SCHEDULE=0 2 * * *
   BACKUP_RETENTION_DAYS=30
   NODE_ENV=production
   ```

4. **設定 Volumes**
   
   為了持久化資料，需要建立兩個 Volume：
   
   - **Database Volume**
     - 名稱: `database`
     - 掛載路徑: `/app/data`
     - 大小: 1GB
   
   - **Backup Volume**
     - 名稱: `backups`
     - 掛載路徑: `/app/backups`
     - 大小: 5GB

5. **部署**
   - Zeabur 會自動偵測 Dockerfile
   - 點擊 "Deploy" 開始建置和部署
   - 等待部署完成

6. **設定域名**
   - 在 Zeabur 控制台設定你的域名
   - 或使用 Zeabur 提供的預設域名

#### 部署後驗證

1. **檢查應用程式狀態**
   - 訪問你的應用程式 URL
   - 確認首頁正常載入

2. **測試基本功能**
   - 選擇會議室
   - 查看月曆
   - 測試預約功能

3. **檢查備份系統**
   - 訪問 `/admin` 頁面
   - 測試手動備份功能
   - 確認備份狀態顯示正常

## 🛠 故障排除

### 常見問題

**Q: 部署失敗，顯示建置錯誤**
A: 
- 檢查 Node.js 版本是否為 18+
- 確認所有相依套件已正確安裝
- 檢查 Dockerfile 是否正確

**Q: 應用程式啟動後無法連接資料庫**
A: 
- 確認 DATABASE_URL 環境變數正確設定
- 檢查 Volume 是否正確掛載
- 查看應用程式日誌確認錯誤訊息

**Q: 備份功能無法正常運作**
A: 
- 確認 `/app/backups` 目錄的寫入權限
- 檢查備份 Volume 是否正確掛載
- 查看環境變數 BACKUP_SCHEDULE 是否正確

**Q: 頁面載入緩慢**
A: 
- 檢查資料庫檔案大小
- 考慮清理舊的預約記錄
- 檢查 Zeabur 的服務方案

### 效能調優

1. **資料庫優化**
   ```bash
   # 清理舊預約記錄（可選）
   npm run db:clean  # 如果有實作
   ```

2. **備份管理**
   - 定期清理舊備份檔案
   - 監控磁碟空間使用量

3. **監控**
   - 使用 Zeabur 的監控功能
   - 定期檢查應用程式日誌

## 🔧 維護

### 日常維護任務

1. **監控備份**
   - 每週檢查備份狀態
   - 確認自動備份正常執行

2. **資料庫維護**
   - 定期檢查資料庫大小
   - 清理過期的預約記錄

3. **安全更新**
   - 定期更新相依套件
   - 監控安全漏洞

### 更新部署

1. **程式碼更新**
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```

2. **Zeabur 自動部署**
   - Zeabur 會自動偵測程式碼更新
   - 自動觸發重新建置和部署

## 📊 系統架構

```
Frontend (Next.js)
├── 會議室選擇頁面 (/)
├── 月曆檢視頁面 (/room/[roomId])
├── 單日詳情頁面 (/room/[roomId]/[date])
└── 管理頁面 (/admin)

Backend (API Routes)
├── /api/bookings - 查詢預約
├── /api/booking/create - 建立預約
├── /api/booking/delete - 刪除預約
├── /api/backup - 備份管理
└── /api/backup-status - 備份狀態

Database (SQLite)
├── bookings 表格
└── 索引優化

Infrastructure (Zeabur)
├── Docker 容器化
├── Volume 持久化存儲
└── 自動備份系統
```

## 🎯 功能檢查清單

### 基本功能
- [x] 會議室選擇
- [x] 月曆檢視
- [x] 單日詳情
- [x] 預約新增
- [x] 預約刪除
- [x] 重疊預約警示

### 進階功能
- [x] 響應式設計
- [x] 載入狀態指示
- [x] 錯誤處理
- [x] 表單驗證
- [x] 身份驗證 (分機號碼)

### 系統功能
- [x] 自動備份
- [x] 手動備份
- [x] 備份清理
- [x] 備份監控
- [x] Docker 容器化
- [x] Zeabur 部署設定

---

🎉 **恭喜！** 您的會議室預約系統已準備就緒！
# 會議室預約系統

一個功能完整的會議室預約管理系統，支援三層式介面設計、重疊預約警示、自動備份等功能。

## 功能特色

### 🏢 三層式介面設計
- **第一層**: 會議室選擇頁面 - 選擇會議室 A 或會議室 B
- **第二層**: 月曆檢視頁面 - 顯示當月預約狀況，支援月份切換
- **第三層**: 單日詳情頁面 - 顯示該日完整預約清單和空閒時段

### 📅 預約管理功能
- ✅ 新增預約 - 填寫預約人姓名和聯絡分機
- ⚠️ 重疊預約警示 - 顯示衝突預約並允許用戶選擇是否繼續
- 🗑️ 刪除預約 - 需要分機號碼驗證才能刪除
- 🔒 安全驗證 - 防止誤刪或惡意刪除

### 📱 視覺狀態指示
- 空白日期: 無預約
- 📅 圖示: 有預約的日期
- ⚠️ 數字: 重疊預約顯示預約數量

### 💾 自動備份系統
- 每日自動備份 (凌晨2點執行)
- 手動備份功能
- 備份狀態監控頁面
- 自動清理超過30天的舊備份
- Zeabur Volume 掛載支援

## 技術架構

### 前端技術
- **Next.js 15** - React 全端框架
- **TypeScript** - 類型安全的 JavaScript
- **Tailwind CSS** - 實用優先的 CSS 框架
- **Lucide React** - 美觀的圖示庫
- **date-fns** - 現代化的日期處理庫

### 後端技術
- **Prisma ORM** - 現代化的資料庫工具
- **SQLite** - 輕量級的資料庫
- **Next.js API Routes** - API 端點實作

### 部署平台
- **Zeabur** - 現代化的部署平台
- **Docker** - 容器化部署
- **Zeabur Volume** - 持久化存儲

## 快速開始

### 環境需求
- Node.js 18 或以上版本
- npm 或 yarn 套件管理器

### 安裝步驟

1. **下載專案**
   ```bash
   git clone <repository-url>
   cd meetingroom
   ```

2. **安裝相依套件**
   ```bash
   npm install
   ```

3. **設定環境變數**
   ```bash
   cp .env.example .env
   ```
   
   編輯 `.env` 檔案：
   ```env
   DATABASE_URL="file:./data/booking.db"
   BACKUP_SCHEDULE="0 2 * * *"
   BACKUP_RETENTION_DAYS=30
   ```

4. **初始化資料庫**
   ```bash
   npm run db:push
   ```

5. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

6. **開啟瀏覽器**
   
   前往 `http://localhost:3000` 開始使用系統

## 主要功能使用說明

### 📋 預約流程

1. **選擇會議室**: 在首頁點擊會議室 A 或會議室 B
2. **選擇日期**: 在月曆上點擊要預約的日期
3. **選擇時段**: 點擊空閒時段的「立即預約」按鈕
4. **填寫資訊**: 輸入預約人姓名和聯絡分機
5. **確認預約**: 點擊「確認預約」完成預約

### 🗑️ 刪除預約

1. **進入單日詳情**: 點擊有預約的日期
2. **點擊刪除**: 點擊預約項目的「刪除預約」按鈕
3. **身份驗證**: 輸入預約時填寫的分機號碼
4. **確認刪除**: 驗證成功後完成刪除

### ⚠️ 重疊預約處理

當選擇已有預約的時段時：
1. 系統會顯示衝突警示彈窗
2. 列出現有預約的詳細資訊
3. 用戶可選擇「取消」或「仍要預約」
4. 選擇「仍要預約」將建立重疊預約

### 💾 備份管理

訪問 `/admin` 頁面進行備份管理：
- **立即備份**: 手動建立資料庫備份
- **查看備份狀態**: 檢視備份數量、總大小等資訊
- **清理舊備份**: 刪除超過保留期限的備份
- **備份歷史**: 查看所有備份記錄

## API 端點

### 預約相關
```
GET  /api/bookings?roomId={A|B}&date={YYYY-MM-DD}  - 取得單日預約
GET  /api/bookings?roomId={A|B}&date={YYYY-MM}     - 取得月份預約
POST /api/booking/create                           - 建立新預約
DELETE /api/booking/delete                         - 刪除預約
```

### 備份相關
```
GET    /api/backup-status  - 查看備份狀態
POST   /api/backup         - 建立備份
DELETE /api/backup         - 清理舊備份
```

## 資料庫設計

### Booking 表格結構
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,           -- 會議室ID (A/B)
  date TEXT NOT NULL,              -- 日期 (YYYY-MM-DD)
  time_slot TEXT NOT NULL,         -- 時間段 (HH:MM-HH:MM)
  booker TEXT NOT NULL,            -- 預約人姓名
  extension TEXT NOT NULL,         -- 聯絡分機
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 索引設計
```sql
CREATE INDEX idx_room_date ON bookings(room_id, date);
CREATE INDEX idx_room_date_time ON bookings(room_id, date, time_slot);
```

## 部署到 Zeabur

### 自動部署

1. **推送程式碼到 Git**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **連接到 Zeabur**
   - 在 Zeabur 控制台連接你的 Git 倉庫
   - 選擇 meetingroom 專案
   - Zeabur 會自動偵測 Dockerfile 並開始建置

3. **設定環境變數**
   在 Zeabur 控制台設定以下環境變數：
   ```
   DATABASE_URL=file:./data/booking.db
   BACKUP_SCHEDULE=0 2 * * *
   BACKUP_RETENTION_DAYS=30
   NODE_ENV=production
   ```

4. **設定 Volume 掛載**
   - 建立 `database` Volume 掛載到 `/app/data`
   - 建立 `backups` Volume 掛載到 `/app/backups`

5. **部署完成**
   - Zeabur 會自動建置並部署應用程式
   - 取得部署 URL 開始使用

### 手動部署腳本

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 開發說明

### 專案結構
```
meetingroom/
├── src/
│   ├── app/                 # Next.js App Router 頁面
│   │   ├── api/            # API 路由
│   │   ├── room/           # 會議室相關頁面
│   │   └── admin/          # 管理頁面
│   ├── components/         # React 組件
│   ├── lib/               # 工具函數和設定
│   └── types/             # TypeScript 類型定義
├── prisma/                # Prisma 資料庫設定
├── data/                  # SQLite 資料庫檔案
├── backups/              # 備份檔案目錄
└── scripts/              # 部署腳本
```

### 開發指令
```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置生產版本
npm run start        # 啟動生產伺服器
npm run lint         # 執行代碼檢查
npm run db:push      # 同步資料庫 schema
npm run db:migrate   # 建立資料庫遷移
```

### 代碼風格
- 使用 TypeScript 提供類型安全
- 遵循 ESLint 代碼檢查規範
- 使用 Prettier 格式化代碼
- 組件使用函數式寫法和 React Hooks

## 安全性特色

- **輸入驗證**: 所有用戶輸入都經過嚴格驗證
- **SQL 注入防護**: 使用 Prisma ORM 預防 SQL 注入
- **身份驗證**: 分機號碼驗證機制防止惡意刪除
- **權限控制**: 只能刪除未來的預約
- **資料清理**: 自動清理和驗證輸入資料

## 效能優化

- **Server-Side Rendering**: 使用 Next.js SSR 提升載入速度
- **靜態生成**: 靜態頁面快取優化
- **圖片優化**: Next.js 自動圖片優化
- **代碼分割**: 自動代碼分割減少載入時間
- **資料庫索引**: 優化資料庫查詢效能

## 故障排除

### 常見問題

**Q: 資料庫連接失敗**
A: 檢查 `DATABASE_URL` 環境變數是否正確設定，確保 `data` 目錄存在

**Q: 備份功能無法使用**
A: 確保 `backups` 目錄存在且具有寫入權限

**Q: 頁面載入緩慢**
A: 檢查資料庫檔案大小，考慮清理舊預約記錄

**Q: 部署到 Zeabur 失敗**
A: 確保 Dockerfile 正確設定，環境變數完整配置

### 日誌查看
```bash
# 開發環境
npm run dev

# 生產環境 (Docker)
docker logs <container-name>
```

## 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 支援與聯絡

如有問題或建議，請透過以下方式聯絡：

- 建立 GitHub Issue
- 發送電子郵件給專案維護者
- 查看專案文件和 FAQ

---

**會議室預約系統** - 讓會議室管理變得簡單高效！ 🚀
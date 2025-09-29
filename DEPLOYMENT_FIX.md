# 月曆時段顯示問題修復

## 問題描述
在Zeabur部署後，網頁上的月曆無法顯示預約時段，主要原因是資料庫初始化失敗。

## 根本原因
1. **資料庫路徑問題**: SQLite相對路徑在容器環境中無法正確解析
2. **初始化腳本問題**: 原始的資料庫初始化邏輯不夠健壯
3. **環境變數配置**: 生產環境和開發環境的DATABASE_URL配置不一致

## 解決方案

### 1. 更新資料庫初始化腳本
創建了新的 `scripts/init-db.sh` 腳本，具有以下特性：
- 自動檢測環境並設定正確的資料庫路徑
- 更健壯的錯誤處理和重試機制
- 完整的資料庫驗證流程

### 2. 修復entrypoint腳本
更新 `scripts/entrypoint.sh` 使用新的初始化腳本：
```bash
# 使用專用的資料庫初始化腳本
/app/scripts/init-db.sh
```

### 3. 環境變數配置
確保Zeabur中設定正確的環境變數：
```
DATABASE_URL=file:/app/data/booking.db
NODE_ENV=production
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### 4. Volume掛載
確保Zeabur中正確掛載volumes：
- `data` volume -> `/app/data`
- `backups` volume -> `/app/backups`

## 部署步驟

1. **本地測試**:
   ```bash
   # 測試資料庫初始化
   ./scripts/init-db.sh
   
   # 測試應用啟動
   npm run dev
   ```

2. **部署到Zeabur**:
   ```bash
   # 使用部署腳本
   ./scripts/deploy.sh
   ```

3. **驗證部署**:
   - 檢查Zeabur logs確認資料庫初始化成功
   - 訪問網站確認月曆顯示正常
   - 測試預約功能

## 驗證清單

- [ ] 資料庫檔案正確創建 (`/app/data/booking.db`)
- [ ] 資料庫schema正確 (包含bookings表和所有索引)
- [ ] 月曆頁面正常載入
- [ ] 預約時段正確顯示
- [ ] 新增預約功能正常
- [ ] 刪除預約功能正常
- [ ] 備份系統正常運作

## 故障排除

### 如果月曆還是不顯示時段：

1. **檢查Zeabur logs**:
   ```
   === Database Initialization ===
   Database path: /app/data/booking.db
   Creating new database...
   Database created successfully
   Database verification successful
   ```

2. **檢查環境變數**:
   確認 `DATABASE_URL=file:/app/data/booking.db`

3. **檢查Volume掛載**:
   確認data volume正確掛載到 `/app/data`

4. **手動重新部署**:
   在Zeabur dashboard中觸發重新部署

### 如果資料庫初始化失敗：

1. **檢查Prisma版本相容性**
2. **檢查SQLite在容器中是否可用**
3. **檢查檔案權限**

## 相關檔案

- `scripts/init-db.sh` - 資料庫初始化腳本
- `scripts/entrypoint.sh` - 容器啟動腳本
- `scripts/deploy.sh` - 部署腳本
- `Dockerfile` - 容器配置
- `zeabur.yaml` - Zeabur部署配置

## 測試資料

部署後可以手動添加測試資料來驗證功能：
```sql
INSERT INTO bookings (room_id, date, time_slot, booker, extension, order_index) 
VALUES 
('A', '2025-10-01', '09:00-10:00', '測試用戶', '1234', 1),
('A', '2025-10-01', '14:00-15:00', '張三', '5678', 1),
('B', '2025-10-02', '10:00-11:00', '李四', '9999', 1);
```

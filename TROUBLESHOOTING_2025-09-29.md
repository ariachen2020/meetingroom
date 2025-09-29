# 會議室預約系統故障排除記錄 - 2025-09-29

## 問題描述
在Zeabur部署完成後，網頁上的月曆無法顯示預約時段，用戶無法看到哪些時段已被預約。

## 根本原因分析

### 1. 資料庫初始化失敗
- **問題**: SQLite資料庫在容器環境中沒有正確創建
- **原因**: 相對路徑 `file:./data/booking.db` 在Docker容器中無法正確解析
- **症狀**: 資料庫檔案大小為0字節，沒有schema

### 2. 初始化腳本不夠健壯
- **問題**: 原始的 `fix-migration.sh` 缺乏適當的錯誤處理
- **原因**: 沒有檢查資料庫檔案是否為空，沒有驗證schema創建

### 3. 月曆組件資料獲取問題
- **問題**: Calendar組件無法動態獲取不同月份的資料
- **原因**: 切換月份時使用靜態資料，沒有重新fetch API

## 解決方案

### 1. 創建健壯的資料庫初始化腳本

**新增檔案**: `scripts/init-db.sh`
```bash
#!/bin/sh
set -e

echo "=== Database Initialization ==="

# 設定預設DATABASE_URL (生產環境)
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/data/booking.db"
fi

DB_PATH="${DATABASE_URL#file:}"
echo "Database path: $DB_PATH"

# 確保目錄存在
mkdir -p "$(dirname "$DB_PATH")"

# 移除空的資料庫檔案
if [ -f "$DB_PATH" ] && [ ! -s "$DB_PATH" ]; then
    echo "Removing empty database file..."
    rm -f "$DB_PATH"
fi

# 初始化資料庫
if [ ! -f "$DB_PATH" ]; then
    echo "Creating new database..."
    npx prisma generate
    npx prisma db push --force-reset
    echo "Database created successfully"
else
    echo "Database already exists, checking schema..."
    npx prisma generate
    
    if sqlite3 "$DB_PATH" ".schema" | grep -q "bookings"; then
        echo "Database schema is valid"
        npx prisma migrate deploy || npx prisma db push --accept-data-loss
    else
        echo "Database schema is invalid, recreating..."
        rm -f "$DB_PATH"
        npx prisma db push --force-reset
    fi
fi

# 最終驗證
echo "Verifying database..."
if [ -f "$DB_PATH" ] && [ -s "$DB_PATH" ] && sqlite3 "$DB_PATH" ".schema" | grep -q "bookings"; then
    echo "Database verification successful"
    echo "Database size: $(ls -lh "$DB_PATH" | awk '{print $5}')"
else
    echo "Database verification failed, recreating..."
    rm -f "$DB_PATH"
    npx prisma db push --force-reset
    echo "Database recreated successfully"
fi

echo "=== Database Initialization Complete ==="
```

### 2. 更新容器啟動腳本

**修改**: `scripts/entrypoint.sh`
```bash
echo "Setting up database..."
# 使用專用的資料庫初始化腳本
/app/scripts/init-db.sh
```

### 3. 修復Calendar組件

**主要改進**:
- 添加動態資料獲取功能
- 今天日期用紅色圈起來
- 顯示預約時段標籤

**關鍵修改**:
```typescript
// 動態獲取月份資料
useEffect(() => {
  const fetchMonthData = async () => {
    if (format(selectedMonth, 'yyyy-MM') === format(currentDate, 'yyyy-MM')) {
      setCalendarData(initialData)
      return
    }

    setIsLoading(true)
    try {
      const monthStr = format(selectedMonth, 'yyyy-MM')
      const response = await fetch(`/api/bookings?roomId=${roomId}&date=${monthStr}`)
      if (response.ok) {
        const data = await response.json()
        // 轉換資料格式...
        setCalendarData(newCalendarData)
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  fetchMonthData()
}, [selectedMonth, roomId, currentDate, initialData])

// 今天的紅色圈圈
const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
if (isToday && isCurrentMonth) {
  linkClass += " ring-2 ring-red-500"
}
```

### 4. TypeScript類型修復

**問題**: 編譯時出現類型錯誤
```
Type error: 'a' is of type 'unknown'.
Type error: Argument of type '(a: string, b: string) => number' is not assignable to parameter of type '(a: unknown, b: unknown) => number'.
```

**解決方案**:
```typescript
// 正確的類型定義
const bookingsByDate = new Map<string, any[]>()

// 正確的類型斷言
const timeSlots = [...new Set(dateBookings.map((b: any) => b.timeSlot))] as string[]
timeSlots.sort((a, b) => a.localeCompare(b))

newCalendarData.push({
  date: date as string,
  bookings: dateBookings,
  hasBookings: dateBookings.length > 0,
  timeSlots
})
```

## 部署配置

### Zeabur環境變數
```
DATABASE_URL=file:/app/data/booking.db
NODE_ENV=production
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### Volume掛載
```
data -> /app/data
backups -> /app/backups
```

### Dockerfile更新
```dockerfile
# 複製所有腳本並設定權限
COPY scripts/backup.sh /app/scripts/backup.sh
COPY scripts/verify-backups.sh /app/scripts/verify-backups.sh
COPY scripts/monitor-backups.sh /app/scripts/monitor-backups.sh
COPY scripts/fix-migration.sh /app/scripts/fix-migration.sh
COPY scripts/init-db.sh /app/scripts/init-db.sh
COPY scripts/crontab /etc/cron.d/backup-cron

RUN chmod +x /app/scripts/backup.sh \
    && chmod +x /app/scripts/verify-backups.sh \
    && chmod +x /app/scripts/monitor-backups.sh \
    && chmod +x /app/scripts/fix-migration.sh \
    && chmod +x /app/scripts/init-db.sh \
    && chmod 0644 /etc/cron.d/backup-cron \
    && crontab /etc/cron.d/backup-cron
```

## 測試驗證

### 本地測試
```bash
# 測試資料庫初始化
./scripts/init-db.sh

# 測試TypeScript編譯
npx tsc --noEmit

# 測試建置
npm run build

# 測試應用啟動
npm run dev
```

### 部署後驗證
1. 檢查Zeabur logs確認資料庫初始化成功
2. 訪問網站確認月曆顯示正常
3. 測試預約功能
4. 驗證今天日期有紅色圈圈
5. 確認時段標籤正確顯示

## 最終效果

### ✅ 實現的功能
1. **今天用紅色圈起來**: 紅色邊框 + 紅色數字
2. **月曆顯示預約時段**: 每天最多顯示3個時段，超過顯示"+X個"
3. **動態資料獲取**: 切換月份自動更新資料
4. **健壯的資料庫初始化**: 自動檢測和修復資料庫問題

### 🎯 視覺效果
- **無預約**: 灰色邊框，普通顯示
- **有預約**: 藍色背景，顯示時段標籤
- **今天**: 紅色圈圈，紅色數字
- **今天有預約**: 紅色圈圈 + 藍色背景 + 時段顯示

## 故障排除清單

### 如果月曆還是不顯示時段
1. 檢查Zeabur logs中的資料庫初始化訊息
2. 確認環境變數 `DATABASE_URL=file:/app/data/booking.db`
3. 確認data volume正確掛載到 `/app/data`
4. 手動重新部署

### 如果資料庫初始化失敗
1. 檢查Prisma版本相容性
2. 檢查SQLite在容器中是否可用
3. 檢查檔案權限

### 如果TypeScript編譯失敗
1. 確認所有類型定義正確
2. 使用適當的類型斷言
3. 本地測試 `npx tsc --noEmit`

## 相關檔案
- `scripts/init-db.sh` - 資料庫初始化腳本
- `scripts/entrypoint.sh` - 容器啟動腳本
- `src/components/Calendar.tsx` - 月曆組件
- `Dockerfile` - 容器配置
- `zeabur.yaml` - 部署配置

## 經驗總結
1. **容器環境路徑問題**: 相對路徑在Docker中可能無法正確解析，建議使用絕對路徑
2. **資料庫初始化**: 需要完整的驗證和錯誤處理機制
3. **TypeScript嚴格模式**: 需要正確的類型定義和斷言
4. **前端資料獲取**: 動態資料需要適當的狀態管理和API調用
5. **部署測試**: 本地測試通過不代表部署環境沒問題，需要完整的部署驗證流程

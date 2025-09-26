# 會議室預約系統部署工作日誌

**日期**: 2025-09-25  
**時間**: 23:06 - 23:45  
**任務**: Zeabur 部署問題排除與功能改進

## 問題概述

會議室預約系統在 Zeabur 平台部署時遇到多個技術問題，需要逐步排除並最終成功部署。

## 問題排除過程

### 1. 初始部署失敗 (23:06)

**問題**: Zeabur 建置容器啟動後沒有後續建置過程

**原因分析**: 
- 缺少 Prisma Schema 檔案
- Dockerfile 配置不完整
- package.json 缺少必要腳本

**解決方案**:
```bash
# 建立 Prisma Schema
mkdir prisma
# 建立 prisma/schema.prisma 檔案，定義 Booking 模型
```

### 2. Prisma 相關錯誤 (23:10)

**問題**: `postinstall` hook 衝突
```
sh: 1: prisma: not found
npm error code 127
```

**解決方案**:
- 移除 package.json 中的 `postinstall` hook
- 調整 Dockerfile 建置順序
- 將 `@prisma/client` 從 devDependencies 移到 dependencies

### 3. PostCSS 建置錯誤 (23:15)

**問題**: PostCSS 插件無法解析
```
Error: Cannot resolve 'tailwindcss'
```

**解決方案**:
- 將 `postcss`, `tailwindcss`, `autoprefixer` 移到 dependencies
- 確保生產環境建置時能找到這些插件

### 4. 客戶端錯誤 (23:25)

**問題**: 
```
TypeError: t.then is not a function
Application error: a client-side exception has occurred
```

**原因**: Next.js 15 中 params 不是 Promise，但程式碼使用了 `params.then()`

**解決方案**:
- 修正 params 處理方式，直接解構使用
- 移除 Promise 相關邏輯

### 5. CSS 顏色類別錯誤 (23:34)

**問題**: 使用了不存在的 `primary-` 顏色類別

**解決方案**:
- 批量替換所有 `primary-` 為 `blue-` 顏色類別
- 更新所有組件中的顏色引用

## 功能改進

### 自定義時間範圍預約 (23:41)

**需求**: 將固定一小時時段改為可填寫的自定義時間範圍

**實作內容**:
1. **BookingModal 改進**:
   - 新增開始時間和結束時間輸入欄位
   - 自動組合時間範圍格式
   - 加入時間驗證邏輯

2. **日期頁面重構**:
   - 移除固定時段網格
   - 改為預約清單顯示
   - 統一的「新增預約」按鈕

3. **類型定義更新**:
   - BookingForm 介面新增 startTime, endTime 欄位

## 技術細節

### 最終 Dockerfile 配置
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
RUN mkdir -p /app/data /app/backups
EXPOSE 3000
CMD ["npm", "start"]
```

### 關鍵 package.json 修改
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  },
  "dependencies": {
    "@prisma/client": "^6.16.2",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "autoprefixer": "^10.4.20"
  }
}
```

### Prisma Schema
```prisma
model Booking {
  id        Int      @id @default(autoincrement())
  roomId    String   @map("room_id")
  date      String
  timeSlot  String   @map("time_slot")
  booker    String
  extension String
  createdAt DateTime @default(now()) @map("created_at")
  @@map("bookings")
}
```

## Git 提交記錄

1. `Add Prisma schema and fix Docker configuration`
2. `fix: Remove postinstall hook and fix Docker build order`
3. `fix: Move @prisma/client to dependencies`
4. `fix: Move PostCSS and Tailwind to dependencies`
5. `fix: Simplify globals.css to resolve build error`
6. `fix: Replace all primary colors with blue colors`
7. `fix: Remove Promise wrapper from params in Next.js 15`
8. `feat: Allow custom time range booking instead of fixed hourly slots`

## 最終結果

✅ **部署成功**: 應用程式在 Zeabur 平台正常運行  
✅ **功能完整**: 支援自定義時間範圍預約  
✅ **用戶體驗**: 介面簡潔，操作直觀  

## 學習重點

1. **Docker 建置順序很重要**: 依賴安裝 → 程式碼複製 → 建置
2. **Next.js 版本差異**: 不同版本的 params 處理方式不同
3. **生產環境依賴**: PostCSS 相關套件需要在 dependencies 中
4. **Prisma 整合**: 需要正確的 schema 和 client 生成順序
5. **CSS 框架配置**: Tailwind 自定義顏色需要正確配置

## 時間統計

- **問題排除**: 35 分鐘
- **功能改進**: 4 分鐘
- **總計**: 39 分鐘

---

**狀態**: ✅ 完成  
**部署平台**: Zeabur  
**最終提交**: `6e5a6d2`

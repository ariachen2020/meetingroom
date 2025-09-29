# 任務總結：會議室預約系統功能開發與部署問題排除

本次會話主要完成了以下功能開發，並解決了部署過程中遇到的多個問題。

## 一、功能開發

### 1. 增加會議名稱 (選填)

-   **目標**：在預約頁面增加會議名稱欄位，且非必要填寫。
-   **實作細節**：
    -   **資料庫**：修改 `prisma/schema.prisma`，在 `Booking` 模型中新增 `title String?` 欄位。
    -   **後端 API**：
        -   重構 `src/lib/storage.ts`，將其從基於 JSON 檔案儲存改為使用 Prisma Client 操作資料庫。
        -   修改 `src/app/api/booking/create/route.ts`，從請求中獲取 `title` 並傳遞給 `createBooking` 函數，同時增加 `title` 長度驗證 (不超過 100 字元)。
        -   修改 `src/app/api/bookings/route.ts`，將其標記為動態路由 (`export const dynamic = 'force-dynamic'`)。
    -   **前端 UI**：
        -   更新 `src/types/index.ts`，在 `Booking` 和 `BookingForm` 介面中新增 `title: string | null` 欄位。
        -   修改 `src/components/BookingModal.tsx`：
            -   更新 `formData` 狀態和 `handleClose` 函數以包含 `title`。
            -   在表單中新增一個「會議名稱」輸入框。
        -   修改 `src/app/room/[roomId]/[date]/page.tsx`：
            -   導入 `BookText` 圖示。
            -   在 `handleBooking` 函數中傳遞 `title` 到後端。
            -   在預約清單中顯示 `title` (若存在)。

### 2. 時間顯示 24 小時制

-   **目標**：確保網頁版的時間選擇器顯示為 24 小時制，而非 AM/PM。
-   **實作細節**：
    -   安裝 `react-time-picker` 套件 (`npm install react-time-picker`)。
    -   修改 `src/components/BookingModal.tsx`，用 `react-time-picker` 的 `TimePicker` 元件替換原生的 `<input type="time">`，並設定 `locale="en-GB"` 和 `format="HH:mm"`。

## 二、部署問題排除與優化

在功能開發完成後，部署到 Zeabur 遇到了一系列問題，並逐一解決：

### 1. 資料庫結構不同步 (Table does not exist)

-   **問題**：部署後應用程式報錯 `The table 'main.bookings' does not exist`。
-   **原因**：Zeabur 上的生產資料庫沒有更新到最新的 Prisma Schema。
-   **解決方案**：
    -   **本地開發環境**：執行 `npx prisma migrate reset` 重設本地資料庫，並執行 `npx prisma migrate dev --name init` 產生初始遷移檔案。
    -   **Zeabur 部署**：
        -   修改 `zeabur.yaml`，在 `app` 服務中新增 `release` 指令：`command: npx prisma generate && npx prisma migrate deploy`。這確保了在應用程式啟動前，資料庫遷移會被執行。
        -   **最終發現**：`prisma/migrations` 資料夾被 `.gitignore` 忽略，導致遷移檔案未被推送到 Git。

### 2. 環境變數未找到 (Environment variable not found: DATABASE_URL)

-   **問題**：即使設定了 `release` 指令，應用程式啟動時仍報錯 `Environment variable not found: DATABASE_URL`。
-   **原因**：
    -   `zeabur.yaml` 中定義的環境變數未被正確注入到容器的啟動腳本環境中。
    -   專案中的 `.env.production` 檔案與 `zeabur.yaml` 中的設定衝突，且 `.env.production` 中的 `DATABASE_URL` 使用了相對路徑。
-   **解決方案**：
    -   建立 `scripts/entrypoint.sh` 腳本，內容為：
        ```sh
        #!/bin/sh
        set -e
        echo "Running database migrations..."
        npx prisma migrate deploy
        echo "Migrations complete."
        echo "Starting the application..."
        exec npm start
        ```
    -   修改 `Dockerfile`，將 `CMD` 指令改為執行 `entrypoint.sh` 腳本，並將腳本複製到映像檔中。
    -   清空 `.env.production` 檔案內容，避免其覆蓋 Zeabur 注入的環境變數。
    -   **最終解決方案**：由於 Zeabur 環境變數注入問題持續存在，將 `DATABASE_URL="file:/app/data/booking.db"` 直接寫入 `Dockerfile` 中，確保變數在映像檔層面就已設定。

### 3. `.gitignore` 忽略遷移檔案

-   **問題**：`prisma/migrations` 資料夾未被推送到 Git，導致部署時無法執行遷移。
-   **原因**：`.gitignore` 檔案中包含了 `/prisma/migrations/` 這一行，導致 Git 忽略了該資料夾。
-   **解決方案**：從 `.gitignore` 中移除 `/prisma/migrations/` 這一行。

## 三、Git 工作流程

-   為新功能建立 `feature/add-booking-title` 分支。
-   在分支上進行所有開發工作。
-   將 `feature/add-booking-title` 分支合併到 `main` 分支。
-   刪除 `feature/add-booking-title` 分支。
-   所有修改都已推送到 GitHub 遠端倉庫。

---

這個檔案包含了我們本次會話的所有重要步驟和解決方案。我現在將它寫入 `TASK_SUMMARY.md`。

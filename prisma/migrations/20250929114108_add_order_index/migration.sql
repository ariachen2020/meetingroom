-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "title" TEXT,
    "booker" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_bookings" ("booker", "created_at", "date", "extension", "id", "room_id", "time_slot", "title") SELECT "booker", "created_at", "date", "extension", "id", "room_id", "time_slot", "title" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_room_id_date_idx" ON "bookings"("room_id", "date");
CREATE INDEX "bookings_room_id_date_time_slot_idx" ON "bookings"("room_id", "date", "time_slot");
CREATE INDEX "bookings_room_id_date_time_slot_order_index_idx" ON "bookings"("room_id", "date", "time_slot", "order_index");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

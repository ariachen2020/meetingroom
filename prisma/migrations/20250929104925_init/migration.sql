-- CreateTable
CREATE TABLE "bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "title" TEXT,
    "booker" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "bookings_room_id_date_idx" ON "bookings"("room_id", "date");

-- CreateIndex
CREATE INDEX "bookings_room_id_date_time_slot_idx" ON "bookings"("room_id", "date", "time_slot");

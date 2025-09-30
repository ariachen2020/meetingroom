-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "recurring_group_id" TEXT;

-- CreateIndex
CREATE INDEX "bookings_recurring_group_id_idx" ON "bookings"("recurring_group_id");

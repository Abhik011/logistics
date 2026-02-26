/*
  Warnings:

  - You are about to drop the column `gstAmount` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tripId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_invoiceId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "gstAmount",
ADD COLUMN     "cgstAmount" DOUBLE PRECISION,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 18,
ADD COLUMN     "igstAmount" DOUBLE PRECISION,
ADD COLUMN     "isOverdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "netReceivable" DOUBLE PRECISION,
ADD COLUMN     "sgstAmount" DOUBLE PRECISION,
ADD COLUMN     "tdsAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tripId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tripId_key" ON "Invoice"("tripId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `vehicleId` on the `Driver` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_vehicleId_fkey";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "vehicleId";

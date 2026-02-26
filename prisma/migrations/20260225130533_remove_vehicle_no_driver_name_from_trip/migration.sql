/*
  Warnings:

  - You are about to drop the column `driverName` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleNo` on the `Trip` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "driverName",
DROP COLUMN "vehicleNo",
ADD COLUMN     "totalDistanceKm" DOUBLE PRECISION;

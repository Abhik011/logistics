/*
  Warnings:

  - Made the column `weight` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `volume` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commodity` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "weight" SET NOT NULL,
ALTER COLUMN "volume" SET NOT NULL,
ALTER COLUMN "commodity" SET NOT NULL;

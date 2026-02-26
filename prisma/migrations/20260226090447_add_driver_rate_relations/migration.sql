-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "address" TEXT,
ADD COLUMN     "commissionPercent" DOUBLE PRECISION,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DriverRate" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT,
    "vehicleId" TEXT,
    "ratePerKm" DOUBLE PRECISION,
    "ratePer4Km" DOUBLE PRECISION,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverRate_driverId_idx" ON "DriverRate"("driverId");

-- AddForeignKey
ALTER TABLE "DriverRate" ADD CONSTRAINT "DriverRate_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRate" ADD CONSTRAINT "DriverRate_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRate" ADD CONSTRAINT "DriverRate_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

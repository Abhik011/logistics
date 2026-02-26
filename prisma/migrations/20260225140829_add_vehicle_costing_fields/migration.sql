-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "profit" DOUBLE PRECISION,
ADD COLUMN     "revenue" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

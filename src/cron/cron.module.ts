import { Module } from '@nestjs/common';
import { FinanceCronService } from './finance-cron.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],   // ✅ IMPORT HERE
  providers: [FinanceCronService],
})
export class CronModule {}
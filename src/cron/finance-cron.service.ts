// src/cron/finance-cron.service.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceCronService {
  constructor(private prisma: PrismaService) {}

  // ⏰ Runs every day at midnight
  @Cron(CronExpression.EVERY_10_SECONDS) // For testing, change to EVERY_10_SECONDS. Change back to EVERY_DAY_AT_MIDNIGHT for production.
  async markOverdueInvoices() {
    console.log('Running overdue invoice check...');

    const today = new Date();

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: today },
        status: { notIn: ['PAID'] },
        isOverdue: false,
      },
    });

    for (const invoice of overdueInvoices) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'OVERDUE',
          isOverdue: true,
        },
      });
    }

    console.log(`Marked ${overdueInvoices.length} invoices as overdue`);
  }
}
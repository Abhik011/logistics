import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const totalRevenue = await this.prisma.invoice.aggregate({
      _sum: { grandTotal: true },
    });

    const totalOutstanding = await this.prisma.invoice.aggregate({
      _sum: { netReceivable: true },
      where: { status: { not: 'PAID' } },
    });

    const totalOverdue = await this.prisma.invoice.aggregate({
      _sum: { netReceivable: true },
      where: { status: 'OVERDUE' },
    });

    const totalProfit = await this.prisma.trip.aggregate({
      _sum: { profit: true },
    });

    return {
      totalRevenue: totalRevenue._sum.grandTotal || 0,
      totalOutstanding: totalOutstanding._sum.netReceivable || 0,
      totalOverdue: totalOverdue._sum.netReceivable || 0,
      totalProfit: totalProfit._sum.profit || 0,
    };
  }
}
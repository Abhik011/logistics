import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    /*
     ==============================
     📈 Revenue Trend (Last 6 Months)
     ==============================
    */

    const invoicesLast6Months = await this.prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
    });

    const revenueTrend: Record<string, number> = {};

    for (const invoice of invoicesLast6Months) {
      const month = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM
      revenueTrend[month] =
        (revenueTrend[month] || 0) + invoice.grandTotal;
    }

    /*
     ==============================
     💰 Revenue Totals
     ==============================
    */

    const totalRevenue = await this.prisma.invoice.aggregate({
      _sum: { grandTotal: true },
    });

    const totalCollected = await this.prisma.invoice.aggregate({
      _sum: { paidAmount: true },
    });

    const totalRevenueAmount =
      totalRevenue._sum.grandTotal || 0;

    const totalCollectedAmount =
      totalCollected._sum.paidAmount || 0;

    const outstanding =
      totalRevenueAmount - totalCollectedAmount;

    /*
     ==============================
     📊 Status Counts
     ==============================
    */

    const invoiceStatusCounts =
      await this.prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
      });

    const bookingStatusCounts =
      await this.prisma.booking.groupBy({
        by: ['status'],
        _count: true,
      });

    const tripStatusCounts =
      await this.prisma.trip.groupBy({
        by: ['status'],
        _count: true,
      });

    /*
     ==============================
     🚚 On-Time Delivery %
     ==============================
     (Currently = Completed / Total)
    */

    const totalBookings =
      await this.prisma.booking.count();

    const completedBookings =
      await this.prisma.booking.count({
        where: { status: 'COMPLETED' },
      });

    const onTimePercentage =
      totalBookings === 0
        ? 0
        : Number(
            (
              (completedBookings / totalBookings) *
              100
            ).toFixed(2),
          );

    /*
     ==============================
     🏦 Aging Buckets
     ==============================
    */

    const unpaidInvoices =
      await this.prisma.invoice.findMany({
        where: {
          status: {
            in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
          },
        },
      });

    const aging = {
      '0-30': 0,
      '31-60': 0,
      '60+': 0,
    };

    const today = new Date();

    for (const inv of unpaidInvoices) {
      const diffDays =
        (today.getTime() - inv.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);

      const outstandingAmount =
        inv.grandTotal - inv.paidAmount;

      if (diffDays <= 30)
        aging['0-30'] += outstandingAmount;
      else if (diffDays <= 60)
        aging['31-60'] += outstandingAmount;
      else aging['60+'] += outstandingAmount;
    }

    /*
     ==============================
     📦 Trip Profitability
     ==============================
     (Demo logic: cost = 70% revenue)
    */

    const trips = await this.prisma.trip.findMany({
      include: {
        bookings: {
          include: {
            invoice: true,
          },
        },
      },
    });

    const tripProfitability = trips.map(
      (trip) => {
        const revenue = trip.bookings.reduce(
          (sum, booking) =>
            sum +
            (booking.invoice?.grandTotal || 0),
          0,
        );

        const estimatedCost = revenue * 0.7;
        const profit = revenue - estimatedCost;

        return {
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          revenue,
          estimatedCost,
          profit,
        };
      },
    );

    /*
     ==============================
     🚀 Final Response
     ==============================
    */

    return {
      revenue: {
        total: totalRevenueAmount,
        collected: totalCollectedAmount,
        outstanding,
      },
      invoices: invoiceStatusCounts,
      bookings: bookingStatusCounts,
      trips: tripStatusCounts,
      revenueTrend,
      onTimePercentage,
      aging,
      tripProfitability,
    };
  }
}
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    async generate(bookingIds: string[]) {
        const bookings = await this.prisma.booking.findMany({
            where: {
                id: { in: bookingIds },
                status: { in: ['DELIVERED', 'COMPLETED'] },
                invoiceId: null,
            },
        });

        if (!bookings.length) {
            throw new BadRequestException('No eligible delivered bookings found');
        }

        // Example freight calculation (simple demo logic)
        const totalAmount = bookings.reduce(
            (sum, b) => sum + b.weight * 10,
            0,
        );

        const gstAmount = totalAmount * 0.18;
        const grandTotal = totalAmount + gstAmount;

        const netReceivable = grandTotal;

        const invoice = await this.prisma.invoice.create({
            data: {
                invoiceNumber: `INV-${randomUUID().slice(0, 8)}`,
                totalAmount,
                cgstAmount: gstAmount / 2,
                sgstAmount: gstAmount / 2,
                igstAmount: 0,
                grandTotal,
                netReceivable,
                bookings: {
                    connect: bookings.map(b => ({ id: b.id })),
                },
            },
            include: { bookings: true },
        });

        return invoice;
    }

    async findAll() {
        return this.prisma.invoice.findMany({
            include: { bookings: true },
        });
    }
}
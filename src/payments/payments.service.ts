import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async recordPayment(invoiceId: string, data: any) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    const newPaidAmount = invoice.paidAmount + data.amount;

    if (newPaidAmount > invoice.grandTotal) {
      throw new BadRequestException('Payment exceeds invoice total');
    }

    // Create payment record
    await this.prisma.payment.create({
      data: {
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        referenceNo: data.referenceNo,
        notes: data.notes,
        invoiceId: invoiceId,
      },
    });

    // Update invoice
    let newStatus = invoice.status;

    if (newPaidAmount === invoice.grandTotal) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
      include: { payments: true },
    });
  }

  async addPayment(invoiceId: string, amount: number) {
  const invoice = await this.prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) throw new Error('Invoice not found');

  await this.prisma.payment.create({
    data: {
      invoiceId,
      amount,
      paymentDate: new Date(),
    },
  });

  const updatedPaid = invoice.paidAmount + amount;



 const receivable = invoice.netReceivable ?? invoice.grandTotal;



let status: InvoiceStatus;

if (updatedPaid >= receivable) {
  status = InvoiceStatus.PAID;
} else {
  status = InvoiceStatus.PARTIALLY_PAID;
}

  return this.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: updatedPaid,
      status,
    },
  });
}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        invoice: true,
      },
    });
  }
}
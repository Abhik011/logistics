import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  /* ================= CREATE ================= */

  async create(data: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
        isActive: data.isActive ?? true,

        contacts: data.contacts
          ? { create: data.contacts }
          : undefined,

        locations: data.locations
          ? { create: data.locations }
          : undefined,
      },
      include: {
        contacts: true,
        locations: true,
      },
    });
  }

  /* ================= UPDATE ================= */
async update(id: string, data: UpdateCustomerDto) {
  return this.prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      creditLimit: data.creditLimit,
      paymentTerms: data.paymentTerms,
      isActive: data.isActive,

      contacts: data.contacts
        ? {
            deleteMany: {}, // remove old contacts
            create: data.contacts,
          }
        : undefined,

      locations: data.locations
        ? {
            deleteMany: {}, // remove old locations
            create: data.locations,
          }
        : undefined,
    },
    include: {
      contacts: true,
      locations: true,
    },
  });
}

  /* ================= FIND ALL ================= */

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              gstNumber: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
          isDeleted: false,
        }
      : {
          isDeleted: false,
        };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          contacts: true,
          locations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ================= SOFT DELETE ================= */

  async softDelete(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
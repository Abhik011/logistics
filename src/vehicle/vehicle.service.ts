import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateVehicleDto) {

    const existing = await this.prisma.vehicle.findUnique({
      where: { registrationNo: data.registrationNo },
    });

    if (existing) {
      throw new BadRequestException("Vehicle already registered");
    }

    return this.prisma.vehicle.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
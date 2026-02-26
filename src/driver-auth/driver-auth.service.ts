import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateDriverProfileDto } from './driver-profile.dto';

@Injectable()
export class DriverAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /* ================= REGISTER ================= */

  async registerFullProfile(
    data: CreateDriverProfileDto,
  ) {
    // Check if driver already exists
    const existing = await this.prisma.driver.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new BadRequestException(
        'Driver with this phone already exists',
      );
    }

    const hashed = await bcrypt.hash(
      data.password,
      10,
    );

    const driver = await this.prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashed,
        licenseNo: data.licenseNo,
      },
    });

    return {
      message: 'Driver registered successfully',
      driver,
    };
  }

  /* ================= LOGIN ================= */

  async login(phone: string, password: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
    });

    if (!driver) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const isValid = await bcrypt.compare(
      password,
      driver.password,
    );

    if (!isValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const token = this.jwt.sign({
      sub: driver.id,
      role: 'DRIVER',
    });

    return {
      accessToken: token,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        licenseNo: driver.licenseNo,
      },
    };
  }

  /* ================= GET PROFILE ================= */

  async getProfile(driverId: string) {
    return this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        phone: true,
        licenseNo: true,
        licenseExpiry: true,
        createdAt: true,
      },
    });
  }

  /* ================= UPDATE PROFILE ================= */

  async updateProfile(
    driverId: string,
    data: {
      name?: string;
      licenseNo?: string;
      licenseExpiry?: string;
    },
  ) {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        name: data.name,
        licenseNo: data.licenseNo,
        licenseExpiry: data.licenseExpiry
          ? new Date(data.licenseExpiry)
          : undefined,
      },
    });
  }
}
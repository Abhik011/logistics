import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';   

@Injectable()
export class DriverAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ✅ REGISTER
  async registerFullProfile(data: any) {
    const hashed = await bcrypt.hash(data.password, 10);

    const driver = await this.prisma.driver.create({
      data: {
        name: data.name,
        phone: data.phone,
        password: hashed,
        licenseNo: data.licenseNo,
      },
    });

    return driver;
  }

  // ✅ LOGIN
  async login(phone: string, password: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { phone },
    });

    if (!driver) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(
      password,
      driver.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwt.sign({
      sub: driver.id,
      role: 'DRIVER',
    });

    return {
      accessToken: token,
      driver,
    };
  }

  // ✅ GET PROFILE
  async getProfile(driverId: string) {
    return this.prisma.driver.findUnique({
      where: { id: driverId },
    });
  }

  // ✅ UPDATE PROFILE
  async updateProfile(driverId: string, data: any) {
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
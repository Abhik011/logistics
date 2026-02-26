import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';


@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private prisma: PrismaService,
  ) {}

  @Roles('ADMIN', 'OPERATIONS')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: BookingStatus },
  ) {
    return this.bookingsService.updateStatus(id, body.status);
  }

  @Post('register-driver')
  async registerDriver(@Body() body: any) {
    return this.prisma.driver.create({
      data: {
        name: body.name,
        phone: body.phone,
        password: await bcrypt.hash(body.password, 10),
        licenseNo: body.licenseNo,
      },
    });
  }

  @Roles('ADMIN', 'SALES', 'OPERATIONS')
  @Post()
  create(@Req() req: any, @Body() body: any) {
     console.log("req.user:", req.user);
    return this.bookingsService.create(req.user.sub, body);
  }

  @Roles('ADMIN', 'SALES', 'OPERATIONS')
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }
}
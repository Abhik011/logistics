import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { DriverAuthService } from './driver-auth.service';
import { CreateDriverProfileDto } from './driver-profile.dto';
import { DriverJwtAuthGuard } from './driver-jwt-auth.guard';

@Controller('driver-auth')
export class DriverAuthController {
  constructor(private readonly authService: DriverAuthService) {}

  /* ================= REGISTER ================= */

  @Post('register-full')
  async registerFull(
    @Body() body: CreateDriverProfileDto,
  ) {
    return this.authService.registerFullProfile(body);
  }

  /* ================= LOGIN ================= */

  @Post('login')
  async login(
    @Body()
    body: { phone: string; password: string },
  ) {
    return this.authService.login(
      body.phone,
      body.password,
    );
  }

  /* ================= PROFILE ================= */

  @Get('profile')
  @UseGuards(DriverJwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @Put('profile')
  @UseGuards(DriverJwtAuthGuard)
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      licenseNo?: string;
      licenseExpiry?: string;
    },
  ) {
    return this.authService.updateProfile(
      req.user.sub,
      body,
    );
  }
}
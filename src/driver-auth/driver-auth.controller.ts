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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DriverJwtAuthGuard } from './driver-jwt-auth.guard';

@Controller('driver-auth')
export class DriverAuthController {
    constructor(private authService: DriverAuthService) { }

    // ✅ GET PROFILE
    @Get('profile')
    @UseGuards(DriverJwtAuthGuard)
    getProfile(@Req() req) {
        return this.authService.getProfile(req.user.sub);
    }

    // ✅ UPDATE PROFILE
    @Put('profile')
    @UseGuards(DriverJwtAuthGuard)
    updateProfile(@Req() req, @Body() body) {
        return this.authService.updateProfile(req.user.sub, body);
    }

    // ✅ REGISTER FULL PROFILE
    @Post('register-full')
    registerFull(@Body() body: CreateDriverProfileDto) {
        return this.authService.registerFullProfile(body);
    }

    // ✅ LOGIN
    @Post('login')
    login(@Body() body: any) {
        return this.authService.login(body.phone, body.password);
    }
}
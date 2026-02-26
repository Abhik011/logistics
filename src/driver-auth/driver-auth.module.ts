import { Module } from '@nestjs/common';
import { DriverAuthService } from './driver-auth.service';
import { DriverAuthController } from './driver-auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { DriverJwtStrategy } from './driver-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [DriverAuthController],
  providers: [DriverAuthService, DriverJwtStrategy],
  exports: [DriverAuthService],
})
export class DriverAuthModule {}
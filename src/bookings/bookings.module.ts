import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module'; // 👈 NEW
import { TripsModule} from '../trips/trips.module'; // 👈 NEW
import { GatewayModule } from '../gateways/gateway.module'; // 👈 NEW
@Module({
  imports: [PrismaModule,CommonModule,TripsModule,GatewayModule] , // 👈 IMPORTANT
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
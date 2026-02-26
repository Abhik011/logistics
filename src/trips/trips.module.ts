import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TripsGateway } from './trip.gateway';
@Module({
  imports: [PrismaModule],
  controllers: [TripsController],
  providers: [TripsService, TripsGateway],
   exports: [TripsService]
})
export class TripsModule {}
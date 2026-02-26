import { Module } from '@nestjs/common';
import { BookingGateway } from './booking.gateway';

@Module({
  providers: [BookingGateway],
  exports: [BookingGateway],   // ✅ VERY IMPORTANT
})
export class GatewayModule {}
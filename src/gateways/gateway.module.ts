import { Module } from '@nestjs/common';
import { AppGateway } from './booking.gateway';

@Module({
  providers: [AppGateway],
  exports: [AppGateway],   // ✅ VERY IMPORTANT
})
export class GatewayModule {}
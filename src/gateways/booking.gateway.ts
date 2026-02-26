import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BookingGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('✅ WebSocket Gateway Initialized');
  }

  emitBookingCreated(booking: any) {
    this.server.emit('booking-created', booking);
  }

  emitBookingUpdated(booking: any) {
    this.server.emit('booking-updated', booking);
  }
}
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],   // 🚀 force websocket only
})
export class BookingGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('✅ Booking WebSocket Gateway Initialized');
  }

  emitBookingCreated(booking: any) {
    this.server.emit('booking-created', booking);
  }

  emitBookingUpdated(booking: any) {
    this.server.emit('booking-updated', booking);
  }
}
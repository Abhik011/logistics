import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

// @WebSocketGateway({
//   cors: {
//     origin: true,
//     credentials: true,
//   },
//   transports: ['websocket'],
// })
export class TripsGateway {
  @WebSocketServer()
  server: Server;

  emitTripUpdated(trip: any) {
    this.server.emit('trip-updated', trip);
  }
}
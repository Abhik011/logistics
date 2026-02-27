import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TripsGateway {
  @WebSocketServer()
  server: Server;

  emitTripCreated(trip: any) {
    this.server?.emit('trip-created', trip);
  }
  

  emitTripLocationUpdated(location: any) {
    this.server?.emit('trip-location-updated', location);
  }

  emitTripUpdated(trip: any) {
    this.server?.emit('trip-updated', trip);
  }
}
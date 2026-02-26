import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TripStatus } from '@prisma/client';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) { }

  @Roles('ADMIN', 'OPERATIONS')
  @Post()
  create(@Body() body: any) {
    return this.tripsService.create(body);
  }

  @Roles('ADMIN', 'OPERATIONS', 'DRIVER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Roles('ADMIN', 'OPERATIONS', 'DRIVER')
  @Post(':id/fuel')
  addFuel(
    @Param('id') id: string,
    @Body() body: { litres: number; amount: number }
  ) {
    return this.tripsService.addFuel(id, body);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'OPERATIONS')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TripStatus },
  ) {
    return this.tripsService.updateStatus(id, body.status);
  }

  @Roles('ADMIN', 'OPERATIONS')
  @Patch(':id/assign-vehicle')
  assignVehicle(
    @Param('id') id: string,
    @Body() body: { vehicleId: string },
  ) {
    return this.tripsService.assignVehicleToTrip(id, body.vehicleId);
  }
  @Roles('ADMIN', 'OPERATIONS')
  @Patch(':id/assign')
  assignBookings(
    @Param('id') id: string,
    @Body() body: { bookingIds: string[] },
  ) {
    return this.tripsService.assignBookings(id, body.bookingIds);
  }
  @Patch(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; speed?: number }
  ) {
    return this.tripsService.updateLocation(id, body);
  }
  @Roles('ADMIN', 'OPERATIONS', 'SALES')
  @Get(':id/latest-location')
  getLatestLocation(@Param('id') id: string) {
    return this.tripsService.getLatestLocation(id);
  }
  @Roles('ADMIN', 'OPERATIONS', 'SALES')
  @Get()
  findAll() {
    return this.tripsService.findAll();
  }
}
import { Controller, Post, Body, Get } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './vehicle.dto';

@Controller('vehicles')
export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  @Post()
  create(@Body() body: CreateVehicleDto) {
    return this.vehicleService.create(body);
  }

  @Get()
  findAll() {
    return this.vehicleService.findAll();
  }
}
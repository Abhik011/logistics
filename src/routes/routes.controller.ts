import { Controller, Post, Body } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('routes')
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Post('calculate-distance')
  calculate(@Body() body: any) {
    return this.routesService.calculateDistance(
      body.origin,
      body.destination,
    );
  }
}
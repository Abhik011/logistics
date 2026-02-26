import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles('ADMIN', 'FINANCE')
  @Post('/generate')
  generate(@Body() body: { bookingIds: string[] }) {
    return this.invoicesService.generate(body.bookingIds);
  }

  @Roles('ADMIN', 'FINANCE')
  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }
}
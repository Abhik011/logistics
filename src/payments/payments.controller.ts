import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles('ADMIN', 'FINANCE')
  @Post(':invoiceId')
  record(
    @Param('invoiceId') invoiceId: string,
    @Body() body: any,
  ) {
    return this.paymentsService.recordPayment(invoiceId, body);
  }

  @Roles('ADMIN', 'FINANCE')
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
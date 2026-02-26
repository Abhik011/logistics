import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ✅ CREATE
  @Roles('ADMIN', 'SALES')
  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.customersService.create(body);
  }

  // ✅ UPDATE
  @Roles('ADMIN', 'SALES')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, body);
  }

  // ✅ GET WITH PAGINATION + SEARCH
  @Roles('ADMIN', 'SALES', 'OPERATIONS')
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(
      Number(page),
      Number(limit),
      search,
    );
  }

  // ✅ SOFT DELETE
  @Roles('ADMIN')
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }
}
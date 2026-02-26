

import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  heading?: number;
}

export class FuelEntryDto {
  litres: number;
  ratePerLitre: number;
  odometer?: number;
}

export class ExpenseDto {
  type: string;
  amount: number;
  description?: string;
}
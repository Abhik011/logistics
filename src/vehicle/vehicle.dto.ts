import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { VehicleOwnership } from '@prisma/client';

export class CreateVehicleDto {

  @IsString()
  registrationNo: string;

  @IsEnum(VehicleOwnership)
  ownership: VehicleOwnership;

  @IsOptional()
  @IsNumber()
  capacityTons?: number;

  @IsOptional()
  @IsString()
  bodyType?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsNumber()
  costPerKm?: number;
}
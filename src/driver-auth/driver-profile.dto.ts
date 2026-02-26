import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateDriverProfileDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  password: string;

  @IsString()
  vehicleNumber: string;

  @IsNumber()
  ratePerKm: number;

  @IsNumber()
  ratePer4Km: number;

  @IsOptional()
  @IsString()
  licenseNo?: string;
}
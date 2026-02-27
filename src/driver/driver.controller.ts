import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { DriverService } from './driver.service';
import { UpdateLocationDto, FuelEntryDto, ExpenseDto } from './driver.dto';
import { UseGuards, Req } from '@nestjs/common';
import { DriverJwtAuthGuard } from '../driver-auth/driver-jwt-auth.guard';
import { TripStatus } from '@prisma/client';
@Controller('driver')
@UseGuards(DriverJwtAuthGuard)
export class DriverController {
    constructor(private driverService: DriverService) { }


    @UseGuards(DriverJwtAuthGuard)
    @Get('my-trips')
    getTrips(@Req() req) {
        const driverId = req.user.sub;
        return this.driverService.getDriverTrips(driverId);
    }

    @Post('trip/:tripId/location')
    updateLocation(
        @Param('tripId') tripId: string,
        @Body() body: UpdateLocationDto,
        @Req() req,
    ) {
        return this.driverService.updateLocation(
            tripId,
            req.user.sub,
            body,
        );
    }

    @Post('trip/:tripId/fuel/:vehicleId')
    addFuel(
        @Param('tripId') tripId: string,
        @Param('vehicleId') vehicleId: string,
        @Body() body: FuelEntryDto,
    ) {
        return this.driverService.addFuel(tripId, vehicleId, body);
    }


    @Post('trip/:tripId/expense')
    addExpense(
        @Param('tripId') tripId: string,
        @Body() body: ExpenseDto,
    ) {
        return this.driverService.addExpense(tripId, body);
    }

    @Patch('trip/:tripId/status')
    updateStatus(
        @Param('tripId') tripId: string,
        @Body('status') status: string,
        @Req() req,
    ) {
        return this.driverService.updateTripStatus(
            tripId,
            req.user.sub,
            status as TripStatus,
        );
    }
}
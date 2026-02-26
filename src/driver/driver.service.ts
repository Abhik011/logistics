import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto, FuelEntryDto, ExpenseDto } from './driver.dto';

@Injectable()
export class DriverService {
    constructor(private prisma: PrismaService) { }

    /* ================= MY TRIPS ================= */

    async getDriverTrips(driverId: string) {
        console.log("Driver ID received:", driverId);

        return this.prisma.trip.findMany({
            where: {
                driverId: driverId,
                status: {
                    in: ['PLANNED', 'DISPATCHED', 'IN_TRANSIT'],
                },
            },
            include: {
                vehicle: true,
            },
            orderBy: {
                startDate: 'desc',
            },
        });
    }
    /* ================= LIVE LOCATION ================= */

    async updateLocation(
        tripId: string,
        driverId: string,
        data: UpdateLocationDto,
    ) {
        console.log("TripId:", tripId);
        console.log("DriverId:", driverId);
        console.log("Body:", data);

        // ✅ Check trip exists AND belongs to this driver
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                driverId: driverId,
            },
        });

        console.log("Trip found:", trip);

        if (!trip) {
            throw new BadRequestException("Trip not found or not assigned to driver");
        }

        // ✅ Optional: Only allow tracking when trip is active
        if (!["DISPATCHED", "IN_TRANSIT"].includes(trip.status)) {
            throw new BadRequestException("Trip not active");
        }

        return this.prisma.tripLocation.create({
            data: {
                tripId: trip.id,
                latitude: Number(data.latitude),
                longitude: Number(data.longitude),
                speed: Number(data.speed ?? 0),
                heading: Number(data.heading ?? 0),
            },
        });
    }

    /* ================= FUEL ENTRY ================= */

    async addFuel(tripId: string, vehicleId: string, data: FuelEntryDto) {
        const amount = data.litres * data.ratePerLitre;

        await this.prisma.fuelEntry.create({
            data: {
                tripId,
                vehicleId,
                litres: data.litres,
                ratePerLitre: data.ratePerLitre,
                amount,
                odometer: data.odometer,
                entryDate: new Date(),
            },
        });

        await this.updateTripCost(tripId, amount);

        return { message: 'Fuel entry added' };
    }

    /* ================= EXPENSE ENTRY ================= */

    async addExpense(tripId: string, data: ExpenseDto) {
        await this.prisma.tripExpense.create({
            data: {
                tripId,
                type: data.type as any,
                amount: data.amount,
                description: data.description,
                expenseDate: new Date(),
            },
        });

        await this.updateTripCost(tripId, data.amount);

        return { message: 'Expense added' };
    }

    /* ================= UPDATE TRIP COST ================= */

    private async updateTripCost(tripId: string, additionalCost: number) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
        });

        const newCost = (trip?.actualCost || 0) + additionalCost;

        await this.prisma.trip.update({
            where: { id: tripId },
            data: {
                actualCost: newCost,
                profit: (trip?.revenue || 0) - newCost,
            },
        });
    }

    /* ================= UPDATE STATUS ================= */

    async updateTripStatus(
        tripId: string,
        driverId: string,
        status: any,
    ) {
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                driverId: driverId,
            },
        });

        if (!trip) {
            throw new BadRequestException("Trip not found");
        }

        return this.prisma.trip.update({
            where: { id: tripId },
            data: { status },
        });
    }
}
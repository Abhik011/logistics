import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto, FuelEntryDto, ExpenseDto } from './driver.dto';
import { TripStatus } from '@prisma/client';
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
                  in: [
  TripStatus.PLANNED,
  TripStatus.DISPATCHED,
  TripStatus.IN_TRANSIT,
],
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
  const trip = await this.prisma.trip.findFirst({
    where: {
      id: tripId,
      driverId: driverId,
    },
  });

  if (!trip) {
    throw new BadRequestException("Trip not found or not assigned to driver");
  }

  if (!["DISPATCHED", "IN_TRANSIT"].includes(trip.status)) {
    throw new BadRequestException("Trip not active");
  }

  // 🔥 Get last location
  const lastLocation = await this.prisma.tripLocation.findFirst({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });

  let distance = 0;

  if (lastLocation) {
    const R = 6371000;
    const toRad = (val: number) => (val * Math.PI) / 180;

    const dLat = toRad(data.latitude - lastLocation.latitude);
    const dLon = toRad(data.longitude - lastLocation.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lastLocation.latitude)) *
        Math.cos(toRad(data.latitude)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance = R * c;
  }

  // 🔥 Save location
  await this.prisma.tripLocation.create({
    data: {
      tripId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed ?? 0,
      heading: data.heading ?? 0,
    },
  });

  // 🔥 Update trip total distance
  await this.prisma.trip.update({
    where: { id: tripId },
    data: {
      distanceCovered: {
        increment: distance,
      },
    },
  });

  return { message: "Location updated" };
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
  status: TripStatus,
) {
  const trip = await this.prisma.trip.findFirst({
    where: {
      id: tripId,
      driverId,
    },
  });

  if (!trip) {
    throw new BadRequestException("Trip not found");
  }

  // 🔥 Only allow valid status change
const allowed: TripStatus[] = [
  TripStatus.IN_TRANSIT,
  TripStatus.DELIVERED,
];

  if (!allowed.includes(status)) {
    throw new BadRequestException("Invalid status");
  }

  return this.prisma.trip.update({
    where: { id: tripId },
    data: { status },
  });
}
}
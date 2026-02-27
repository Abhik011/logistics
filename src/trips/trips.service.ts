import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TripsGateway } from './trip.gateway';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService,
    private gateway: TripsGateway,
  ) { }

  async create(data: any) {
    console.log("CREATE TRIP HIT");
    // 1️⃣ Find available driver
    const freeDriver = await this.prisma.driver.findFirst({
      where: {
        isActive: true,
        trips: {
          none: {
            status: {
              in: ['DISPATCHED', 'IN_TRANSIT'],
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // FIFO assignment
      },
    });
    console.log("Free Driver:", freeDriver);

    if (!freeDriver) {
      throw new BadRequestException("No available drivers");
    }

    // 2️⃣ Create trip
    const trip = await this.prisma.trip.create({
      data: {
        tripNumber: `TR-${randomUUID().slice(0, 8)}`,
        startDate: new Date(data.startDate),
        driverId: freeDriver.id,
        status: 'PLANNED',
      },
      include: {
        driver: true,
        vehicle: true,
      },

    });

    this.gateway.server.emit('trip-created', trip);

    return trip;
  }
  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
        fuelEntries: true,
        bookings: true,
      },
    });

    if (!trip) throw new BadRequestException('Trip not found');

    return trip;
  }

async addFuel(
  tripId: string,
  data: { litres: number; amount: number }
) {
  const trip = await this.prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new BadRequestException('Trip not found');
  }

  if (!trip.vehicleId) {
    throw new BadRequestException('Vehicle not assigned to trip');
  }

  const ratePerLitre = data.amount / data.litres;

  return this.prisma.fuelEntry.create({
    data: {
      tripId: tripId,
      vehicleId: trip.vehicleId,   // ✅ required
      litres: data.litres,
      ratePerLitre: ratePerLitre,  // ✅ required
      amount: data.amount,
      entryDate: new Date(),       // ✅ required
    },
  });
}
  async assignBookings(tripId: string, bookingIds: string[]) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new BadRequestException('Trip not found');
    }

    // Ensure bookings exist and are not already assigned
    const bookings = await this.prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        tripId: null,
      },
    });

    if (bookings.length !== bookingIds.length) {
      throw new BadRequestException('Some bookings are invalid or already assigned');
    }

    await this.prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: {
        tripId: tripId,
        status: 'PLANNED',
      },
    });

    return { message: 'Bookings assigned and marked as PLANNED' };
  }
  async assignDriverVehicle(
    tripId: string,
    driverId: string,
    vehicleId: string,
  ) {
    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        driverId,
        vehicleId,
      },
    });
  }
  private calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius KM
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  private deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
  async updateLocation(id: string, data: any) {
    const lastLocation = await this.prisma.tripLocation.findFirst({
      where: { tripId: id },
      orderBy: { createdAt: 'desc' },
    });

    const location = await this.prisma.tripLocation.create({
      data: {
        tripId: id,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
      },
    });

    // 🔥 Calculate distance if previous exists
    if (lastLocation) {
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        data.latitude,
        data.longitude,
      );

      await this.prisma.trip.update({
        where: { id },
        data: {
          totalDistanceKm: {
            increment: distance,
          },
        },
      });
    }

    this.gateway.server.emit('trip-location-updated', location);

    return location;
  }
  async calculateTripCost(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: true,
        bookings: true,
      },
    });

    if (!trip || !trip.vehicle) {
      throw new Error('Trip or vehicle not found');
    }

    if (!trip.vehicle.costPerKm) {
      throw new Error('Vehicle cost per KM not defined');
    }

    const totalKm = trip.totalDistanceKm || 0;
    const costPerKm = trip.vehicle.costPerKm || 0;

    // 1️⃣ Running Cost
    const runningCost = totalKm * costPerKm;

    // 2️⃣ Total Weight & Volume
    const totalWeight = trip.bookings.reduce(
      (sum, b) => sum + (b.weight || 0),
      0,
    );

    const totalVolume = trip.bookings.reduce(
      (sum, b) => sum + (b.volume || 0),
      0,
    );

    // 3️⃣ Weight Impact
    let weightFactor = 1;
    if (trip.vehicle.capacityTons) {
      weightFactor = totalWeight / trip.vehicle.capacityTons;
    }

    // 4️⃣ Volume Impact
    let volumeFactor = 1;
    if (trip.vehicle.capacityCbm) {
      volumeFactor = totalVolume / trip.vehicle.capacityCbm;
    }

    // Take higher utilization
    const utilizationFactor = Math.min(
      Math.max(weightFactor, volumeFactor),
      1
    );

    // 5️⃣ Utilization Adjustment
    const adjustedCost = runningCost * utilizationFactor;

    // 6️⃣ Add 15% Margin
    const finalCost = adjustedCost * 1.15;

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        actualCost: finalCost,
      },
    });
  }
  async calculateInternalCost(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: true,
        bookings: true,
        expenses: true,
        fuelEntries: true,
      },
    });

    if (!trip || !trip.vehicle) {
      throw new Error('Trip or vehicle not found');
    }

    if (!trip.vehicle.costPerKm) {
      throw new Error('Vehicle cost per KM not defined');
    }

    const totalKm = trip.totalDistanceKm || 0;
    const runningCost = totalKm * trip.vehicle.costPerKm;

    const fuelCost = trip.fuelEntries.reduce(
      (sum, f) => sum + f.amount,
      0,
    );

    const expenseCost = trip.expenses.reduce(
      (sum, e) => sum + e.amount,
      0,
    );

    const totalInternalCost = runningCost + fuelCost + expenseCost;

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        actualCost: totalInternalCost,
      },
    });
  }
  async calculateCustomerRevenue(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!trip || trip.bookings.length === 0) {
      throw new Error('Trip or bookings not found');
    }

    const customerId = trip.bookings[0].customerId;

    const contract = await this.prisma.rateContract.findFirst({
      where: {
        customerId,
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });

    if (!contract) {
      throw new Error('No active rate contract found');
    }

    const totalWeight = trip.bookings.reduce(
      (sum, b) => sum + (b.weight || 0),
      0,
    );

    const totalKm = trip.totalDistanceKm || 0;

    let revenue = 0;

    if (contract.ratePerTon) {
      revenue = totalWeight * contract.ratePerTon;
    } else if (contract.ratePerKm) {
      revenue = totalKm * contract.ratePerKm;
    } else if (contract.flatRate) {
      revenue = contract.flatRate;
    }

    if (contract.fuelSurchargePercent) {
      revenue += revenue * (contract.fuelSurchargePercent / 100);
    }

    const gst = revenue * 0.18;
    const grandTotal = revenue + gst;

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        revenue: revenue, // TAXABLE ONLY
      },
    });
  }
  async calculateProfit(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) throw new Error('Trip not found');

    const profit = (trip.revenue || 0) - (trip.actualCost || 0);

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { profit },
    });
  }
  async getLatestLocation(tripId: string) {
    return this.prisma.tripLocation.findFirst({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }
  async updateStatus(tripId: string, newStatus: TripStatus) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { bookings: true },
    });

    if (!trip) {
      throw new BadRequestException('Trip not found');
    }

    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: newStatus },
    });

    // Sync booking status
    let bookingStatus;

    switch (newStatus) {
      case 'DISPATCHED':
        bookingStatus = 'DISPATCHED';
        break;
      case 'IN_TRANSIT':
        bookingStatus = 'IN_TRANSIT';
        break;
      case 'COMPLETED':
        bookingStatus = 'COMPLETED';
        break;
      default:
        return trip;
    }

    await this.prisma.booking.updateMany({
      where: { tripId: tripId },
      data: { status: bookingStatus },
    });
    if (newStatus === 'COMPLETED') {
      await this.calculateInternalCost(tripId);
      await this.calculateCustomerRevenue(tripId);
      await this.calculateProfit(tripId);
      await this.generateInvoiceFromTrip(tripId);
    }
    return { message: 'Trip and bookings updated successfully' };
  }
  async generateInvoiceFromTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bookings: {
          include: { customer: true },
        },
      },
    });

    if (!trip || trip.bookings.length === 0) {
      throw new Error('Trip or bookings not found');
    }

    const customer = trip.bookings[0].customer;
    const taxableAmount = trip.revenue || 0;

    const gstPercent = 18;
    const gstValue = taxableAmount * (gstPercent / 100);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (customer.state === process.env.COMPANY_STATE) {
      cgst = gstValue / 2;
      sgst = gstValue / 2;
    } else {
      igst = gstValue;
    }

    const tdsPercent = 1; // Example
    const tdsAmount = taxableAmount * (tdsPercent / 100);

    const grandTotal = taxableAmount + gstValue;
    const netReceivable = grandTotal - tdsAmount;

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-' + randomUUID().slice(0, 8),
        totalAmount: taxableAmount,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        gstPercent,
        tdsAmount,
        grandTotal,
        netReceivable,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        tripId,
        bookings: {
          connect: trip.bookings.map(b => ({ id: b.id })),
        },
      },
    });
  }
  async assignVehicleToTrip(tripId: string, vehicleId: string) {

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new BadRequestException("Trip not found");
    }

    if (trip.vehicleId) {
      throw new BadRequestException("Vehicle already assigned to this trip");
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || !vehicle.isActive) {
      throw new BadRequestException("Vehicle not available");
    }

    // Check if vehicle is already on active trip
    const activeTrip = await this.prisma.trip.findFirst({
      where: {
        vehicleId,
        status: {
          in: ['PLANNED', 'DISPATCHED', 'IN_TRANSIT'],
        },
      },
    });

    if (activeTrip) {
      throw new BadRequestException(
        "Vehicle already on active trip"
      );
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { vehicleId },
      include: {
        driver: true,
        vehicle: true,
      },
    });
  }
  async findAll() {
    return this.prisma.trip.findMany({
      include: {
        driver: true,   // ✅ MUST ADD
        vehicle: true,  // ✅ MUST ADD
        bookings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
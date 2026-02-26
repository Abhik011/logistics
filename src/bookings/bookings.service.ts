import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, TripStatus, } from '@prisma/client';
import { randomUUID } from 'crypto';
import { GoogleMapsService } from '../common/google-maps.service';
import { TripsService } from '../trips/trips.service';
import { BookingGateway } from '../gateways/booking.gateway';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService,
    private googleMaps: GoogleMapsService,
    private tripsService: TripsService,
    private bookingGateway: BookingGateway, 
  ) { }

  /* ================= CREATE BOOKING ================= */

  async create(userId: string, data: any) {
    if (!data.pickupAddress || !data.deliveryAddress) {
      throw new BadRequestException(
        'Pickup and delivery required',
      );
    }
    /* ================= FIND OR CREATE ROUTE ================= */
    let route = await this.prisma.route.findFirst({
      where: {
        origin: data.pickupAddress.trim(),
        destination: data.deliveryAddress.trim(),
      },
    });

    if (!route) {
      const realDistance =
        await this.googleMaps.getDistance(
          data.pickupAddress,
          data.deliveryAddress,
        );

      route = await this.prisma.route.create({
        data: {
          code: 'R-' + randomUUID().slice(0, 8),
          origin: data.pickupAddress.trim(),
          destination: data.deliveryAddress.trim(),
          distanceKm: realDistance,
          standardTransitDays: Math.ceil(realDistance / 400),
        },
      });
    }

    const distanceKm = route.distanceKm || 50;

    /* ================= GET RATE CONTRACT ================= */

    const rateContract =
      await this.prisma.rateContract.findFirst({
        where: {
          customerId: data.customerId,
          isActive: true,
          serviceType: data.serviceType,
        },
        orderBy: {
          validFrom: 'desc',
        },
      });

    let revenue = 0;

    if (rateContract) {
      if (rateContract.flatRate) {
        revenue = rateContract.flatRate;
      } else if (rateContract.ratePerKm) {
        revenue = distanceKm * rateContract.ratePerKm;
      } else if (rateContract.ratePerTon) {
        revenue = data.weight * rateContract.ratePerTon;
      }

      if (rateContract.fuelSurchargePercent) {
        revenue +=
          (revenue *
            rateContract.fuelSurchargePercent) /
          100;
      }
    }
    else {
      revenue = distanceKm * 35;
    }

    /* ================= CREATE BOOKING ================= */

    return this.prisma.booking.create({
      data: {
        bookingNumber:
          'BK-' + randomUUID().slice(0, 8),
        serviceType: data.serviceType,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        weight: data.weight,
        volume: data.volume,
        commodity: data.commodity,
        customerId: data.customerId,
        createdById: userId,
        routeId: route.id,
        distanceKm,
        revenue,
        status: 'CREATED',
      },
      include: {
        customer: true,
        route: true,
      },
    });
  }
  /* ================= UPDATE STATUS ================= */
  async updateStatus(id: string, newStatus: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { trip: true, route: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      CREATED: ['PLANNED', 'CANCELLED'],
      PLANNED: ['DISPATCHED'],
      DISPATCHED: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED'],
      DELIVERED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${booking.status} to ${newStatus}`,
      );
    }

    let tripId = booking.tripId;

    /* ================= AUTO TRIP CREATION ================= */

    if (newStatus === 'PLANNED' && !booking.tripId) {
      const trip = await this.tripsService.create({
        startDate: new Date(),
      });

      tripId = trip.id;

      // attach booking to that trip
      await this.prisma.booking.update({
        where: { id },
        data: { tripId },
      });


      tripId = trip.id;
    }

    /* ================= UPDATE BOOKING ================= */

    /* ================= UPDATE BOOKING ================= */

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: newStatus,
        tripId: tripId,
      },
      include: {
        customer: true,
        trip: {
          include: {
            vehicle: true,
            driver: true,
          },
        },
        invoice: true,
      },
    });

    /* ================= SYNC TRIP STATUS ================= */

/* ================= SYNC TRIP STATUS ================= */

if (updatedBooking.tripId) {
  let tripStatus: TripStatus;

  switch (newStatus) {
    case 'PLANNED':
      tripStatus = 'PLANNED';
      break;

    case 'DISPATCHED':
      tripStatus = 'DISPATCHED';
      break;

    case 'IN_TRANSIT':
      tripStatus = 'IN_TRANSIT';
      break;

    case 'DELIVERED':
    case 'COMPLETED':
      tripStatus = 'COMPLETED';
      break;

    default:
      tripStatus = 'PLANNED';
  }

  await this.prisma.trip.update({
    where: { id: updatedBooking.tripId },
    data: { status: tripStatus },
  });
}

    return updatedBooking;
  }
  /* ================= FIND ALL ================= */
  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        customer: true,
        trip: {
          include: {
            vehicle: true,
            driver: true,
          },
        },
        invoice: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
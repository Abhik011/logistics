import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RoutesService {
  async calculateDistance(origin: string, destination: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

    const response = await axios.get(url, {
      params: {
        origins: origin,
        destinations: destination,
        key: apiKey,
      },
    });

    const element =
      response.data.rows[0].elements[0];

    if (element.status !== 'OK') {
      throw new Error('Unable to calculate distance');
    }

    const distanceInMeters =
      element.distance.value;

    const distanceKm =
      distanceInMeters / 1000;

    return {
      distanceKm: Number(distanceKm.toFixed(2)),
    };
  }
}
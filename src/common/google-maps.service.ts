import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';


@Injectable()
export class GoogleMapsService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY;

  async getDistance(origin: string, destination: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json`,
        {
          params: {
            origins: origin,
            destinations: destination,
            key: this.apiKey,
          },
        },
      );

      const element =
        response.data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new BadRequestException(
          'Unable to calculate distance',
        );
      }

      const distanceKm =
        element.distance.value / 1000; // meters → km

      return distanceKm;
    } catch (error) {
      throw new BadRequestException(
        'Google Maps API error',
      );
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';

interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    province?: string;
  };
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger('GeocodeService');
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

  /**
   * Get city name from latitude and longitude using Nominatim (OpenStreetMap)
   * Falls back gracefully if service is unavailable
   */
  async getCityFromCoordinates(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CitizenAlert/1.0',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `Nominatim API returned status ${response.status} for coordinates ${latitude},${longitude}`,
        );
        return undefined;
      }

      const data: NominatimResponse = await response.json();

      if (!data.address) {
        this.logger.warn(`No address found for coordinates ${latitude},${longitude}`);
        return undefined;
      }

      // Try to determine city in order of preference
      const city =
        data.address.city ||
        data.address.town ||
        data.address.county ||
        data.address.province;

      if (!city) {
        this.logger.warn(`No city name found in address for ${latitude},${longitude}`);
        return undefined;
      }

      this.logger.debug(`Determined city: ${city} for coordinates ${latitude},${longitude}`);
      return city;
    } catch (error) {
      this.logger.error(`Failed to reverse geocode coordinates ${latitude},${longitude}:`, error);
      // Return undefined on error - the city field is nullable, so hazard creation won't fail
      return undefined;
    }
  }
}

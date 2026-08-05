import { geocode } from '../api/find-a-provider-client.js';

export interface LocationArgs {
  address?: string;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
}

export interface ResolvedLocation {
  lat: number;
  lng: number;
  resolvedAddress?: string;
}

export async function resolveLocation(args: LocationArgs): Promise<ResolvedLocation> {
  const hasLatitude = args.latitude !== undefined;
  const hasLongitude = args.longitude !== undefined;

  if (hasLatitude !== hasLongitude) {
    throw new Error('Latitude and longitude must be provided together.');
  }

  if (hasLatitude && hasLongitude) {
    const lat = args.latitude;
    const lng = args.longitude;
    if (
      lat === undefined ||
      lng === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new Error('Latitude or longitude is outside its valid range.');
    }
    return { lat, lng };
  }

  const query = args.postal_code?.trim() || args.address?.trim();
  if (!query) {
    throw new Error(
      'Provide a postal code, an address, or both latitude and longitude.',
    );
  }

  const resolved = await geocode(query);
  return {
    lat: resolved.lat,
    lng: resolved.lng,
    resolvedAddress: resolved.displayName,
  };
}

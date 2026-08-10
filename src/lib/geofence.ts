/**
 * Utility for Geofencing calculations (Haversine Formula)
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  isWithin: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
}

/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Verifies if user position is within the office geofence boundary.
 */
export function verifyGeofence(
  userLat: number,
  userLng: number,
  officeLat: number,
  officeLng: number,
  radiusMeters: number = 150
): GeofenceResult {
  const distanceMeters = calculateDistance(userLat, userLng, officeLat, officeLng);
  const isWithin = distanceMeters <= radiusMeters;

  return {
    isWithin,
    distanceMeters,
    allowedRadiusMeters: radiusMeters,
  };
}

/**
 * Default fallback office locations if database is empty
 */
export const DEFAULT_OFFICE_LOCATIONS = [
  {
    id: "default-hq",
    name: "Kantor Pusat SmartHRIS (Jakarta)",
    address: "Jl. Jend. Sudirman No. 45, Jakarta Selatan",
    latitude: -6.2088,
    longitude: 106.8456,
    radiusMeters: 150,
    isActive: true,
  },
  {
    id: "default-surabaya",
    name: "Kantor Cabang Surabaya",
    address: "Jl. Pemuda No. 88, Surabaya",
    latitude: -7.2654,
    longitude: 112.7483,
    radiusMeters: 200,
    isActive: true,
  },
];

// NOTE: These are approximate corners. You can add more points to this array
// to make the border curve perfectly along the real city limits!
export const ANGELES_POLYGON = [
  { latitude: 15.193, longitude: 120.545 }, // NW: Clark / Margot Area
  { latitude: 15.181, longitude: 120.586 }, // North: Balibago / Dau Border
  { latitude: 15.185, longitude: 120.615 }, // NE: Pulung Cacutud / EPZA
  { latitude: 15.168, longitude: 120.64 }, // Far East: Cutud / Sapalibutad (Fixed!)
  { latitude: 15.145, longitude: 120.625 }, // SE: Capaya / Mining
  { latitude: 15.11, longitude: 120.59 }, // South: Pulungbulu / San Fernando Border
  { latitude: 15.12, longitude: 120.54 }, // SW: Cuayan / Porac Border
  { latitude: 15.155, longitude: 120.485 }, // Far West: Sapangbato
];

// 🚀 The Ray-Casting Algorithm
// This fires an imaginary laser beam from the dropped pin. If the laser crosses
// the polygon boundary an odd number of times, the pin is INSIDE the city.
export const isWithinAngelesCity = (lat: number, lng: number): boolean => {
  let isInside = false;

  for (
    let i = 0, j = ANGELES_POLYGON.length - 1;
    i < ANGELES_POLYGON.length;
    j = i++
  ) {
    const xi = ANGELES_POLYGON[i].latitude;
    const yi = ANGELES_POLYGON[i].longitude;
    const xj = ANGELES_POLYGON[j].latitude;
    const yj = ANGELES_POLYGON[j].longitude;

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) {
      isInside = !isInside;
    }
  }

  return isInside;
};

export const calculateTraceDistanceKm = (
  trace: { latitude: number; longitude: number }[],
): number => {
  if (!trace || trace.length < 2) return 0;

  const toRad = (value: number) => (value * Math.PI) / 180;
  let totalDistance = 0;

  for (let i = 0; i < trace.length - 1; i++) {
    const start = trace[i];
    const end = trace[i + 1];

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    const lat1 = toRad(start.latitude);
    const lat2 = toRad(end.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDistance += R * c;
  }

  return totalDistance; // Returns actual driven distance in km
};

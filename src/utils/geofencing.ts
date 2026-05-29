import boundaryData from "./angeles_boundary.json";

// extract the array of coordinates from the JSON file.
// a GeoJSON format is strictly [longitude, latitude].
const rawCoordinates = boundaryData.features[0].geometry.coordinates[0] as [
  number,
  number,
][];

// to be converted to React Native's { latitude, longitude } format
export const ANGELES_POLYGON = rawCoordinates.map((coord: number[]) => ({
  latitude: coord[1],
  longitude: coord[0],
}));

// The Ray-Casting Algorithm
// fires an imaginary laser beam from the dropped pin. If the laser crosses the polygon boundary an odd number of times, the pin is INSIDE the city.
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

  return totalDistance; // returns actual driven distance in km
};

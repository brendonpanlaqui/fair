interface Coordinate {
  latitude: number;
  longitude: number;
}

// Earth's radius in meters
const R = 6371e3;

// 1. Convert degrees to radians
const toRad = (value: number) => (value * Math.PI) / 180;

// 2. Haversine formula to get exact distance between two points in meters
export const getDistanceInMeters = (
  point1: Coordinate,
  point2: Coordinate,
): number => {
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// The Point-to-Line Segment Algorithm
const distanceToSegment = (
  p: Coordinate,
  a: Coordinate,
  b: Coordinate,
): number => {
  // Convert lat/lng to a rough Cartesian grid for the projection math
  // We use latitude scaling to account for longitude shrinking near the poles
  const latScale = Math.cos(toRad(p.latitude));

  const px = p.longitude * latScale;
  const py = p.latitude;
  const ax = a.longitude * latScale;
  const ay = a.latitude;
  const bx = b.longitude * latScale;
  const by = b.latitude;

  const dx = bx - ax;
  const dy = by - ay;

  // If the segment is just a single point (A == B)
  if (dx === 0 && dy === 0) return getDistanceInMeters(p, a);

  // Calculate the vector projection parameter 't'
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);

  // Clamp 't' to the [0, 1] range to ensure we stay on the line segment
  t = Math.max(0, Math.min(1, t));

  // Find the closest point on the segment
  const closestPoint: Coordinate = {
    longitude: a.longitude + t * (b.longitude - a.longitude),
    latitude: a.latitude + t * (b.latitude - a.latitude),
  };

  // Return the actual Earth distance from the tricycle to that closest point
  return getDistanceInMeters(p, closestPoint);
};

// 4. The Main Export: Check distance against the entire route
export const getShortestDistanceToRoute = (
  currentPos: Coordinate,
  polyline: Coordinate[],
): number => {
  if (!polyline || polyline.length < 2) return 0;

  let minDistance = Infinity;

  // Iterate through every line segment of the route
  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = distanceToSegment(currentPos, polyline[i], polyline[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance; // Returns the distance in meters
};

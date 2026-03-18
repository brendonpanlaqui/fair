const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Asks Google for the total driving distance of a multi-stop route.
 * @returns Total distance in kilometers
 */
export const fetchRouteDistance = async (
  origin: Coordinate,
  destination: Coordinate,
  waypoints: Coordinate[] = [],
): Promise<number | null> => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    // Format waypoints for Google API (e.g., "lat,lng|lat,lng")
    const waypointsStr =
      waypoints.length > 0
        ? `&waypoints=${waypoints.map((wp) => `${wp.latitude},${wp.longitude}`).join("|")}`
        : "";

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}${waypointsStr}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      let totalMeters = 0;
      // Google returns an array of "legs" (Origin -> WP1 -> WP2 -> Dest)
      // We must add all the legs together to get the total trip distance.
      data.routes[0].legs.forEach((leg: any) => {
        totalMeters += leg.distance.value;
      });

      return totalMeters / 1000; // Convert to Kilometers
    } else {
      console.error(
        "Google Directions Error:",
        data.error_message || data.status,
      );
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch route distance:", error);
    return null;
  }
};

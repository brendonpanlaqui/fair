// Define the structure of the data coming from your Django backend
export interface ActiveFareMatrix {
  id: number;
  base_fare: string | number; // Django DecimalField usually sends as a string in JSON
  base_distance_km: number;
  succeeding_km_rate: string | number;
  discount_percent: string | number; // e.g., "0.20"
  effective_date: string;
}

/**
 * Dynamic Tricycle Fare Calculator
 * Uses the active LGU Fare Matrix pulled from the Django database.
 */
export const calculateDirectFare = (
  distanceInKm: number,
  matrix: ActiveFareMatrix, // 🚀 NEW: Pass the backend data here!
  isDiscounted: boolean = false,
): number => {
  // 1. Safely convert Django's string decimals to JavaScript numbers
  const BASE_FARE = Number(matrix.base_fare);
  const BASE_KM = Number(matrix.base_distance_km);
  const SUCCEEDING_RATE_PER_KM = Number(matrix.succeeding_km_rate);
  const DISCOUNT_DECIMAL = Number(matrix.discount_percent);

  let totalFare = BASE_FARE;

  // 2. Calculate succeeding kilometers if distance is greater than the base limit
  if (distanceInKm > BASE_KM) {
    const excessDistance = distanceInKm - BASE_KM;
    const roundedExcessDistance = Math.ceil(excessDistance);
    const excessFare = roundedExcessDistance * SUCCEEDING_RATE_PER_KM;
    totalFare += excessFare;
  }

  // 3. Apply the legal discount if the passenger qualifies
  if (isDiscounted) {
    // e.g., if discount is 0.20 (20%), multiply by (1 - 0.20) = 0.80
    const multiplier = 1 - DISCOUNT_DECIMAL;
    totalFare = Math.floor(totalFare * multiplier);
  }

  return totalFare;
};

/**
 * Angeles City Ordinance No. 723 - Tricycle Fare Matrix
 * Base Fare: ₱35.00 (First 1 kilometer, up to 2 passengers)
 * Succeeding: ₱15.00 for every additional kilometer or fraction thereof
 * Discount: 20% off total fare for Students, Seniors, PWDs, and Solo Parents
 */

export const calculateDirectFare = (
  distanceInKm: number,
  isDiscounted: boolean = false,
): number => {
  const BASE_FARE = 35;
  const BASE_KM = 1;
  const SUCCEEDING_RATE_PER_KM = 15;

  let totalFare = BASE_FARE;

  // Calculate succeeding kilometers if distance is greater than 1km
  if (distanceInKm > BASE_KM) {
    const excessDistance = distanceInKm - BASE_KM;
    const roundedExcessDistance = Math.ceil(excessDistance);
    const excessFare = roundedExcessDistance * SUCCEEDING_RATE_PER_KM;
    totalFare += excessFare;
  }

  // Apply the 20% legal discount if the passenger qualifies
  if (isDiscounted) {
    // 20% off means they pay 80% of the fare.
    // We use Math.floor to match the exact values in the PTRO matrix (e.g., 65 * 0.8 = 52)
    totalFare = Math.floor(totalFare * 0.8);
  }

  return totalFare;
};

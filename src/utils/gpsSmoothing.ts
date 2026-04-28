// 0.3 is a good starting point.
// 1.0 means no smoothing at all, 0.1 means VERY heavy smoothing.
const SMOOTHING_FACTOR = 0.3;

let previousSmoothedLocation: { lat: number; lng: number } | null = null;

export const resetSmoothing = () => {
  // clears the memory of the previous location, crucial for starting new trips cleanly without jumping
  previousSmoothedLocation = null;
};

export const getSmoothedLocation = (rawLat: number, rawLng: number) => {
  // if it is the first reading, just return it as is and set it as the "previous" for next time
  if (!previousSmoothedLocation) {
    previousSmoothedLocation = { lat: rawLat, lng: rawLng };
    return previousSmoothedLocation;
  }

  // apply the EMA formula to smooth the latitude and longitude separately
  const smoothedLat =
    SMOOTHING_FACTOR * rawLat +
    (1 - SMOOTHING_FACTOR) * previousSmoothedLocation.lat;

  const smoothedLng =
    SMOOTHING_FACTOR * rawLng +
    (1 - SMOOTHING_FACTOR) * previousSmoothedLocation.lng;

  // save for next iteration
  previousSmoothedLocation = { lat: smoothedLat, lng: smoothedLng };

  return previousSmoothedLocation;
};

export const isWithinAngelesCity = (lat: number, lng: number) => {
  const ANGELES_BOUNDS = {
    north: 15.195, // upper limit (bordering Mabalacat/Clark)
    south: 15.11, // lower limit (bordering San Fernando/Bacolor)
    east: 120.635, // right limit (bordering Mexico/Magalang)
    west: 120.515, // left limit (bordering Porac)
  };

  return (
    lat >= ANGELES_BOUNDS.south &&
    lat <= ANGELES_BOUNDS.north &&
    lng >= ANGELES_BOUNDS.west &&
    lng <= ANGELES_BOUNDS.east
  );
};

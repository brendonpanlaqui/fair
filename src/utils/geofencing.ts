export const isWithinAngelesCity = (lat: number, lng: number) => {
  const ANGELES_BOUNDS = {
    north: 15.195, // Upper limit (Bordering Mabalacat/Clark)
    south: 15.11, // Lower limit (Bordering San Fernando/Bacolor)
    east: 120.635, // Right limit (Bordering Mexico/Magalang)
    west: 120.515, // Left limit (Bordering Porac)
  };

  return (
    lat >= ANGELES_BOUNDS.south &&
    lat <= ANGELES_BOUNDS.north &&
    lng >= ANGELES_BOUNDS.west &&
    lng <= ANGELES_BOUNDS.east
  );
};

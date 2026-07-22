export function propertyMapLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export interface MapPropertyPoint {
  id: number;
  title: string;
  location: string;
  price: number;
  lat: number;
  lng: number;
  image: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy?: number;
  locationName?: string;
  city?: string;
  country?: string;
}

export interface AirportInfo {
  name: string;
  city: string;
  country: string;
}

export interface FlightData {
  id: string;
  callsign: string;
  airline: string;
  aircraft: string;
  registration: string;
  registrationCompany: string;
  origin: string;
  destination: string;
  originInfo?: AirportInfo;
  destinationInfo?: AirportInfo;
  lat: number;
  lon: number;
  altitude: number; // in feet
  speed: number; // in knots
  heading: number; // in degrees
  verticalRate: number; // feet per minute
  squawk: string;
  onGround: boolean;
  lastUpdate: Date;
  distance?: number; // distance from user location in km
}

export interface RadarSettings {
  range: number; // radar range in km
  showTrails: boolean;
  showLabels: boolean;
  updateInterval: number; // in seconds
}

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

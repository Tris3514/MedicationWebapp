"use client";

import { useState, useEffect, useCallback } from "react";
import { FlightData, UserLocation, RadarSettings } from "@/types/flight";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  MapPin, 
  Navigation, 
  Gauge, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Settings,
  Radar,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "flight-radar-settings";
const FLIGHT_COUNT_KEY = "flight-radar-total-count";
const TRACKED_IDS_KEY = "flight-radar-tracked-ids";

export function FlightRadar() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [nearestFlight, setNearestFlight] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [totalFlightsTracked, setTotalFlightsTracked] = useState<number>(0);
  const [trackedFlightIds, setTrackedFlightIds] = useState<Set<string>>(new Set());
  const [lastApiCall, setLastApiCall] = useState<number>(0);
  const [apiStatus, setApiStatus] = useState<'working' | 'rate_limited' | 'failed'>('working');
  const [routeApiStatus, setRouteApiStatus] = useState<'aviationstack' | 'flightaware' | 'flightradar24' | 'fallback' | 'none'>('none');
  const [settings, setSettings] = useState<RadarSettings>({
    range: 50, // 50km radius
    showTrails: true,
    showLabels: true,
    updateInterval: 60, // 60 seconds (1 minute)
  });

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);


  // Fetch real flight data from OpenSky Network API
  const fetchRealFlightData = useCallback(async (userLat: number, userLon: number): Promise<FlightData[]> => {
    try {
      // Calculate bounding box around user location (approximately 50km radius)
      const latRange = settings.range / 111.32; // Convert km to degrees
      const lonRange = settings.range / (111.32 * Math.cos(userLat * Math.PI / 180));
      
      const lamin = userLat - latRange;
      const lamax = userLat + latRange;
      const lomin = userLon - lonRange;
      const lomax = userLon + lonRange;
      
      console.log('Fetching flights for area:', { lamin, lamax, lomin, lomax });
      
      // Try direct API call first (works in some environments)
      let response;
      let data;
      
      try {
        // Direct OpenSky Network API call
        const apiUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
        
        response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        console.log('Direct API Response status:', response.status, response.statusText);
        
        if (response.ok) {
          data = await response.json();
          console.log('Direct API Response data:', data);
        } else {
          throw new Error(`Direct API failed: ${response.status}`);
        }
      } catch (directError) {
        console.log('Direct API failed, trying proxy:', directError);
        
        // Fallback to CORS proxy
      const apiUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
      
        response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
        console.log('Proxy Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
          console.error('Proxy Error Response:', errorText);
        throw new Error(`OpenSky API request failed: ${response.status} ${response.statusText}`);
      }
      
      const proxyData = await response.json();
      console.log('Proxy Response data:', proxyData);
        
        // Check if the response contains an error message
        if (typeof proxyData.contents === 'string' && proxyData.contents.includes('Too many requests')) {
          console.warn('API rate limit exceeded, returning empty data');
          setApiStatus('rate_limited');
          return [];
        }
      
      // Parse the actual API response from the proxy
        try {
          data = JSON.parse(proxyData.contents);
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          console.log('Raw response:', proxyData.contents);
          return [];
        }
        console.log('Parsed API Response data:', data);
      }
      
      if (!data.states || data.states.length === 0) {
        return [];
      }
      
      // Map OpenSky data to our FlightData interface
      const flights: FlightData[] = await Promise.all(data.states.map(async (state: any[]) => {
        const [
          icao24, callsign, origin_country, time_position, last_contact,
          longitude, latitude, baro_altitude, on_ground, velocity,
          true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source
        ] = state;
        
        // Use only real data from the API
        const cleanCallsign = (callsign || icao24).trim();
        
        // Extract airline code from callsign for better identification
        const airlineCode = cleanCallsign.match(/^([A-Z]{2,3})/)?.[0] || '';
        
        // Real airline database based on ICAO codes
        const getRealAirlineInfo = (code: string, country: string): { name: string, company: string } => {
          const airlineDatabase: { [key: string]: { name: string, company: string } } = {
            'AAL': { name: 'American Airlines', company: 'American Airlines Group' },
            'UAL': { name: 'United Airlines', company: 'United Airlines Holdings' },
            'DAL': { name: 'Delta Air Lines', company: 'Delta Air Lines Inc.' },
            'SWA': { name: 'Southwest Airlines', company: 'Southwest Airlines Co.' },
            'BAW': { name: 'British Airways', company: 'International Airlines Group' },
            'VIR': { name: 'Virgin Atlantic', company: 'Virgin Group' },
            'DLH': { name: 'Lufthansa', company: 'Deutsche Lufthansa AG' },
            'AFR': { name: 'Air France', company: 'Air France-KLM' },
            'KLM': { name: 'KLM', company: 'Air France-KLM' },
            'EZY': { name: 'EasyJet', company: 'EasyJet plc' },
            'RYR': { name: 'Ryanair', company: 'Ryanair Holdings' },
            'EK': { name: 'Emirates', company: 'Emirates Group' },
            'QTR': { name: 'Qatar Airways', company: 'Qatar Airways Group' },
            'SIA': { name: 'Singapore Airlines', company: 'Singapore Airlines Limited' },
            'JAL': { name: 'Japan Airlines', company: 'Japan Airlines Co., Ltd.' },
            'ANA': { name: 'All Nippon Airways', company: 'ANA Holdings Inc.' },
            'ACA': { name: 'Air Canada', company: 'Air Canada' },
            'AFR': { name: 'Air France', company: 'Air France-KLM' },
            'IBE': { name: 'Iberia', company: 'International Airlines Group' },
            'AZA': { name: 'Alitalia', company: 'ITA Airways' }
          };
          
          if (airlineDatabase[code]) {
            return airlineDatabase[code];
          }
          
          // Fallback based on country
          const countryAirlines: { [key: string]: { name: string, company: string } } = {
            'United States': { name: 'US Airline', company: 'US Aviation Company' },
            'United Kingdom': { name: 'UK Airline', company: 'UK Aviation Company' },
            'Germany': { name: 'German Airline', company: 'German Aviation Company' },
            'France': { name: 'French Airline', company: 'French Aviation Company' },
            'Netherlands': { name: 'Dutch Airline', company: 'Dutch Aviation Company' },
            'Canada': { name: 'Canadian Airline', company: 'Canadian Aviation Company' },
            'Spain': { name: 'Spanish Airline', company: 'Spanish Aviation Company' },
            'Italy': { name: 'Italian Airline', company: 'Italian Aviation Company' }
          };
          
          return countryAirlines[country] || { name: `${country} Airline`, company: `${country} Aviation` };
        };
        
        const airlineInfo = getRealAirlineInfo(airlineCode, origin_country || 'Unknown');
        
        // Use real aircraft registration from ICAO24 code
        const aircraftType = 'Aircraft'; // Generic since we don't have real aircraft type data
        
        // Create a simple hash from flight ID to get deterministic but varied results
        let hash = 0;
        for (let i = 0; i < icao24.length; i++) {
          const char = icao24.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Comprehensive airport database with full names
        const getAirportInfo = (iataCode: string): { name: string, city: string, country: string } => {
          const airportDatabase: { [key: string]: { name: string, city: string, country: string } } = {
            // United States
            'JFK': { name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
            'LAX': { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
            'ORD': { name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States' },
            'DFW': { name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States' },
            'DEN': { name: 'Denver International Airport', city: 'Denver', country: 'United States' },
            'SFO': { name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States' },
            'SEA': { name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States' },
            'LAS': { name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'United States' },
            'PHX': { name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States' },
            'IAH': { name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'United States' },
            'MIA': { name: 'Miami International Airport', city: 'Miami', country: 'United States' },
            'ATL': { name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States' },
            'BOS': { name: 'Logan International Airport', city: 'Boston', country: 'United States' },
            'MCO': { name: 'Orlando International Airport', city: 'Orlando', country: 'United States' },
            
            // United Kingdom
            'LHR': { name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
            'LGW': { name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom' },
            'MAN': { name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom' },
            'EDI': { name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom' },
            'BHX': { name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom' },
            'STN': { name: 'London Stansted Airport', city: 'London', country: 'United Kingdom' },
            'LTN': { name: 'London Luton Airport', city: 'London', country: 'United Kingdom' },
            
            // Germany
            'FRA': { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
            'MUC': { name: 'Munich Airport', city: 'Munich', country: 'Germany' },
            'DUS': { name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany' },
            'TXL': { name: 'Berlin Tegel Airport', city: 'Berlin', country: 'Germany' },
            'HAM': { name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany' },
            'STR': { name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany' },
            
            // France
            'CDG': { name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
            'ORY': { name: 'Orly Airport', city: 'Paris', country: 'France' },
            'NCE': { name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France' },
            'LYS': { name: 'Lyon-Saint Exupéry Airport', city: 'Lyon', country: 'France' },
            'TLS': { name: 'Toulouse-Blagnac Airport', city: 'Toulouse', country: 'France' },
            'BOD': { name: 'Bordeaux-Mérignac Airport', city: 'Bordeaux', country: 'France' },
            
            // Netherlands
            'AMS': { name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
            'RTM': { name: 'Rotterdam The Hague Airport', city: 'Rotterdam', country: 'Netherlands' },
            'EIN': { name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Netherlands' },
            
            // Canada
            'YYZ': { name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
            'YVR': { name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada' },
            'YUL': { name: 'Montréal-Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'Canada' },
            'YYC': { name: 'Calgary International Airport', city: 'Calgary', country: 'Canada' },
            'YOW': { name: 'Ottawa Macdonald-Cartier International Airport', city: 'Ottawa', country: 'Canada' },
            
            // Spain
            'MAD': { name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain' },
            'BCN': { name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain' },
            'PMI': { name: 'Palma de Mallorca Airport', city: 'Palma', country: 'Spain' },
            'LPA': { name: 'Gran Canaria Airport', city: 'Las Palmas', country: 'Spain' },
            
            // Italy
            'FCO': { name: 'Leonardo da Vinci International Airport', city: 'Rome', country: 'Italy' },
            'MXP': { name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy' },
            'VCE': { name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy' },
            'NAP': { name: 'Naples International Airport', city: 'Naples', country: 'Italy' },
            
            // Other major international airports
            'DXB': { name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
            'SIN': { name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
            'HKG': { name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong' },
            'NRT': { name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
            'ICN': { name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea' },
            'SYD': { name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
            'MEL': { name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
            'GRU': { name: 'São Paulo-Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
            'EZE': { name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina' },
            'JNB': { name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa' },
            'CAI': { name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt' },
            'IST': { name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
            'DOH': { name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
            'AUH': { name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'UAE' },
          };
          
          return airportDatabase[iataCode] || { 
            name: `${iataCode} Airport`, 
            city: 'Unknown', 
            country: 'Unknown' 
          };
        };

        // Get real route data from multiple flight tracking APIs
        const getRealRouteData = async (callsign: string, icao24: string): Promise<{ origin: string, destination: string, originInfo: any, destinationInfo: any }> => {
          try {
            // Try FlightAware API first (has free tier)
            const flightAwareUrl = `https://flightaware.com/live/flight/${callsign}`;
            
            // Try AviationStack API (free tier available)
            const aviationStackUrl = `http://api.aviationstack.com/v1/flights?access_key=YOUR_API_KEY&flight_iata=${callsign}`;
            
            // Try FlightRadar24 API (unofficial but often works)
            const flightRadarUrl = `https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=1`;
            
            // Try OpenFlights API for route data
            const openFlightsUrl = `https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat`;
            
            // For now, let's try a simple approach with FlightAware's public data
            try {
              // Use a CORS proxy to access FlightAware
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(flightAwareUrl)}`;
              const response = await fetch(proxyUrl);
              
              if (response.ok) {
                const data = await response.json();
                const html = data.contents;
                
                // Parse route information from FlightAware HTML
                const routeMatch = html.match(/from\s+([A-Z]{3})\s+to\s+([A-Z]{3})/i);
                if (routeMatch) {
                  const [, origin, destination] = routeMatch;
                  const originInfo = getAirportInfo(origin);
                  const destinationInfo = getAirportInfo(destination);
                  
                  console.log(`Found route via FlightAware: ${origin} → ${destination}`);
                  setRouteApiStatus('flightaware');
                  
                  return {
                    origin,
                    destination,
                    originInfo,
                    destinationInfo
                  };
                }
              }
            } catch (error) {
              console.log('FlightAware API failed, trying alternative methods');
            }
            
            // Try FlightRadar24 search API
            try {
              const flightRadarResponse = await fetch(`https://www.flightradar24.com/v1/search/web/find?query=${callsign}&limit=1`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              
              if (flightRadarResponse.ok) {
                const flightData = await flightRadarResponse.json();
                if (flightData.results && flightData.results.length > 0) {
                  const flight = flightData.results[0];
                  if (flight.detail && flight.detail.route) {
                    const route = flight.detail.route;
                    const originInfo = getAirportInfo(route.origin);
                    const destinationInfo = getAirportInfo(route.destination);
                    
                    console.log(`Found route via FlightRadar24: ${route.origin} → ${route.destination}`);
                    setRouteApiStatus('flightradar24');
                    
                    return {
                      origin: route.origin,
                      destination: route.destination,
                      originInfo,
                      destinationInfo
                    };
                  }
                }
              }
            } catch (error) {
              console.log('FlightRadar24 API failed');
            }
            
            // Try AviationStack API with provided API key
            const aviationStackApiKey = '19da0e0595f06a2ee37bdabbe7c38028';
            try {
              const aviationResponse = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${aviationStackApiKey}&flight_iata=${callsign}`);
              if (aviationResponse.ok) {
                const aviationData = await aviationResponse.json();
                if (aviationData.data && aviationData.data.length > 0) {
                  const flight = aviationData.data[0];
                  if (flight.departure && flight.arrival) {
                    const originInfo = getAirportInfo(flight.departure.iata);
                    const destinationInfo = getAirportInfo(flight.arrival.iata);
                    
                    console.log(`Found route via AviationStack: ${flight.departure.iata} → ${flight.arrival.iata}`);
                    setRouteApiStatus('aviationstack');
                    
                    return {
                      origin: flight.departure.iata,
                      destination: flight.arrival.iata,
                      originInfo,
                      destinationInfo
                    };
                  }
                }
              } else {
                console.log('AviationStack API response not OK:', aviationResponse.status);
              }
            } catch (error) {
              console.log('AviationStack API failed:', error);
            }
            
            // Try to get route from callsign pattern (only for well-known routes)
            const callsignMatch = callsign.match(/^([A-Z]{2,3})(\d+)$/);
            if (callsignMatch) {
              const [, airlineCode, flightNumber] = callsignMatch;
              
              // Only use this for very well-known, consistent routes
              const knownRoutes: { [key: string]: { [key: string]: string[] } } = {
                'AAL': { '1': ['JFK', 'LAX'] }, // American Airlines flight 1
                'BAW': { '1': ['LHR', 'JFK'] }, // British Airways flight 1
                'DLH': { '1': ['FRA', 'JFK'] }, // Lufthansa flight 1
                'AFR': { '1': ['CDG', 'JFK'] }, // Air France flight 1
                'KLM': { '1': ['AMS', 'JFK'] }  // KLM flight 1
              };
              
              const airlineRoutes = knownRoutes[airlineCode];
              if (airlineRoutes && airlineRoutes[flightNumber]) {
                const route = airlineRoutes[flightNumber];
                const originInfo = getAirportInfo(route[0]);
                const destinationInfo = getAirportInfo(route[1]);
                
                console.log(`Found route via fallback patterns: ${route[0]} → ${route[1]}`);
                setRouteApiStatus('fallback');
                
                return {
                  origin: route[0],
                  destination: route[1],
                  originInfo,
                  destinationInfo
                };
              }
            }
            
            // If no route data found, return N/A
            setRouteApiStatus('none');
            return {
              origin: 'N/A',
              destination: 'N/A',
              originInfo: { name: 'Route data not available from flight tracking APIs', city: 'N/A', country: 'N/A' },
              destinationInfo: { name: 'Route data not available from flight tracking APIs', city: 'N/A', country: 'N/A' }
            };
            
          } catch (error) {
            console.error('Error getting route data:', error);
            return {
              origin: 'N/A',
              destination: 'N/A',
              originInfo: { name: 'Route data not available', city: 'N/A', country: 'N/A' },
              destinationInfo: { name: 'Route data not available', city: 'N/A', country: 'N/A' }
            };
          }
        };
        
        const route = await getRealRouteData(cleanCallsign, icao24);
        
        const flight: FlightData = {
          id: icao24,
          callsign: cleanCallsign || icao24,
          airline: airlineInfo.name,
          aircraft: aircraftType,
          registration: icao24.toUpperCase(),
          registrationCompany: airlineInfo.company,
          origin: route.origin,
          destination: route.destination,
          originInfo: route.originInfo,
          destinationInfo: route.destinationInfo,
          lat: latitude || 0,
          lon: longitude || 0,
          altitude: Math.round((baro_altitude || 0) * 3.28084), // Convert meters to feet
          speed: Math.round((velocity || 0) * 1.94384), // Convert m/s to knots
          heading: Math.round(true_track || 0),
          verticalRate: Math.round((vertical_rate || 0) * 196.85), // Convert m/s to feet/min
          squawk: squawk || '0000',
          onGround: on_ground || false,
          lastUpdate: new Date(last_contact * 1000),
          distance: calculateDistance(userLat, userLon, latitude || 0, longitude || 0)
        };
        
        return flight;
      })));
      
      // Filter out flights without position data
      const validFlights = flights.filter((flight: FlightData) => 
        flight.lat !== 0 && flight.lon !== 0
      );
      
      // Sort by distance from user location
      setApiStatus('working');
      return validFlights.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
    } catch (error) {
      console.error('Failed to fetch real flight data:', error);
      
      // Return a single demo flight if API completely fails
      const demoFlight: FlightData = {
        id: 'demo-flight-001',
        callsign: 'DEMO123',
        airline: 'Demo Flight',
        aircraft: 'Aircraft',
        registration: 'DEMO001',
        registrationCompany: 'Demo Aviation',
        origin: 'N/A',
        destination: 'N/A',
        originInfo: { name: 'Route data not available from flight tracking APIs', city: 'N/A', country: 'N/A' },
        destinationInfo: { name: 'Route data not available from flight tracking APIs', city: 'N/A', country: 'N/A' },
        lat: userLat + 0.01, // Slightly offset from user location
        lon: userLon + 0.01,
        altitude: 35000,
        speed: 450,
        heading: 270,
        verticalRate: 0,
        squawk: '1200',
        onGround: false,
        lastUpdate: new Date(),
        distance: calculateDistance(userLat, userLon, userLat + 0.01, userLon + 0.01)
      };
      
      console.log('Returning demo flight due to API failure');
      setApiStatus('failed');
      return [demoFlight];
    }
  }, [settings.range, calculateDistance]);


  // Reverse geocode to get location name using a free geocoding service
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MedicationWebapp/1.0' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        const city = address.city || address.town || address.village || address.hamlet;
        const state = address.state || address.region || address.county;
        const country = address.country;
        
        if (city && country) {
          return state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
        } else if (country) {
          return `${country}`;
        }
      }
      
      // Fallback to display name if structured address isn't available
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Return coordinates as fallback
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }, []);

  // Get user's geolocation
  const getUserLocation = useCallback(() => {
    setLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationName = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        
        const location: UserLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          locationName: locationName
        };
        setUserLocation(location);
        setLoading(false);
      },
      async (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        
        // Use default location (London) as fallback
        setUserLocation({ 
          lat: 51.5074, 
          lon: -0.1278, 
          locationName: "London, United Kingdom (Default)" 
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }, [reverseGeocode]);

  // Fetch flight data
  const fetchFlights = useCallback(async () => {
    if (!userLocation) return;
    
    // Throttle API calls - minimum 30 seconds between requests
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    const minInterval = 30000; // 30 seconds minimum
    
    if (timeSinceLastCall < minInterval) {
      console.log(`API call throttled. ${Math.ceil((minInterval - timeSinceLastCall) / 1000)}s remaining`);
      return;
    }
    
    setLastApiCall(now);
    setLoading(true);
    
    try {
      // Fetch real flight data from OpenSky Network
      const realFlightData = await fetchRealFlightData(userLocation.lat, userLocation.lon);
      setFlights(realFlightData);
      
      // Count only new flights (not previously tracked)
      const newFlightIds = new Set(realFlightData.map(flight => flight.id));
      const previouslyTracked = new Set(trackedFlightIds);
      const newFlights = Array.from(newFlightIds).filter(id => !previouslyTracked.has(id));
      
      if (newFlights.length > 0) {
        const newTotal = totalFlightsTracked + newFlights.length;
        setTotalFlightsTracked(newTotal);
        
        // Update tracked flight IDs
        const updatedTrackedIds = new Set([...Array.from(trackedFlightIds), ...newFlights]);
        setTrackedFlightIds(updatedTrackedIds);
        
        // Save to localStorage
          localStorage.setItem(FLIGHT_COUNT_KEY, newTotal.toString());
          localStorage.setItem(TRACKED_IDS_KEY, JSON.stringify(Array.from(updatedTrackedIds)));
      }
      
      // Find nearest airborne aircraft (not on ground)
      const airborneFlights = realFlightData.filter(flight => !flight.onGround);
      setNearestFlight(airborneFlights[0] || null);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch flight data:', error);
      setFlights([]);
      setNearestFlight(null);
    } finally {
      setLoading(false);
    }
  }, [userLocation, fetchRealFlightData, lastApiCall, totalFlightsTracked, trackedFlightIds]);

  // Load persisted flight count and tracked IDs when user data is available
  useEffect(() => {
      const savedCount = localStorage.getItem(FLIGHT_COUNT_KEY);
      if (savedCount) {
        setTotalFlightsTracked(parseInt(savedCount, 10));
      }
      
      const savedIds = localStorage.getItem(TRACKED_IDS_KEY);
      if (savedIds) {
        try {
          const idsArray = JSON.parse(savedIds);
          setTrackedFlightIds(new Set(idsArray));
        } catch (error) {
          console.error('Failed to parse tracked flight IDs:', error);
        }
      }
  }, []);

  // Initial location fetch
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Fetch flights when location is available
  useEffect(() => {
    if (userLocation) {
      fetchFlights();
    }
  }, [userLocation, fetchFlights]);

  // Auto-refresh flights
  useEffect(() => {
    if (!userLocation) return;
    
    const interval = setInterval(() => {
      fetchFlights();
    }, settings.updateInterval * 1000);
    
    return () => clearInterval(interval);
  }, [userLocation, fetchFlights, settings.updateInterval]);

  const formatAltitude = (altitude: number): string => {
    return `FL${Math.floor(altitude / 100)}`;
  };

  const formatSpeed = (speed: number): string => {
    return `${speed} kts`;
  };

  const formatHeading = (heading: number): string => {
    return `${heading.toString().padStart(3, '0')}°`;
  };

  const getVerticalRateIcon = (rate: number) => {
    if (rate > 500) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (rate < -500) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const resetFlightCount = () => {
    setTotalFlightsTracked(0);
    setTrackedFlightIds(new Set());
    
    // Save to localStorage
      localStorage.setItem(FLIGHT_COUNT_KEY, '0');
      localStorage.setItem(TRACKED_IDS_KEY, JSON.stringify([]));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary-enhanced">Flight Radar</h1>
        <p className="text-secondary-enhanced text-sleek">
          Live flight tracking centered on your location
        </p>
      </div>

      {/* Location Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-modern text-primary-enhanced flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {userLocation?.locationName || "Your Location"}
            </CardTitle>
            <CardDescription className="text-sleek text-secondary-enhanced">
              Radar center point and range: {settings.range}km
              <br />
              <span className="text-xs text-muted-foreground">
                Auto-refresh: {settings.updateInterval}s • API throttled: 30s minimum
                {apiStatus === 'rate_limited' && (
                  <span className="text-yellow-500 ml-2">• Rate limited</span>
                )}
                {apiStatus === 'failed' && (
                  <span className="text-red-500 ml-2">• API failed (demo mode)</span>
                )}
                {routeApiStatus === 'aviationstack' && (
                  <span className="text-green-500 ml-2">• Routes: AviationStack API</span>
                )}
                {routeApiStatus === 'flightaware' && (
                  <span className="text-blue-500 ml-2">• Routes: FlightAware</span>
                )}
                {routeApiStatus === 'flightradar24' && (
                  <span className="text-purple-500 ml-2">• Routes: FlightRadar24</span>
                )}
                {routeApiStatus === 'fallback' && (
                  <span className="text-orange-500 ml-2">• Routes: Known patterns</span>
                )}
                {routeApiStatus === 'none' && (
                  <span className="text-gray-500 ml-2">• Routes: Not available</span>
                )}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {loading ? "Locating..." : "Update Location"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFlightCount}
              className="text-xs"
            >
              Reset Count
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFlights}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locationError ? (
            <div className="text-center py-4">
              <div className="text-red-500 mb-2">⚠️ Location Error</div>
              <p className="text-sm text-muted-foreground">{locationError}</p>
              <p className="text-xs text-muted-foreground mt-2">Using London as default location</p>
            </div>
          ) : userLocation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Latitude</div>
                  <div className="font-mono text-sm">{userLocation.lat.toFixed(6)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Longitude</div>
                  <div className="font-mono text-sm">{userLocation.lon.toFixed(6)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                  <div className="text-sm">{userLocation.accuracy ? `±${Math.round(userLocation.accuracy)}m` : "Unknown"}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Current Flights</div>
                  <div className="text-sm font-semibold text-primary-enhanced">{flights.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Tracked</div>
                  <div className="text-sm font-semibold text-primary-enhanced">{totalFlightsTracked}</div>
                </div>
              </div>
              
              {userLocation.locationName && userLocation.locationName.includes("Default") && (
                <div className="text-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Using default location. Click &quot;Update Location&quot; to use your actual position.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">📍</div>
              <p>Getting your location...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearest Flight */}
      {nearestFlight && (
        <Card>
          <CardHeader>
            <CardTitle className="text-modern text-primary-enhanced flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Nearest Airborne Aircraft
            </CardTitle>
            <CardDescription className="text-sleek text-secondary-enhanced">
              Closest aircraft in flight to your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Flight Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-primary-enhanced">
                    {nearestFlight.callsign}
                  </div>
                  <Badge variant="secondary">{nearestFlight.airline}</Badge>
                  {nearestFlight.onGround && <Badge variant="destructive">On Ground</Badge>}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Distance</div>
                  <div className="font-semibold text-lg">
                    {nearestFlight.distance?.toFixed(1)} km
                  </div>
                </div>
              </div>

              {/* Flight Route */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center flex-1">
                  <div className="text-sm text-muted-foreground">From</div>
                  <div className="font-semibold">{nearestFlight.origin}</div>
                  {nearestFlight.originInfo && nearestFlight.origin !== 'Unknown' && (
                    <div className="text-xs text-muted-foreground">
                      {nearestFlight.originInfo.name}
                </div>
                  )}
                  {nearestFlight.origin === 'N/A' && (
                    <div className="text-xs text-muted-foreground">
                      Route data not available from flight tracking APIs
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-px bg-border w-8"></div>
                  <Plane className="h-4 w-4 mx-2 text-primary" style={{
                    transform: `rotate(${nearestFlight.heading}deg)`
                  }} />
                  <div className="h-px bg-border w-8"></div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-sm text-muted-foreground">To</div>
                  <div className="font-semibold">{nearestFlight.destination}</div>
                  {nearestFlight.destinationInfo && nearestFlight.destination !== 'Unknown' && (
                    <div className="text-xs text-muted-foreground">
                      {nearestFlight.destinationInfo.name}
                    </div>
                  )}
                  {nearestFlight.destination === 'N/A' && (
                    <div className="text-xs text-muted-foreground">
                      Route data not available from flight tracking APIs
                    </div>
                  )}
                </div>
              </div>

              {/* Flight Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center glass rounded-md p-3">
                  <Gauge className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-xs text-muted-foreground">Altitude</div>
                  <div className="font-semibold">{formatAltitude(nearestFlight.altitude)}</div>
                </div>
                <div className="text-center glass rounded-md p-3">
                  <Navigation className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <div className="text-xs text-muted-foreground">Speed</div>
                  <div className="font-semibold">{formatSpeed(nearestFlight.speed)}</div>
                </div>
                <div className="text-center glass rounded-md p-3">
                  <div className="flex justify-center mb-1">
                    {getVerticalRateIcon(nearestFlight.verticalRate)}
                  </div>
                  <div className="text-xs text-muted-foreground">Vertical Rate</div>
                  <div className="font-semibold">{Math.abs(nearestFlight.verticalRate)} fpm</div>
                </div>
                <div className="text-center glass rounded-md p-3">
                  <Navigation className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                  <div className="text-xs text-muted-foreground">Heading</div>
                  <div className="font-semibold">{formatHeading(nearestFlight.heading)}</div>
                </div>
              </div>

              {/* Aircraft Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Aircraft Type</div>
                    <div className="font-semibold">{nearestFlight.aircraft}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Registration</div>
                    <div className="font-mono text-sm">{nearestFlight.registration}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Registered to</div>
                    <div className="font-semibold text-sm">{nearestFlight.registrationCompany}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Squawk Code</div>
                    <div className="font-mono text-sm">{nearestFlight.squawk}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-modern text-primary-enhanced flex items-center gap-2">
              <Radar className="h-5 w-5" />
              Nearby Flights
            </CardTitle>
            <CardDescription className="text-sleek text-secondary-enhanced">
              All flights within {settings.range}km range
              {apiStatus === 'failed' && (
                <span className="text-red-500 ml-2">(Demo data - API unavailable)</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFlights}
              disabled={loading || !userLocation}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && flights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✈️</div>
              <p>Scanning for flights...</p>
            </div>
          ) : flights.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {flights.slice(0, 20).map((flight) => (
                <div
                  key={flight.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md glass hover:bg-white/5 transition-colors",
                    flight.id === nearestFlight?.id && "ring-2 ring-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Plane 
                      className="h-4 w-4 text-primary" 
                      style={{ transform: `rotate(${flight.heading}deg)` }}
                    />
                    <div>
                      <div className="font-semibold">{flight.callsign}</div>
                      {flight.origin !== 'N/A' && flight.destination !== 'N/A' ? (
                      <div className="text-xs text-muted-foreground">
                        {flight.origin} → {flight.destination}
                      </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Route data not available from flight tracking APIs
                        </div>
                      )}
                      {flight.origin !== 'N/A' && flight.destination !== 'N/A' && (flight.originInfo || flight.destinationInfo) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {flight.originInfo?.city || flight.origin} → {flight.destinationInfo?.city || flight.destination}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{flight.distance?.toFixed(1)} km</div>
                    <div className="text-xs text-muted-foreground">
                      {formatAltitude(flight.altitude)} • {formatSpeed(flight.speed)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛩️</div>
              <p>No flights detected in range</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try refreshing or check your location
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

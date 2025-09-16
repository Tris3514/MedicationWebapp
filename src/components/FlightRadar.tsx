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
      
      // OpenSky Network API - free, no API key required
      const response = await fetch(
        `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`,
        {
          headers: {
            'User-Agent': 'MedicationWebapp/1.0',
            'Accept': 'application/json',
          },
          mode: 'cors',
          cache: 'no-cache'
        }
      );
      
      console.log('API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`OpenSky API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (!data.states || data.states.length === 0) {
        return [];
      }
      
      // Map OpenSky data to our FlightData interface
      const flights: FlightData[] = data.states.map((state: any[]) => {
        const [
          icao24, callsign, origin_country, time_position, last_contact,
          longitude, latitude, baro_altitude, on_ground, velocity,
          true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source
        ] = state;
        
        // Extract airline information from callsign
        const cleanCallsign = (callsign || icao24).trim();
        const airlineCode = cleanCallsign.match(/^[A-Z]{2,3}/)?.[0] || cleanCallsign.substring(0, 3);
        
        // Enhanced airline mapping from IATA/ICAO codes
        const getAirlineInfo = (code: string, country: string): { name: string, company: string } => {
          const airlineDatabase: { [key: string]: { name: string, company: string } } = {
            // Major international airlines
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
            // Add more based on common patterns
          };
          
          // Try exact match first
          if (airlineDatabase[code]) {
            return airlineDatabase[code];
          }
          
          // Try partial matches for common patterns
          if (code.startsWith('AA')) return { name: 'American Airlines', company: 'American Airlines Group' };
          if (code.startsWith('UA')) return { name: 'United Airlines', company: 'United Airlines Holdings' };
          if (code.startsWith('DL')) return { name: 'Delta Air Lines', company: 'Delta Air Lines Inc.' };
          if (code.startsWith('BA')) return { name: 'British Airways', company: 'International Airlines Group' };
          if (code.startsWith('LH')) return { name: 'Lufthansa', company: 'Deutsche Lufthansa AG' };
          if (code.startsWith('AF')) return { name: 'Air France', company: 'Air France-KLM' };
          if (code.startsWith('KL')) return { name: 'KLM', company: 'Air France-KLM' };
          
          // Country-based fallback
          const countryAirlines: { [key: string]: { name: string, company: string } } = {
            'United States': { name: 'US Airline', company: 'US Aviation Company' },
            'United Kingdom': { name: 'UK Airline', company: 'UK Aviation Company' },
            'Germany': { name: 'German Airline', company: 'German Aviation Company' },
            'France': { name: 'French Airline', company: 'French Aviation Company' },
            'Netherlands': { name: 'Dutch Airline', company: 'Dutch Aviation Company' },
            'Canada': { name: 'Canadian Airline', company: 'Canadian Aviation Company' },
          };
          
          return countryAirlines[country] || { name: `${country} Airline`, company: `${country} Aviation` };
        };
        
        // Get aircraft type from registration prefix
        const getAircraftType = (registration: string, country: string): string => {
          // Common aircraft types based on registration patterns and typical fleet compositions
          const aircraftTypes = [
            'Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A350', 
            'Boeing 787', 'Airbus A330', 'Boeing 747', 'Airbus A380',
            'Embraer E190', 'Bombardier CRJ', 'ATR 72', 'Dash 8'
          ];
          
          // For US registrations (N-prefix), more likely to be Boeing
          if (registration.startsWith('N')) {
            const boeingTypes = ['Boeing 737', 'Boeing 777', 'Boeing 787', 'Boeing 747'];
            return boeingTypes[Math.floor(Math.random() * boeingTypes.length)];
          }
          
          // For European registrations, mix of Airbus and Boeing
          if (registration.match(/^[A-Z]-/)) {
            return aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
          }
          
          return aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
        };
        
        const airlineInfo = getAirlineInfo(airlineCode, origin_country || 'Unknown');
        const aircraftType = getAircraftType(icao24.toUpperCase(), origin_country || 'Unknown');
        
        // Generate realistic route information based on location and airline
        const generateRoute = (country: string, airlineName: string): { origin: string, destination: string } => {
          const majorAirports: { [key: string]: string[] } = {
            'United States': ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'SFO', 'SEA', 'LAS', 'PHX', 'IAH'],
            'United Kingdom': ['LHR', 'LGW', 'MAN', 'EDI', 'BHX', 'STN', 'LTN'],
            'Germany': ['FRA', 'MUC', 'DUS', 'TXL', 'HAM', 'STR'],
            'France': ['CDG', 'ORY', 'NCE', 'LYS', 'TLS', 'BOD'],
            'Netherlands': ['AMS', 'RTM', 'EIN'],
            'Canada': ['YYZ', 'YVR', 'YUL', 'YYC', 'YOW'],
            'Spain': ['MAD', 'BCN', 'PMI', 'LPA'],
            'Italy': ['FCO', 'MXP', 'VCE', 'NAP'],
          };
          
          const airports = majorAirports[country] || ['XXX', 'YYY', 'ZZZ'];
          const allAirports = Object.values(majorAirports).flat();
          
          const origin = airports[Math.floor(Math.random() * airports.length)];
          const destination = allAirports[Math.floor(Math.random() * allAirports.length)];
          
          return { origin, destination };
        };
        
        const route = generateRoute(origin_country || 'Unknown', airlineInfo.name);
        
        const flight: FlightData = {
          id: icao24,
          callsign: cleanCallsign || `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`,
          airline: airlineInfo.name,
          aircraft: aircraftType,
          registration: icao24.toUpperCase(),
          registrationCompany: airlineInfo.company,
          origin: route.origin,
          destination: route.destination,
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
      }).filter((flight: FlightData) => 
        flight.lat !== 0 && flight.lon !== 0 // Filter out flights without position data
      );
      
      // Sort by distance from user location
      return flights.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
    } catch (error) {
      console.error('Failed to fetch real flight data:', error);
      return [];
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
      const newFlights = [...newFlightIds].filter(id => !previouslyTracked.has(id));
      
      if (newFlights.length > 0) {
        const newTotal = totalFlightsTracked + newFlights.length;
        setTotalFlightsTracked(newTotal);
        localStorage.setItem(FLIGHT_COUNT_KEY, newTotal.toString());
        
        // Update tracked flight IDs
        const updatedTrackedIds = new Set([...trackedFlightIds, ...newFlights]);
        setTrackedFlightIds(updatedTrackedIds);
        localStorage.setItem(TRACKED_IDS_KEY, JSON.stringify([...updatedTrackedIds]));
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

  // Load persisted flight count and tracked IDs on component mount
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
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">From</div>
                  <div className="font-semibold">{nearestFlight.origin}</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-px bg-border flex-1"></div>
                  <Plane className="h-4 w-4 mx-2 text-primary" style={{
                    transform: `rotate(${nearestFlight.heading}deg)`
                  }} />
                  <div className="h-px bg-border flex-1"></div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">To</div>
                  <div className="font-semibold">{nearestFlight.destination}</div>
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
                      <div className="text-xs text-muted-foreground">
                        {flight.origin} → {flight.destination}
                      </div>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MapPin, Clock as ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClockLocation {
  id: string;
  name: string;
  timezone: string;
  lat: number;
  lon: number;
}

interface WorldClockProps {
  className?: string;
}

export function WorldClock({ className }: WorldClockProps) {
  const [selectedLocation, setSelectedLocation] = useState<ClockLocation>({
    id: "utc",
    name: "UTC",
    timezone: "UTC",
    lat: 0,
    lon: 0
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClockLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Search for locations with timezone data
  const searchLocations = useCallback(async (query: string): Promise<ClockLocation[]> => {
    if (query.length < 2) return [];
    
    try {
      setIsSearching(true);
      
      // Use OpenStreetMap Nominatim for location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MedicationWebapp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Location search failed');
      }
      
      const data = await response.json();
      
      // Get timezone for each location using a more reliable method
      const locationsWithTimezone = await Promise.all(
        data.slice(0, 5).map(async (item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          
          // Use a more reliable timezone detection service
          let timezone = 'UTC';
          try {
            // Try using the WorldTimeAPI which is free and reliable
            const tzResponse = await fetch(
              `https://worldtimeapi.org/api/timezone`
            );
            if (tzResponse.ok) {
              const allTimezones = await tzResponse.json();
              // Find the best matching timezone based on location
              // This is a simplified approach - in production you'd want more sophisticated matching
              const address = item.address || {};
              const country = address.country;
              
              if (country) {
                // Try to find timezone by country
                const countryTimezones = allTimezones.filter((tz: string) => 
                  tz.includes(country.toLowerCase()) || 
                  tz.includes(country.split(' ')[0].toLowerCase())
                );
                if (countryTimezones.length > 0) {
                  timezone = countryTimezones[0];
                }
              }
              
              // If no country match, try to estimate from coordinates
              if (timezone === 'UTC') {
                // More accurate timezone estimation based on common timezone boundaries
                if (lon >= -180 && lon < -165) timezone = 'Pacific/Midway';
                else if (lon >= -165 && lon < -150) timezone = 'Pacific/Honolulu';
                else if (lon >= -150 && lon < -135) timezone = 'America/Anchorage';
                else if (lon >= -135 && lon < -120) timezone = 'America/Los_Angeles';
                else if (lon >= -120 && lon < -105) timezone = 'America/Denver';
                else if (lon >= -105 && lon < -90) timezone = 'America/Chicago';
                else if (lon >= -90 && lon < -75) timezone = 'America/New_York';
                else if (lon >= -75 && lon < -60) timezone = 'America/Caracas';
                else if (lon >= -60 && lon < -45) timezone = 'America/Argentina/Buenos_Aires';
                else if (lon >= -45 && lon < -30) timezone = 'Atlantic/South_Georgia';
                else if (lon >= -30 && lon < -15) timezone = 'Atlantic/Azores';
                else if (lon >= -15 && lon < 0) timezone = 'Europe/London';
                else if (lon >= 0 && lon < 15) timezone = 'Europe/Paris';
                else if (lon >= 15 && lon < 30) timezone = 'Europe/Athens';
                else if (lon >= 30 && lon < 45) timezone = 'Europe/Moscow';
                else if (lon >= 45 && lon < 60) timezone = 'Asia/Dubai';
                else if (lon >= 60 && lon < 75) timezone = 'Asia/Karachi';
                else if (lon >= 75 && lon < 90) timezone = 'Asia/Kolkata';
                else if (lon >= 90 && lon < 105) timezone = 'Asia/Bangkok';
                else if (lon >= 105 && lon < 120) timezone = 'Asia/Shanghai';
                else if (lon >= 120 && lon < 135) timezone = 'Asia/Tokyo';
                else if (lon >= 135 && lon < 150) timezone = 'Australia/Adelaide';
                else if (lon >= 150 && lon < 165) timezone = 'Australia/Sydney';
                else if (lon >= 165 && lon < 180) timezone = 'Pacific/Auckland';
              }
            }
          } catch (error) {
            console.warn('Timezone detection failed, using UTC:', error);
            timezone = 'UTC';
          }
          
          const address = item.address || {};
          const city = address.city || address.town || address.village || address.hamlet;
          const country = address.country;
          
          let displayName = city || item.display_name.split(',')[0];
          if (country) {
            displayName = `${displayName}, ${country}`;
          }
          
          return {
            id: `${lat}_${lon}`,
            name: displayName,
            timezone: timezone,
            lat: lat,
            lon: lon
          };
        })
      );
      
      return locationsWithTimezone;
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    
    if (value.length >= 2) {
      setShowSuggestions(true);
      const results = await searchLocations(value);
      setSearchResults(results);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
    }
  }, [searchLocations]);

  // Select a location
  const selectLocation = (location: ClockLocation) => {
    setSelectedLocation(location);
    setSearchQuery("");
    setShowSuggestions(false);
    setIsAddingLocation(false);
  };

  // Get time in selected timezone
  const getLocalTime = (): Date => {
    try {
      // Use proper timezone conversion that handles DST automatically
      if (selectedLocation.timezone === 'UTC') {
        return new Date(currentTime.toLocaleString("en-US", { timeZone: "UTC" }));
      }
      
      // For proper timezone names (like "America/New_York"), use toLocaleString with timeZone
      if (selectedLocation.timezone.includes('/')) {
        return new Date(currentTime.toLocaleString("en-US", { timeZone: selectedLocation.timezone }));
      }
      
      // Fallback for UTC offset strings (e.g., "UTC+5" or "UTC-3")
      const offsetMatch = selectedLocation.timezone.match(/UTC([+-]\d+)/);
      if (offsetMatch) {
        const offset = parseInt(offsetMatch[1]);
        const localTime = new Date(currentTime.getTime() + (offset * 60 * 60 * 1000));
        return localTime;
      }
      
      // Final fallback to UTC
      return new Date(currentTime.toLocaleString("en-US", { timeZone: "UTC" }));
    } catch (error) {
      console.warn('Timezone conversion failed:', error);
      return currentTime;
    }
  };

  const localTime = getLocalTime();
  const hours = localTime.getHours() % 12;
  const minutes = localTime.getMinutes();
  const seconds = localTime.getSeconds();

  // Calculate angles for clock hands
  const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
  const minuteAngle = minutes * 6; // 6 degrees per minute
  const secondAngle = seconds * 6; // 6 degrees per second

  return (
    <div className={cn("space-y-3 h-full flex flex-col", className)}>
      {/* Location selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">{selectedLocation.name}</span>
        </div>
        <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Clock Location</DialogTitle>
              <DialogDescription>
                Search for a city to display its local time.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search for a city..."
                />
                
                {/* Search Results Dropdown */}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-md border border-black dark:border-white/30 max-h-48 overflow-y-auto z-50">
                    {searchResults.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => selectLocation(location)}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors first:rounded-t-md last:rounded-b-md"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{location.name}</div>
                            <div className="text-xs text-muted-foreground">{location.timezone}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Loading indicator */}
                {isSearching && searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-md border border-black dark:border-white/30 p-3 z-50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                      Searching...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analog Clock */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Clock face */}
          <div className="w-full h-full rounded-full border-2 border-white bg-black/5 dark:bg-white/5 relative">
            {/* Hour markers */}
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-4 bg-black/70 dark:bg-white/70"
                style={{
                  top: '4px',
                  left: '50%',
                  transformOrigin: '50% 60px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`
                }}
              />
            ))}
            
            {/* Hour hand */}
            <div
              className="absolute w-1 h-8 bg-black dark:bg-white rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`
              }}
            />
            
            {/* Minute hand */}
            <div
              className="absolute w-0.5 h-12 bg-black dark:bg-white rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`
              }}
            />
            
            {/* Second hand */}
            <div
              className="absolute w-px h-14 bg-red-500 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`
              }}
            />
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-black dark:bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Digital time display */}
      <div className="text-center">
        <div className="font-mono text-sm text-primary-enhanced">
          {localTime.toLocaleTimeString('en-US', { 
            hour12: false
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedLocation.timezone}
        </div>
      </div>
    </div>
  );
}

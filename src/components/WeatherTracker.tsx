"use client";

import { useState, useEffect, useCallback } from "react";
import { WeatherLocation, WeatherData, LocationFormData } from "@/types/weather";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, MapPin, Thermometer, Droplets, Wind, Eye, Gauge, Sun, Trash2, Search, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "weather-tracker-data";
const WEATHER_API_KEY = ""; // Add your OpenWeatherMap API key here

interface WeatherTrackerProps {
  isActive?: boolean;
}

export function WeatherTracker({ isActive = false }: WeatherTrackerProps = {}) {
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [weatherData, setWeatherData] = useState<{ [key: string]: WeatherData }>({});
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({ name: "" });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [searchResults, setSearchResults] = useState<WeatherLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setLocations(parsed.locations || []);
        if (parsed.locations && parsed.locations.length > 0) {
          setActiveLocationId(parsed.locations[0].id);
        }
      } catch (error) {
        console.error("Failed to load weather data from storage:", error);
      }
    }
  }, []);

  // Save data whenever locations change
  useEffect(() => {
    if (locations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ locations }));
    }
  }, [locations]);

  const fetchWeatherData = useCallback(async (location: WeatherLocation) => {
    setLoading(prev => ({ ...prev, [location.id]: true }));
    
    try {
      const realWeatherData = await fetchRealWeatherData(location);
      setWeatherData(prev => ({ ...prev, [location.id]: realWeatherData }));
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      // Show error state or fallback
    } finally {
      setLoading(prev => ({ ...prev, [location.id]: false }));
    }
  }, []);

  // Auto-refresh weather data when tab becomes active
  useEffect(() => {
    if (isActive && locations.length > 0) {
      // Refresh weather data for all locations when tab becomes active
      locations.forEach(location => {
        // Only refresh if data is older than 5 minutes or doesn't exist
        const existingData = weatherData[location.id];
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        if (!existingData || existingData.lastUpdated < fiveMinutesAgo) {
          fetchWeatherData(location);
        }
      });
    }
  }, [isActive, locations, weatherData, fetchWeatherData]);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Search for locations using geocoding API
  const searchLocations = useCallback(async (query: string): Promise<WeatherLocation[]> => {
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
      
      const locations: WeatherLocation[] = data.map((item: any) => {
        const address = item.address || {};
        const city = address.city || address.town || address.village || address.hamlet;
        const state = address.state || address.region || address.county;
        const country = address.country;
        
        let displayName = city || item.display_name.split(',')[0];
        if (state && country) {
          displayName = `${displayName}, ${state}, ${country}`;
        } else if (country) {
          displayName = `${displayName}, ${country}`;
        }
        
        return {
          id: generateId(),
          name: displayName,
          country: country,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        };
      });
      
      return locations;
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback(async (value: string) => {
    setFormData({ name: value });
    
    if (value.length >= 2) {
      setShowSuggestions(true);
      const results = await searchLocations(value);
      setSearchResults(results);
    } else {
      setShowSuggestions(false);
      setSearchResults([]);
    }
  }, [searchLocations]);

  // Select a location from search results
  const selectLocation = (location: WeatherLocation) => {
    setFormData({ name: location.name });
    setShowSuggestions(false);
    setSearchResults([]);
    
    // Immediately add the location
    addLocationFromSearch(location);
  };

  const addLocationFromSearch = (location: WeatherLocation) => {
    setLocations(prev => [...prev, location]);
    
    if (!activeLocationId) {
      setActiveLocationId(location.id);
    }
    
    // Fetch weather data for the new location
    fetchWeatherData(location);
    
    setFormData({ name: "" });
    setIsAddingLocation(false);
  };

  // Get weather icon emoji from OpenWeatherMap icon code
  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌦️', '09n': '🌦️',
      '10d': '🌧️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  // Fetch real weather data from OpenWeatherMap
  const fetchRealWeatherData = async (location: WeatherLocation): Promise<WeatherData> => {
    try {
      // Using OpenWeatherMap One Call API 3.0 (free tier)
      // Note: You'll need to sign up for a free API key at openweathermap.org
      const API_KEY = WEATHER_API_KEY;
      
      // Using Open-Meteo free weather service
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      
      // Map weather codes to conditions
      const getWeatherCondition = (code: number): { condition: string, icon: string } => {
        if (code === 0) return { condition: 'Clear sky', icon: '☀️' };
        if (code <= 3) return { condition: 'Partly cloudy', icon: '⛅' };
        if (code <= 48) return { condition: 'Foggy', icon: '🌫️' };
        if (code <= 67) return { condition: 'Rainy', icon: '🌧️' };
        if (code <= 77) return { condition: 'Snowy', icon: '❄️' };
        if (code <= 82) return { condition: 'Showers', icon: '🌦️' };
        if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' };
        return { condition: 'Unknown', icon: '🌤️' };
      };

      const currentWeather = getWeatherCondition(data.current.weather_code);
      
      const weatherData: WeatherData = {
        location,
        current: {
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: Math.round(data.current.relative_humidity_2m),
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDirection: Math.round(data.current.wind_direction_10m),
          pressure: Math.round(data.current.surface_pressure),
          visibility: 10, // Not provided by this API
          uvIndex: 5, // Not provided by this API
          condition: currentWeather.condition,
          icon: currentWeather.icon,
        },
        forecast: data.daily.time.map((date: string, index: number) => {
          const forecastWeather = getWeatherCondition(data.daily.weather_code[index]);
          return {
            date: new Date(date).toLocaleDateString(),
            maxTemp: Math.round(data.daily.temperature_2m_max[index]),
            minTemp: Math.round(data.daily.temperature_2m_min[index]),
            condition: forecastWeather.condition,
            icon: forecastWeather.icon,
            chanceOfRain: Math.round(data.daily.precipitation_probability_max[index] || 0),
          };
        }),
        lastUpdated: new Date(),
      };

      return weatherData;
    } catch (error) {
      console.error('Failed to fetch real weather data:', error);
      throw error;
    }
  };


  const addLocation = async (formData: LocationFormData) => {
    if (!formData.name.trim()) return;

    // If no search results, try to search and add first result
    if (searchResults.length === 0) {
      const results = await searchLocations(formData.name);
      if (results.length > 0) {
        addLocationFromSearch(results[0]);
      }
    }
  };

  const removeLocation = (locationId: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId));
    setWeatherData(prev => {
      const { [locationId]: removed, ...rest } = prev;
      return rest;
    });
    
    if (activeLocationId === locationId) {
      const remainingLocations = locations.filter(loc => loc.id !== locationId);
      setActiveLocationId(remainingLocations.length > 0 ? remainingLocations[0].id : null);
    }
  };

  const refreshWeatherData = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      fetchWeatherData(location);
    }
  };

  const activeLocation = locations.find(loc => loc.id === activeLocationId);
  const activeWeatherData = activeLocationId ? weatherData[activeLocationId] : null;
  const isLoading = activeLocationId ? loading[activeLocationId] : false;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-primary-enhanced">Weather Tracker</h1>
        <p className="text-secondary-enhanced text-sleek">
          Track weather conditions for multiple locations
        </p>
      </div>

      {/* Location Tabs */}
      {locations.length > 0 && (
        <div className="flex justify-center mb-6">
          <div className="glass-card rounded-md p-1 inline-flex flex-wrap gap-1">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => {
                  setActiveLocationId(location.id);
                  if (!weatherData[location.id]) {
                    fetchWeatherData(location);
                  }
                }}
                className={cn(
                  "px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 relative",
                  "hover:bg-white/10",
                  activeLocationId === location.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-primary-enhanced hover:text-primary-enhanced"
                )}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {location.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Location */}
      <div className="flex justify-center">
        <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={(e) => { e.preventDefault(); addLocation(formData); }}>
              <DialogHeader>
                <DialogTitle>Add Weather Location</DialogTitle>
                <DialogDescription>
                  Enter a city name to add weather tracking for that location.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location-name" className="text-right">
                    City Name
                  </Label>
                  <div className="col-span-3 relative">
                    <div className="relative">
                      <Input
                        id="location-name"
                        value={formData.name}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => formData.name.length >= 2 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="pr-8"
                        placeholder="Search for a city..."
                        required
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showSuggestions && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-md border border-white max-h-48 overflow-y-auto z-50">
                        {searchResults.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => selectLocation(location)}
                            className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors first:rounded-t-md last:rounded-b-md"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{location.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Loading indicator */}
                    {isSearching && formData.name.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-md border border-white p-3 z-50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                          Searching locations...
                        </div>
                      </div>
                    )}
                    
                    {/* No results */}
                    {showSuggestions && !isSearching && formData.name.length >= 2 && searchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-md border border-white p-3 z-50">
                        <div className="text-sm text-muted-foreground">
                          No locations found for &quot;{formData.name}&quot;
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Location</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weather Display */}
      {activeLocation && (
        <div className="space-y-6">
          {/* Current Weather */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-modern text-primary-enhanced flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {activeLocation.name}
                    {activeLocation.country && `, ${activeLocation.country}`}
                  </CardTitle>
                  <CardDescription className="text-sleek text-secondary-enhanced">
                    Current weather conditions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshWeatherData(activeLocation.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Refresh"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLocation(activeLocation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p>Loading weather data...</p>
                </div>
              ) : activeWeatherData ? (
                <div className="space-y-6">
                  {/* Main Weather */}
                  <div className="text-center">
                    <div className="text-6xl mb-2">{activeWeatherData.current.icon}</div>
                    <div className="text-4xl font-bold text-primary-enhanced mb-2">
                      {activeWeatherData.current.temp}°C
                    </div>
                    <div className="text-lg text-secondary-enhanced">
                      {activeWeatherData.current.condition}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Feels like {activeWeatherData.current.feelsLike}°C
                    </div>
                  </div>

                  {/* Weather Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <div className="text-sm text-muted-foreground">Humidity</div>
                      <div className="font-semibold">{activeWeatherData.current.humidity}%</div>
                    </div>
                    <div className="text-center">
                      <Wind className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-sm text-muted-foreground">Wind</div>
                      <div className="font-semibold">{activeWeatherData.current.windSpeed} km/h</div>
                    </div>
                    <div className="text-center">
                      <Eye className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-sm text-muted-foreground">Visibility</div>
                      <div className="font-semibold">{activeWeatherData.current.visibility} km</div>
                    </div>
                    <div className="text-center">
                      <Gauge className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                      <div className="text-sm text-muted-foreground">Pressure</div>
                      <div className="font-semibold">{activeWeatherData.current.pressure} hPa</div>
                    </div>
                  </div>

                  {/* 7-Day Forecast */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary-enhanced">7-Day Forecast</h3>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      {activeWeatherData.forecast.map((day, index) => (
                        <div key={index} className="text-center p-3 glass rounded-md">
                          <div className="text-xs text-muted-foreground mb-1">
                            {index === 0 ? "Today" : day.date.split("/").slice(0, 2).join("/")}
                          </div>
                          <div className="text-2xl mb-1">{day.icon}</div>
                          <div className="text-xs font-semibold">{day.maxTemp}°</div>
                          <div className="text-xs text-muted-foreground">{day.minTemp}°</div>
                          <div className="text-xs text-blue-500">{day.chanceOfRain}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🌤️</div>
                  <p>Click refresh to load weather data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Locations */}
      {locations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-lg mb-2">No locations added yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first location to start tracking weather
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

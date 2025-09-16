export interface WeatherLocation {
  id: string;
  name: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface WeatherData {
  location: WeatherLocation;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    icon: string;
  };
  forecast: DayForecast[];
  lastUpdated: Date;
}

export interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  chanceOfRain: number;
}

export interface LocationFormData {
  name: string;
}


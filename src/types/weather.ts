/** Temperaturas do domínio são armazenadas em Celsius; Unit controla a apresentação. */
export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
  countryCode?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temperatureCelsius: number;
  weatherCode: number;
  observedAt?: string;
}

export interface ForecastDay {
  /** Data civil no fuso da cidade, no formato YYYY-MM-DD. */
  date: string;
  minimumCelsius: number;
  maximumCelsius: number;
  weatherCode?: number;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: WeatherError };

export interface WeatherError {
  kind: 'network' | 'api' | 'timeout' | 'invalid-response';
  message: string;
  statusCode?: number;
}

export interface WeatherService {
  searchCities(query: string, signal?: AbortSignal): Promise<City[]>;
  getCurrentWeather(city: City, signal?: AbortSignal): Promise<CurrentWeather>;
  getForecast(city: City, signal?: AbortSignal): Promise<ForecastDay[]>;
}

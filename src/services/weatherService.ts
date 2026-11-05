import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

/** Erro tipado da camada de dados, com mensagem amigável ao usuário. */
export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

/** Faz um fetch com timeout via AbortController. */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    throw new WeatherServiceError('Falha de rede.');
  } finally {
    clearTimeout(timeout);
  }
}

interface GeocodingResult {
  id?: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  timezone?: string;
}

/**
 * Busca cidades por nome (geocoding). Retorna lista vazia quando não há
 * resultados — o estado "vazio" é tratado pela camada de UI.
 */
export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new WeatherServiceError('Não foi possível buscar a cidade. Tente novamente.');
  }

  let data: { results?: GeocodingResult[] };
  try {
    data = await res.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
    }
    throw err;
  }
  if (!data.results) return [];

  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    region: r.admin1,
    countryCode: r.country_code,
    timezone: r.timezone,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isWeatherCode(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function mapCurrent(current: Record<string, unknown>): CurrentWeather {
  if (!isFiniteNumber(current.temperature_2m) || !isWeatherCode(current.weather_code)) {
    throw new WeatherServiceError('Resposta de clima incompleta. Tente novamente.');
  }
  const result: CurrentWeather = {
    temperatureCelsius: current.temperature_2m,
    weatherCode: current.weather_code,
  };
  if (
    typeof current.time === 'string' &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(current.time) &&
    isCivilDate(current.time.slice(0, 10))
  ) {
    result.observedAt = current.time;
  }
  return result;
}

function mapForecast(daily: Record<string, unknown>): ForecastDay[] {
  const dates: unknown = daily.time;
  const minimums: unknown = daily.temperature_2m_min;
  const maximums: unknown = daily.temperature_2m_max;
  if (
    !Array.isArray(dates) ||
    dates.length !== 5 ||
    !Array.isArray(minimums) ||
    minimums.length !== 5 ||
    !Array.isArray(maximums) ||
    maximums.length !== 5
  ) {
    throw new WeatherServiceError('Resposta de previsão incompleta. Tente novamente.');
  }
  let previousTimestamp: number | undefined;
  return dates.map((date: unknown, index: number) => {
    const minimum: unknown = minimums[index];
    const maximum: unknown = maximums[index];
    if (
      !isCivilDate(date) ||
      !isFiniteNumber(minimum) ||
      !isFiniteNumber(maximum) ||
      minimum > maximum
    ) {
      throw new WeatherServiceError('Resposta de previsão inválida. Tente novamente.');
    }
    // UTC é usado apenas para comparar datas civis, sem aplicar o fuso do navegador.
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (previousTimestamp !== undefined && timestamp !== previousTimestamp + 86_400_000) {
      throw new WeatherServiceError('Resposta de previsão inválida. Tente novamente.');
    }
    previousTimestamp = timestamp;
    const result: ForecastDay = { date, minimumCelsius: minimum, maximumCelsius: maximum };
    const code: unknown = Array.isArray(daily.weather_code) ? daily.weather_code[index] : undefined;
    if (isWeatherCode(code)) result.weatherCode = code;
    return result;
  });
}

/**
 * Busca o clima atual e a previsão de 5 dias para uma cidade.
 * Temperaturas retornam em Celsius (conversão fica na UI).
 */
export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_min,temperature_2m_max,weather_code',
    temperature_unit: 'celsius',
    forecast_days: '5',
    timezone: 'auto',
  });

  const res = await fetchWithTimeout(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new WeatherServiceError('Não foi possível carregar o clima. Tente novamente.');
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new WeatherServiceError('Resposta de clima inválida. Tente novamente.');
    }
    throw err;
  }
  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.daily)) {
    throw new WeatherServiceError('Resposta de clima incompleta. Tente novamente.');
  }

  const current = mapCurrent(data.current);
  const forecast = mapForecast(data.daily);
  if (current.observedAt && forecast[0].date !== current.observedAt.slice(0, 10)) {
    throw new WeatherServiceError('Resposta de previsão inválida. Tente novamente.');
  }
  return { city, current, forecast };
}

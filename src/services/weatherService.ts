import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherData,
  WeatherError,
} from '../types/weather';
import { isWeatherCode } from '../lib/weatherCodes';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;
const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar. Verifique sua conexão com a internet e tente novamente.';
const TIMEOUT_ERROR_MESSAGE =
  'A solicitação excedeu o limite de 10 segundos. Verifique sua conexão e tente novamente.';

/** Erro tipado da camada de dados, com mensagem amigável ao usuário. */
export class WeatherServiceError extends Error {
  constructor(
    message: string,
    readonly kind: WeatherError['kind'],
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

/** Mantém o timeout ativo até a leitura do corpo da resposta. */
async function fetchJsonWithTimeout(
  url: string,
  resource: 'busca' | 'clima',
): Promise<{ response: Response; data?: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return { response };
    return { response, data: await response.json() };
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError') {
      throw new WeatherServiceError(TIMEOUT_ERROR_MESSAGE, 'timeout');
    }
    if (err instanceof SyntaxError) {
      throw new WeatherServiceError(
        `A resposta de ${resource} é inválida. Tente novamente.`,
        'invalid-response',
      );
    }
    throw new WeatherServiceError(NETWORK_ERROR_MESSAGE, 'network');
  } finally {
    clearTimeout(timeout);
  }
}

interface GeocodingResult {
  id?: unknown;
  name: string;
  country?: unknown;
  admin1?: unknown;
  latitude: number;
  longitude: number;
  country_code?: unknown;
  timezone?: unknown;
}

/**
 * Busca cidades por nome (geocoding). Retorna lista vazia quando não há
 * resultados — o estado "vazio" é tratado pela camada de UI.
 */
export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`;
  const { response: res, data } = await fetchJsonWithTimeout(url, 'busca');
  if (!res.ok) {
    throw new WeatherServiceError(
      'O serviço de busca está indisponível no momento. Tente novamente.',
      'api',
      res.status,
    );
  }

  if (!isRecord(data)) {
    throw new WeatherServiceError(
      'A resposta de busca é inválida. Tente novamente.',
      'invalid-response',
    );
  }
  if (!('results' in data) || data.results === null || data.results === undefined) return [];
  const results = data.results;
  if (!Array.isArray(results) || !results.every(isGeocodingResult)) {
    throw new WeatherServiceError(
      'A resposta de busca é inválida. Tente novamente.',
      'invalid-response',
    );
  }

  return results.map((result) => {
    const city: City = {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
    };
    const id = optionalFiniteNumber(result.id);
    const country = optionalString(result.country);
    const region = optionalString(result.admin1);
    const countryCode = optionalString(result.country_code);
    const timezone = optionalString(result.timezone);
    if (id !== undefined) city.id = id;
    if (country !== undefined) city.country = country;
    if (region !== undefined) city.region = region;
    if (countryCode !== undefined) city.countryCode = countryCode;
    if (timezone !== undefined) city.timezone = timezone;
    return city;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude)
  );
}

function isCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function mapCurrent(current: Record<string, unknown>): CurrentWeather {
  if (!isFiniteNumber(current.temperature_2m) || !isWeatherCode(current.weather_code)) {
    throw new WeatherServiceError(
      'A resposta de clima está incompleta. Tente novamente.',
      'invalid-response',
    );
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
    throw new WeatherServiceError(
      'A resposta de previsão está incompleta. Tente novamente.',
      'invalid-response',
    );
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
      throw new WeatherServiceError(
        'A resposta de previsão é inválida. Tente novamente.',
        'invalid-response',
      );
    }
    // UTC é usado apenas para comparar datas civis, sem aplicar o fuso do navegador.
    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (previousTimestamp !== undefined && timestamp !== previousTimestamp + 86_400_000) {
      throw new WeatherServiceError(
        'A resposta de previsão é inválida. Tente novamente.',
        'invalid-response',
      );
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

  const { response: res, data } = await fetchJsonWithTimeout(
    `${FORECAST_URL}?${params.toString()}`,
    'clima',
  );
  if (!res.ok) {
    throw new WeatherServiceError(
      'O serviço de clima está indisponível no momento. Tente novamente.',
      'api',
      res.status,
    );
  }

  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.daily)) {
    throw new WeatherServiceError(
      'A resposta de clima está incompleta. Tente novamente.',
      'invalid-response',
    );
  }

  const current = mapCurrent(data.current);
  const forecast = mapForecast(data.daily);
  if (current.observedAt && forecast[0].date !== current.observedAt.slice(0, 10)) {
    throw new WeatherServiceError(
      'A resposta de previsão é inválida. Tente novamente.',
      'invalid-response',
    );
  }
  return { city, current, forecast };
}

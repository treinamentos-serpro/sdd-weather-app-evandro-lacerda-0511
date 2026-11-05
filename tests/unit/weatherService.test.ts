import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchCities, getWeather, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const CITY: City = {
  id: 1,
  name: 'Seattle',
  country: 'Estados Unidos',
  region: 'Washington',
  latitude: 47.6,
  longitude: -122.33,
};

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('weatherService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('fetchWithTimeout', () => {
    it('aborta somente ao completar 10 segundos e limpa o timer', async () => {
      vi.useFakeTimers();
      let signal: AbortSignal | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn((_url: string, options: RequestInit) => {
          signal = options.signal ?? undefined;
          return new Promise<Response>((_resolve, reject) => {
            signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          });
        }),
      );
      const request = searchCities('Recife');
      const rejection = expect(request).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'A requisição demorou demais.',
      });
      await vi.advanceTimersByTimeAsync(9_999);
      expect(signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await rejection;
      expect(signal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
      new DOMException('Aborted', 'AbortError'),
      Object.assign(new Error('Aborted'), { name: 'AbortError' }),
    ])('converte AbortError em WeatherServiceError: %s', async (error) => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
      await expect(searchCities('Recife')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'A requisição demorou demais.',
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('converte falha de rede e limpa o timer', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Falha de rede.',
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('limpa o timer após sucesso e não aborta o sinal depois', async () => {
      vi.useFakeTimers();
      const fetchSpy = mockFetchOnce({ results: [] });
      vi.stubGlobal('fetch', fetchSpy);
      expect(await searchCities('Recife')).toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(fetchSpy.mock.calls[0][1].signal.aborted).toBe(false);
    });

    it('limpa o timer após resposta HTTP não-ok', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('searchCities', () => {
    it('retorna lista vazia para input vazio sem chamar a rede', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      expect(await searchCities('')).toEqual([]);
      expect(await searchCities('   ')).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('mapeia resultados de geocoding', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          results: [
            {
              id: 1,
              name: 'Seattle',
              country: 'Estados Unidos',
              admin1: 'Washington',
              country_code: 'US',
              timezone: 'America/Los_Angeles',
              latitude: 47.6,
              longitude: -122.33,
            },
          ],
        }),
      );
      const result = await searchCities('Seattle');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...CITY,
        countryCode: 'US',
        timezone: 'America/Los_Angeles',
      });
    });

    it('codifica o nome trimado e preserva acentos e pontuação interna', async () => {
      const fetchSpy = mockFetchOnce({ results: [] });
      vi.stubGlobal('fetch', fetchSpy);
      const name = 'São Paulo & região/centro?';
      expect(await searchCities(`  ${name}  `)).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=pt&format=json`,
        { signal: expect.any(AbortSignal) },
      );
    });

    it('preserva metadados ausentes como opcionais sem inventar país', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          results: [{ name: 'Recife', latitude: -8.0539, longitude: -34.8811 }],
        }),
      );
      const [city] = await searchCities('Recife');
      expect(city).toMatchObject({ name: 'Recife', latitude: -8.0539, longitude: -34.8811 });
      expect(city.id).toBeUndefined();
      expect(city.region).toBeUndefined();
      expect(city.country).toBeUndefined();
      expect(city.countryCode).toBeUndefined();
      expect(city.timezone).toBeUndefined();
    });

    it('retorna vazio quando não há results', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}));
      expect(await searchCities('xyzxyz')).toEqual([]);
    });

    it.each([
      null,
      'inválido',
      {},
      [null],
    ])('rejeita payload de geocoding malformado em vez de tratá-lo como vazio: %j', async (results) => {
      vi.stubGlobal('fetch', mockFetchOnce({ results }));
      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de busca inválida. Tente novamente.',
      });
    });

    it('lança erro tipado em resposta não-ok', async () => {
      const fetchSpy = mockFetchOnce({}, false);
      vi.stubGlobal('fetch', fetchSpy);
      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Não foi possível buscar a cidade. Tente novamente.',
      });
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('rejeita JSON inválido sem tratar a falha como busca vazia', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
        }),
      );
      await expect(searchCities('Seattle')).rejects.toThrow(WeatherServiceError);
    });

    it('lança erro tipado em falha de rede', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      await expect(searchCities('Seattle')).rejects.toThrow(WeatherServiceError);
    });
  });

  describe('getWeather', () => {
    function forecastResponse() {
      return {
        current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
        daily: {
          time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
          weather_code: [3, 61, 80, 1, 0],
          temperature_2m_max: [20, 19, 22, 24, 25],
          temperature_2m_min: [12, 11, 13, 14, 15],
        },
      };
    }

    it('mapeia current e daily para WeatherData', async () => {
      vi.stubGlobal('fetch', mockFetchOnce(forecastResponse()));
      const data = await getWeather(CITY);
      expect(data.city).toBe(CITY);
      expect(data.current).toEqual({
        temperatureCelsius: 18,
        weatherCode: 3,
        observedAt: '2026-06-16T12:00',
      });
      expect(data.forecast).toEqual([
        { date: '2026-06-16', minimumCelsius: 12, maximumCelsius: 20, weatherCode: 3 },
        { date: '2026-06-17', minimumCelsius: 11, maximumCelsius: 19, weatherCode: 61 },
        { date: '2026-06-18', minimumCelsius: 13, maximumCelsius: 22, weatherCode: 80 },
        { date: '2026-06-19', minimumCelsius: 14, maximumCelsius: 24, weatherCode: 1 },
        { date: '2026-06-20', minimumCelsius: 15, maximumCelsius: 25, weatherCode: 0 },
      ]);
    });

    it('consulta coordenadas, current e daily em Celsius com cinco dias locais', async () => {
      const fetchSpy = mockFetchOnce(forecastResponse());
      vi.stubGlobal('fetch', fetchSpy);
      await getWeather(CITY);
      expect(fetchSpy).toHaveBeenCalledOnce();
      const url = new URL(fetchSpy.mock.calls[0][0]);
      expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
      expect(Object.fromEntries(url.searchParams)).toEqual({
        latitude: '47.6',
        longitude: '-122.33',
        current: 'temperature_2m,weather_code',
        daily: 'temperature_2m_min,temperature_2m_max,weather_code',
        temperature_unit: 'celsius',
        forecast_days: '5',
        timezone: 'auto',
      });
    });

    it.each([
      {},
      null,
      { current: null, daily: {} },
      { current: {}, daily: null },
    ])('rejeita seções ausentes ou resposta incompleta: %j', async (body) => {
      vi.stubGlobal('fetch', mockFetchOnce(body));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it.each([
      { temperature_2m: null },
      { temperature_2m: '18' },
      { temperature_2m: NaN },
      { temperature_2m: Infinity },
      { weather_code: undefined },
      { weather_code: -1 },
    ])('rejeita clima atual inválido: %j', async (fields) => {
      const body = forecastResponse();
      vi.stubGlobal('fetch', mockFetchOnce({ ...body, current: { ...body.current, ...fields } }));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it.each([
      { time: undefined },
      { time: [] },
      { time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19'] },
      {
        time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21'],
      },
      { time: ['2026-06-16', '2026-06-16', '2026-06-18', '2026-06-19', '2026-06-20'] },
      { time: ['2026-06-16', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21'] },
      { time: ['2026-02-30', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'] },
      { temperature_2m_min: undefined },
      { temperature_2m_max: [] },
      { temperature_2m_min: [12, 11, null, 14, 15] },
      { temperature_2m_max: [20, 19, '22', 24, 25] },
      { temperature_2m_max: [20, 19, NaN, 24, 25] },
      { temperature_2m_min: [21, 11, 13, 14, 15] },
    ])('rejeita previsão inválida ou arrays desalinhados: %j', async (fields) => {
      const body = forecastResponse();
      vi.stubGlobal('fetch', mockFetchOnce({ ...body, daily: { ...body.daily, ...fields } }));
      await expect(getWeather(CITY)).rejects.toThrow(WeatherServiceError);
    });

    it.each([
      { time: undefined },
      { temperature_2m_min: undefined },
      { temperature_2m_max: [] },
    ])('informa resposta de previsão incompleta para campos obrigatórios ausentes: %j', async (fields) => {
      const body = forecastResponse();
      vi.stubGlobal('fetch', mockFetchOnce({ ...body, daily: { ...body.daily, ...fields } }));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de previsão incompleta. Tente novamente.',
      });
    });

    it.each([
      undefined,
      'inválido',
      '2026-02-30T12:00',
      '2026-06-16T25:00',
    ])('omite horário opcional ausente ou inválido: %s', async (time) => {
      const body = forecastResponse();
      vi.stubGlobal('fetch', mockFetchOnce({ ...body, current: { ...body.current, time } }));
      expect((await getWeather(CITY)).current).toEqual({ temperatureCelsius: 18, weatherCode: 3 });
    });

    it('omite códigos opcionais inválidos sem perder temperaturas ou inventar chuva', async () => {
      const body = forecastResponse();
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...body,
          daily: { ...body.daily, weather_code: [null, -1, '3', 0] },
        }),
      );
      const { forecast } = await getWeather(CITY);
      expect(forecast).toHaveLength(5);
      for (const index of [0, 1, 2, 4]) expect(forecast[index]).not.toHaveProperty('weatherCode');
      expect(forecast[3].weatherCode).toBe(0);
      expect(forecast[0]).not.toHaveProperty('precipitationProbability');
    });

    it('rejeita intervalo que não começa na data local observada', async () => {
      const body = forecastResponse();
      body.current.time = '2026-06-15T23:00';
      vi.stubGlobal('fetch', mockFetchOnce(body));
      await expect(getWeather(CITY)).rejects.toThrow(WeatherServiceError);
    });

    it('lança erro tipado para resposta HTTP não-ok', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Não foi possível carregar o clima. Tente novamente.',
      });
    });

    it('lança erro tipado para JSON inválido', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
        }),
      );
      await expect(getWeather(CITY)).rejects.toThrow(WeatherServiceError);
    });
  });
});

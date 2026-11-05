import type { WeatherData } from '../types/weather';

/** Dados ficticios com datas fixas para desenvolver a UI sem acesso a rede. */
export const mockWeatherData: WeatherData = {
  city: {
    name: 'Recife',
    latitude: -8.0539,
    longitude: -34.8811,
    region: 'Pernambuco',
    country: 'Brasil',
    countryCode: 'BR',
    timezone: 'America/Recife',
  },
  current: {
    temperatureCelsius: 28,
    weatherCode: 2,
    observedAt: '2026-11-05T12:00',
  },
  forecast: [
    {
      date: '2026-11-05',
      minimumCelsius: 24,
      maximumCelsius: 30,
      weatherCode: 2,
    },
    {
      date: '2026-11-06',
      minimumCelsius: 25,
      maximumCelsius: 31,
      weatherCode: 0,
    },
    {
      date: '2026-11-07',
      minimumCelsius: 24,
      maximumCelsius: 29,
      weatherCode: 61,
    },
    {
      date: '2026-11-08',
      minimumCelsius: 23,
      maximumCelsius: 28,
      weatherCode: 3,
    },
    {
      date: '2026-11-09',
      minimumCelsius: 24,
      maximumCelsius: 30,
      weatherCode: 1,
    },
  ],
};

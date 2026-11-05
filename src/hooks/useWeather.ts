import { useCallback, useEffect, useRef, useState } from 'react';
import type { City, WeatherData } from '../types/weather';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface UseWeatherResult {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

type LastOperation = { kind: 'search'; name: string } | { kind: 'weather'; city: City };

/**
 * Hook de orquestração: busca cidades, seleciona uma e carrega o clima.
 * Expõe uma máquina de estados simples (idle/loading/success/error/empty).
 */
export function useWeather(): UseWeatherResult {
  const [status, setStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const lastOperation = useRef<LastOperation | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const loadWeather = useCallback(async (city: City, id: number) => {
    lastOperation.current = { kind: 'weather', city };
    try {
      const weather = await getWeather(city);
      if (id !== requestId.current) return;
      setData(weather);
      setStatus('success');
    } catch (err) {
      if (id !== requestId.current) return;
      setStatus('error');
      setError(toMessage(err));
    }
  }, []);

  const search = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      const id = ++requestId.current;
      setQuery(trimmed);
      setData(null);
      setError(null);
      setCities([]);
      if (!trimmed) {
        lastOperation.current = null;
        setStatus('idle');
        return;
      }

      lastOperation.current = { kind: 'search', name: trimmed };
      setStatus('loading');
      try {
        const results = await searchCities(trimmed);
        if (id !== requestId.current) return;
        const firstCity = results[0];
        if (!firstCity) {
          setStatus('empty');
          return;
        }
        setCities(results);
        await loadWeather(firstCity, id);
      } catch (err) {
        if (id !== requestId.current) return;
        setStatus('error');
        setError(toMessage(err));
      }
    },
    [loadWeather],
  );

  const selectCity = useCallback(
    async (city: City) => {
      const id = ++requestId.current;
      setStatus('loading');
      setData(null);
      setError(null);
      await loadWeather(city, id);
    },
    [loadWeather],
  );

  const retry = useCallback(async () => {
    const operation = lastOperation.current;
    if (operation?.kind === 'weather') {
      await selectCity(operation.city);
    } else if (operation?.kind === 'search') {
      await search(operation.name);
    }
  }, [selectCity, search]);

  return { status, data, cities, error, query, search, selectCity, retry };
}

function toMessage(err: unknown): string {
  if (err instanceof WeatherServiceError) return err.message;
  return 'Não foi possível concluir a consulta. Tente novamente.';
}

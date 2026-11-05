import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const city = mockWeatherData.city;
const otherCity: City = { ...city, name: 'Lisboa', latitude: 38.72, longitude: -9.14 };
const otherWeather: WeatherData = { ...mockWeatherData, city: otherCity };
const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    searchMock.mockResolvedValue([city, otherCity]);
    weatherMock.mockResolvedValue(mockWeatherData);
  });

  it('inicia idle sem dados, erro, termo ou chamadas e retry não faz nada', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(async () => result.current.retry());
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it.each(['', '   '])('não consulta para termo vazio: %j', async (name) => {
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search(name));
    expect(result.current).toMatchObject({ status: 'idle', query: '', cities: [], data: null });
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('trima o termo, mantém todas as cidades e carrega automaticamente a primeira', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('  Recife  '));
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('Recife');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      data: mockWeatherData,
      cities: [city, otherCity],
      query: 'Recife',
      error: null,
    });
  });

  it('permanece loading durante busca e clima, limpando dados da consulta anterior', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('Recife'));
    const citiesRequest = deferred<City[]>();
    const weatherRequest = deferred<WeatherData>();
    searchMock.mockReturnValueOnce(citiesRequest.promise);
    weatherMock.mockReturnValueOnce(weatherRequest.promise);
    let request!: Promise<void>;
    act(() => {
      request = result.current.search('Lisboa');
    });
    expect(result.current).toMatchObject({
      status: 'loading',
      data: null,
      cities: [],
      error: null,
    });
    await act(async () => {
      citiesRequest.resolve([otherCity]);
    });
    expect(result.current).toMatchObject({ status: 'loading', cities: [otherCity], data: null });
    await act(async () => {
      weatherRequest.resolve(otherWeather);
      await request;
    });
    expect(result.current).toMatchObject({ status: 'success', data: otherWeather });
  });

  it('mostra empty sem carregar clima e retry repete a busca', async () => {
    searchMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('Sem resultados'));
    expect(result.current).toMatchObject({ status: 'empty', cities: [], data: null, error: null });
    await act(async () => result.current.retry());
    expect(searchMock.mock.calls).toEqual([['Sem resultados'], ['Sem resultados']]);
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('mostra erro de busca e retry refaz o termo novo, não o clima da cidade anterior', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('Recife'));
    searchMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    await act(async () => result.current.search('Lisboa'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Falha de rede.',
      query: 'Lisboa',
      data: null,
      cities: [],
    });
    searchMock.mockResolvedValueOnce([otherCity]);
    weatherMock.mockResolvedValueOnce(otherWeather);
    await act(async () => result.current.retry());
    expect(searchMock.mock.calls).toEqual([['Recife'], ['Lisboa'], ['Lisboa']]);
    expect(weatherMock.mock.calls).toEqual([[city], [otherCity]]);
    expect(result.current).toMatchObject({ status: 'success', data: otherWeather, error: null });
  });

  it('mostra erro de clima preservando cidades e retry refaz somente getWeather', async () => {
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'));
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('Recife'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'A requisição demorou demais.',
      cities: [city, otherCity],
      data: null,
    });
    await act(async () => result.current.retry());
    expect(searchMock).toHaveBeenCalledOnce();
    expect(weatherMock.mock.calls).toEqual([[city], [city]]);
    expect(result.current).toMatchObject({ status: 'success', data: mockWeatherData, error: null });
  });

  it('selectCity carrega a escolhida, mantém opções e retry repete essa seleção', async () => {
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('Recife'));
    weatherMock.mockResolvedValue(otherWeather);
    await act(async () => result.current.selectCity(otherCity));
    expect(result.current).toMatchObject({
      status: 'success',
      data: otherWeather,
      cities: [city, otherCity],
      query: 'Recife',
    });
    await act(async () => result.current.retry());
    expect(searchMock).toHaveBeenCalledOnce();
    expect(weatherMock.mock.calls).toEqual([[city], [otherCity], [otherCity]]);
  });

  it('apresenta mensagem amigável para erro inesperado', async () => {
    searchMock.mockRejectedValueOnce(new Error('Technical details'));
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.search('Recife'));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Algo deu errado. Tente novamente.',
    });
  });

  it('ignora busca antiga que termina após a mais recente, sem carregar seu clima', async () => {
    const pending = deferred<City[]>();
    searchMock.mockReturnValueOnce(pending.promise).mockResolvedValueOnce([otherCity]);
    weatherMock.mockResolvedValue(otherWeather);
    const { result } = renderHook(() => useWeather());
    let oldRequest!: Promise<void>;
    act(() => {
      oldRequest = result.current.search('Recife');
    });
    await act(async () => result.current.search('Lisboa'));
    await act(async () => {
      pending.resolve([city]);
      await oldRequest;
    });
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(otherCity);
    expect(result.current).toMatchObject({
      status: 'success',
      data: otherWeather,
      query: 'Lisboa',
    });
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('ignora clima antigo que %s após nova seleção', async (outcome) => {
    const pending = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(otherWeather);
    const { result } = renderHook(() => useWeather());
    let oldRequest!: Promise<void>;
    act(() => {
      oldRequest = result.current.selectCity(city);
    });
    await act(async () => result.current.selectCity(otherCity));
    await act(async () => {
      if (outcome === 'resolve') pending.resolve(mockWeatherData);
      else pending.reject(new WeatherServiceError('Falha de rede.'));
      await oldRequest;
    });
    expect(result.current).toMatchObject({ status: 'success', data: otherWeather, error: null });
    await act(async () => result.current.retry());
    expect(weatherMock).toHaveBeenLastCalledWith(otherCity);
  });

  it('limpar o termo invalida a busca em andamento e a última operação', async () => {
    const pending = deferred<City[]>();
    searchMock.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather());
    let request!: Promise<void>;
    act(() => {
      request = result.current.search('Recife');
    });
    await act(async () => result.current.search('   '));
    await act(async () => {
      pending.resolve([city]);
      await request;
    });
    await act(async () => result.current.retry());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      error: null,
      cities: [],
      query: '',
    });
    expect(searchMock).toHaveBeenCalledOnce();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('não inicia clima após desmontar durante a busca', async () => {
    const pending = deferred<City[]>();
    searchMock.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let request!: Promise<void>;
    act(() => {
      request = result.current.search('Recife');
    });
    unmount();
    await act(async () => {
      pending.resolve([city]);
      await request;
    });
    expect(weatherMock).not.toHaveBeenCalled();
  });
});

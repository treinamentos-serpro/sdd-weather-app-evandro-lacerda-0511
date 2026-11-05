import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    searchMock.mockResolvedValue([mockWeatherData.city]);
    weatherMock.mockResolvedValue(mockWeatherData);
  });

  it('renderiza marca, busca, unidade e idle sem consultar os serviços', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'WeatherView' })).toBeInTheDocument();
    expect(screen.getByText(/busque uma cidade para começar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar cidade/i)).toBeEnabled();
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: 'Estados da demonstração' }),
    ).not.toBeInTheDocument();
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('busca pelo hook e converte temperaturas sem nova consulta ou alteração dos dados', async () => {
    const user = userEvent.setup();
    const original = JSON.stringify(mockWeatherData);
    render(<App />);
    await user.type(screen.getByLabelText(/buscar cidade/i), '  Recife  {Enter}');
    const current = await screen.findByRole('region', { name: 'Clima atual' });
    expect(within(current).getByText('28°C')).toBeInTheDocument();
    expect(within(current).getByText('Pernambuco, Brasil')).toBeInTheDocument();
    const cards = within(screen.getByRole('region', { name: 'Previsão de 5 dias' })).getAllByRole(
      'listitem',
    );
    expect(cards).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(within(current).getByText('82°F')).toBeInTheDocument();
    for (const [index, day] of mockWeatherData.forecast.entries()) {
      expect(
        within(cards[index]).getByText(`Máx: ${Math.round((day.maximumCelsius * 9) / 5 + 32)}°F`),
      ).toBeInTheDocument();
      expect(
        within(cards[index]).getByText(`Mín: ${Math.round((day.minimumCelsius * 9) / 5 + 32)}°F`),
      ).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(within(current).getByText('28°C')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledExactlyOnceWith('Recife');
    expect(weatherMock).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city);
    expect(JSON.stringify(mockWeatherData)).toBe(original);
  });

  it('mostra loading durante a busca e empty com o termo consultado', async () => {
    let resolve!: (cities: City[]) => void;
    searchMock.mockReturnValueOnce(
      new Promise<City[]>((done) => {
        resolve = done;
      }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/buscar cidade/i), 'xyzxyz{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o clima');
    expect(screen.getByLabelText(/buscar cidade/i)).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await act(async () => resolve([]));
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada para "xyzxyz"');
    expect(screen.getByLabelText(/buscar cidade/i)).toBeEnabled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('erro de busca chama retry do hook e preserva unidade', async () => {
    searchMock.mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByLabelText(/buscar cidade/i), 'Recife{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('82°F')).toBeInTheDocument();
    expect(searchMock.mock.calls).toEqual([['Recife'], ['Recife']]);
    expect(weatherMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('erro meteorológico remove conteúdo anterior e retry refaz somente clima', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/buscar cidade/i), 'Recife{Enter}');
    expect(await screen.findByText('28°C')).toBeInTheDocument();
    weatherMock.mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A requisição demorou demais.');
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('28°C')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(weatherMock).toHaveBeenCalledTimes(3);
  });
});

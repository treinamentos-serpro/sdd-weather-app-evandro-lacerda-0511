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
    expect(screen.getByRole('link', { name: 'Ir para o conteúdo' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(document.getElementById('main-content')).toHaveAttribute('tabindex', '-1');
    expect(document.getElementById('main-content')).toHaveClass('focus:outline-accent-400');
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
    expect(screen.getByRole('region', { name: 'Resultados da busca' })).toHaveFocus();
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

  it('mostra fallbacks seguros para dados inválidos sem exibir NaN ou undefined', async () => {
    weatherMock.mockResolvedValue({
      ...mockWeatherData,
      city: { ...mockWeatherData.city, name: '' },
      current: {
        ...mockWeatherData.current,
        temperatureCelsius: Number.NaN,
        weatherCode: -1,
      },
      forecast: mockWeatherData.forecast.map((day, index) =>
        index === 0
          ? {
              ...day,
              date: '',
              minimumCelsius: Number.NaN,
              maximumCelsius: Number.POSITIVE_INFINITY,
              weatherCode: -1,
            }
          : day,
      ),
    });
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/buscar cidade/i), 'Recife{Enter}');

    const current = await screen.findByRole('region', { name: 'Clima atual' });
    expect(within(current).getByRole('heading', { name: '—' })).toBeInTheDocument();
    expect(within(current).getAllByText('—', { selector: 'span' })).toHaveLength(2);
    expect(within(current).getByText('Condição indisponível')).toBeInTheDocument();

    const forecast = within(
      screen.getByRole('region', { name: 'Previsão de 5 dias' }),
    ).getAllByRole('listitem');
    expect(forecast[0]).toHaveTextContent('—');
    expect(forecast[0]).toHaveTextContent('Máx: —');
    expect(forecast[0]).toHaveTextContent('Mín: —');
    expect(within(forecast[0]).queryByRole('img')).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/NaN|undefined|null/);
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
    expect(screen.getByLabelText(/buscar cidade/i)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/buscar cidade/i)).toHaveFocus();
    expect(screen.getByRole('search')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('region', { name: 'Resultados da busca' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await act(async () => resolve([]));
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada para "xyzxyz"');
    expect(screen.getByLabelText(/buscar cidade/i)).not.toHaveAttribute('readonly');
    expect(screen.getByRole('region', { name: 'Resultados da busca' })).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Resultados da busca' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('erro de busca chama retry do hook e preserva unidade', async () => {
    searchMock.mockRejectedValueOnce(
      new WeatherServiceError(
        'Não foi possível conectar. Verifique sua conexão com a internet e tente novamente.',
        'network',
      ),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.type(screen.getByLabelText(/buscar cidade/i), 'Recife{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar. Verifique sua conexão com a internet e tente novamente.',
    );
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
    weatherMock.mockRejectedValueOnce(
      new WeatherServiceError(
        'A solicitação excedeu o limite de 10 segundos. Verifique sua conexão e tente novamente.',
        'timeout',
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A solicitação excedeu o limite de 10 segundos. Verifique sua conexão e tente novamente.',
    );
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('28°C')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(weatherMock).toHaveBeenCalledTimes(3);
  });
});

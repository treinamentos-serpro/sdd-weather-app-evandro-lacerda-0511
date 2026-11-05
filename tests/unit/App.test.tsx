import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderiza a marca e o estado inicial vazio', () => {
    render(<App />);
    expect(screen.getByText('WeatherView')).toBeInTheDocument();
    expect(screen.getByText(/busque uma cidade para começar/i)).toBeInTheDocument();
  });

  it('mostra a barra de busca e o alternador de unidade', () => {
    render(<App />);
    expect(screen.getByLabelText(/buscar cidade/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /unidade de temperatura/i })).toBeInTheDocument();
  });

  it('busca o mock sem rede e converte todas as temperaturas somente na apresentação', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const original = JSON.stringify(mockWeatherData);
    render(<App />);
    await user.type(screen.getByLabelText(/buscar cidade/i), '  recife  {Enter}');

    const current = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(current).getByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(within(current).getByText('Pernambuco, Brasil')).toBeInTheDocument();
    expect(within(current).getByText('28°C')).toBeInTheDocument();
    expect(within(current).getByText('Parcialmente nublado')).toBeInTheDocument();
    const forecast = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    const cards = within(forecast).getAllByRole('listitem');
    expect(cards).toHaveLength(5);
    expect(within(cards[0]).getByText('Hoje')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Amanhã')).toBeInTheDocument();
    for (const [index, day] of mockWeatherData.forecast.entries()) {
      expect(within(cards[index]).getByText(`Máx: ${day.maximumCelsius}°C`)).toBeInTheDocument();
      expect(within(cards[index]).getByText(`Mín: ${day.minimumCelsius}°C`)).toBeInTheDocument();
    }

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
    expect(JSON.stringify(mockWeatherData)).toBe(original);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('permite visualizar os cinco estados sem misturar conteúdo de sucesso', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByRole('region', { name: 'Clima atual' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'loading' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o clima');
    expect(screen.getByLabelText(/buscar cidade/i)).toBeDisabled();
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'empty' }));
    expect(screen.getByText('Nenhuma cidade encontrada')).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar cidade/i)).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada');
    await user.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede simulada');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('region', { name: 'Clima atual' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'idle' }));
    expect(screen.getByText(/busque uma cidade para começar/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('mostra vazio para cidade fora do mock e mantém a unidade ao mudar de estado', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa{Enter}');
    expect(screen.getByText('Nenhuma cidade encontrada')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°F' }));
    await user.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('82°F')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
  });
});

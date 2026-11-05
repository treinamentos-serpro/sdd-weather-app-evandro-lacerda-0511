import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import UnitToggle from '../../src/components/UnitToggle';
import CurrentWeather from '../../src/components/CurrentWeather';
import type { City, CurrentWeather as CurrentWeatherType, Unit } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Seattle',
  country: 'Estados Unidos',
  region: 'Washington',
  latitude: 47.6,
  longitude: -122.33,
};

const current: CurrentWeatherType = {
  observedAt: '2026-06-16T12:00',
  temperatureCelsius: 0,
  weatherCode: 3,
};

describe('UnitToggle', () => {
  it('expõe um grupo nomeado com dois botões e o estado ativo controlado por unit', () => {
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: '°F', pressed: false })).toBeInTheDocument();

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(within(group).getByRole('button', { name: '°C', pressed: false })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emite a unidade correspondente por clique sem alterar o estado controlado', async () => {
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '°F' }));
    await userEvent.click(screen.getByRole('button', { name: '°C' }));
    expect(onChange.mock.calls).toEqual([['fahrenheit'], ['celsius']]);
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();
  });

  it('navega com Tab e Shift+Tab e alterna por Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function KeyboardHarness() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <UnitToggle
          unit={unit}
          onChange={(nextUnit) => {
            onChange(nextUnit);
            setUnit(nextUnit);
          }}
        />
      );
    }
    render(<KeyboardHarness />);
    const celsius = screen.getByRole('button', { name: '°C' });
    const fahrenheit = screen.getByRole('button', { name: '°F' });

    await user.tab();
    expect(celsius).toHaveFocus();
    await user.tab();
    expect(fahrenheit).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    expect(celsius).toHaveAttribute('aria-pressed', 'false');

    await user.tab({ shift: true });
    expect(celsius).toHaveFocus();
    await user.keyboard(' ');
    expect(celsius).toHaveAttribute('aria-pressed', 'true');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'false');
    expect(onChange.mock.calls).toEqual([['fahrenheit'], ['celsius']]);
  });

  it('não submete o formulário que contém o controle', async () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: '°F' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

function Harness() {
  const [unit, setUnit] = useState<Unit>('celsius');
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={city} current={current} unit={unit} />
    </>
  );
}

describe('UnitToggle + CurrentWeather', () => {
  it('converte a temperatura ao alternar a unidade', async () => {
    render(<Harness />);
    expect(screen.getByText('0°C')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('32°F')).toBeInTheDocument();
  });

  it('expõe os botões com estado pressionado acessível', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: '°C' })).toHaveAttribute('aria-pressed', 'true');
  });
});

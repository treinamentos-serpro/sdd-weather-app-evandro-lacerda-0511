import { describe, it, expect } from 'vitest';
import { getWeatherInfo, getWeatherLabel, getWeatherIcon } from '../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it('mapeia códigos conhecidos', () => {
    expect(getWeatherLabel(0)).toBe('Céu limpo');
    expect(getWeatherIcon(95)).toBe('⛈️');
  });

  it.each([
    [1, 'Predomínio de sol', '🌤️'],
    [45, 'Névoa', '🌫️'],
    [51, 'Garoa leve', '🌦️'],
    [56, 'Garoa congelante', '🌧️'],
    [61, 'Chuva fraca', '🌦️'],
    [66, 'Chuva congelante', '🌧️'],
    [71, 'Neve fraca', '🌨️'],
    [77, 'Grãos de neve', '🌨️'],
    [80, 'Pancadas de chuva fracas', '🌦️'],
    [85, 'Pancadas de neve fracas', '🌨️'],
    [96, 'Trovoadas com granizo', '⛈️'],
  ] as const)('mapeia código WMO %i da categoria esperada', (code, label, icon) => {
    expect(getWeatherInfo(code)).toEqual({ label, icon });
  });

  it('usa fallback para código desconhecido', () => {
    const info = getWeatherInfo(123456);
    expect(info.label).toBe('Condição desconhecida');
    expect(info.icon).toBe('🌡️');
  });
});

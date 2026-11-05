import type { Unit } from '../types/weather';

/** Converte uma temperatura em Celsius para Fahrenheit. */
export function toFahrenheit(celsius: number): number {
  return celsius * (9 / 5) + 32;
}

/**
 * Converte um valor em Celsius para a unidade desejada, sem arredondar.
 * Mantém a função pura e testável.
 */
export function convertTemperature(celsius: number, unit: Unit): number {
  return unit === 'fahrenheit' ? toFahrenheit(celsius) : celsius;
}

/**
 * Formata uma temperatura (armazenada em Celsius) para exibição na unidade
 * escolhida, arredondando para inteiro e adicionando o símbolo de grau.
 */
export function formatTemperature(celsius: number | null | undefined, unit: Unit): string {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return '—';
  const converted = convertTemperature(celsius, unit);
  if (!Number.isFinite(converted)) return '—';
  const value = Math.round(converted);
  return `${value}°`;
}

export function formatTemperatureWithUnit(celsius: number | null | undefined, unit: Unit): string {
  const temperature = formatTemperature(celsius, unit);
  if (temperature === '—') return temperature;
  return `${temperature}${unit === 'celsius' ? 'C' : 'F'}`;
}

/** Rótulo curto da unidade atual (°C / °F). */
export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

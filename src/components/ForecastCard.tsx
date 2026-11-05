import type { ForecastDay, Unit } from '../types/weather';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import { getDayLabel, getShortDate } from '../lib/format';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
}

/** Card de um dia da previsão. */
export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-md sm:p-4">
      <p className="font-semibold">{getDayLabel(day.date, index)}</p>
      <p className="text-xs text-white/70">{getShortDate(day.date)}</p>
      {day.weatherCode !== undefined && (
        <span role="img" className="text-3xl" aria-label={getWeatherLabel(day.weatherCode)}>
          {getWeatherIcon(day.weatherCode)}
        </span>
      )}
      <p className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">
          Máx: {formatTemperature(day.maximumCelsius, unit)}
          {unit === 'celsius' ? 'C' : 'F'}
        </span>{' '}
        <span className="text-white/60">
          Mín: {formatTemperature(day.minimumCelsius, unit)}
          {unit === 'celsius' ? 'C' : 'F'}
        </span>
      </p>
    </li>
  );
}

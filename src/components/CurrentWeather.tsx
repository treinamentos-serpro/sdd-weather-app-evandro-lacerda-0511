import type { CurrentWeather as CurrentWeatherType, City, Unit } from '../types/weather';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherType;
  unit: Unit;
}

/** Seção "hero" com as condições atuais da cidade selecionada. */
export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const location = [city.region, city.country].filter(Boolean).join(', ');

  return (
    <section
      aria-label="Clima atual"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glass md:p-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold md:text-3xl">{city.name}</h2>
          {location && <p className="text-white/60">{location}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span aria-hidden="true" className="text-6xl">
              {getWeatherIcon(current.weatherCode)}
            </span>
            <span className="text-5xl font-light sm:text-6xl md:text-7xl">
              {formatTemperature(current.temperatureCelsius, unit)}
              {unit === 'celsius' ? 'C' : 'F'}
            </span>
          </div>
          <p className="mt-2 text-white/70">{getWeatherLabel(current.weatherCode)}</p>
        </div>
      </div>
    </section>
  );
}

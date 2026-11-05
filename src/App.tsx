import { useEffect, useRef, useState } from 'react';
import type { Unit } from './types/weather';
import { useWeather } from './hooks/useWeather';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import LoadingState from './components/states/LoadingState';
import ErrorState from './components/states/ErrorState';
import EmptyState from './components/states/EmptyState';

/** Tela de clima conectada aos serviços pelo hook de consulta. */
export default function App() {
  const { status, data, error, query, search, retry } = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');
  const resultsRef = useRef<HTMLElement>(null);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (status === 'loading') {
      wasLoading.current = true;
      return;
    }

    if (wasLoading.current && (status === 'success' || status === 'empty')) {
      resultsRef.current?.focus();
    }
    wasLoading.current = false;
  }, [status]);

  return (
    <div className="min-h-screen bg-night-900 text-white">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-accent-400 px-4 py-3 font-semibold text-night-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl text-sun">
              ☀️
            </span>
            <h1 className="text-lg font-bold">WeatherView</h1>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar onSearch={search} disabled={status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl space-y-8 px-4 py-8 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-accent-400"
      >
        {status === 'loading' && <LoadingState />}

        <section
          ref={resultsRef}
          aria-label="Resultados da busca"
          aria-busy={status === 'loading'}
          tabIndex={-1}
          className="space-y-8 focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Busque uma cidade para começar"
              hint="Ex.: Recife, Lisboa, São Paulo…"
            />
          )}

          {status === 'empty' && (
            <EmptyState
              title={`Nenhuma cidade encontrada para "${query}"`}
              hint="Verifique a grafia e tente novamente."
            />
          )}

          {status === 'error' && error !== null && <ErrorState message={error} onRetry={retry} />}

          {status === 'success' && data !== null && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList forecast={data.forecast} unit={unit} />
            </>
          )}
        </section>
      </main>

      <footer className="px-4 py-8 text-center text-sm text-white/70">
        Dados por{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded text-accent-400 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Open-Meteo
        </a>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import type { AsyncState, Unit, WeatherData } from './types/weather';
import { mockWeatherData } from './mocks/weather';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import LoadingState from './components/states/LoadingState';
import ErrorState from './components/states/ErrorState';
import EmptyState from './components/states/EmptyState';

/** Protótipo offline para desenvolver o layout e seus estados com dados fictícios. */
export default function App() {
  const [state, setState] = useState<AsyncState<WeatherData>>({ status: 'idle' });
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState<Unit>('celsius');

  function search(city: string) {
    const trimmed = city.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setState(
      trimmed.toLocaleLowerCase('pt-BR') === mockWeatherData.city.name.toLocaleLowerCase('pt-BR')
        ? { status: 'success', data: mockWeatherData }
        : { status: 'empty' },
    );
  }

  function previewState(status: AsyncState<WeatherData>['status']) {
    switch (status) {
      case 'success':
        setState({ status, data: mockWeatherData });
        break;
      case 'error':
        setState({
          status,
          error: { kind: 'network', message: 'Falha de rede simulada. Tente novamente.' },
        });
        break;
      default:
        setState({ status });
    }
  }

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
            <SearchBar onSearch={search} disabled={state.status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <aside className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-sm text-white/80">
            Demonstração offline: dados fictícios de Recife, com datas fixas de 5 a 9 de novembro de
            2026. Busque Recife ou escolha um estado abaixo; nenhuma API é chamada.
          </p>
          <div role="group" aria-label="Estados da demonstração" className="flex flex-wrap gap-2">
            {(['idle', 'loading', 'empty', 'error', 'success'] as const).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={state.status === status}
                onClick={() => previewState(status)}
                className="min-h-11 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 aria-pressed:bg-accent-400 aria-pressed:text-night-900"
              >
                {status}
              </button>
            ))}
          </div>
        </aside>

        {state.status === 'idle' && (
          <EmptyState
            title="Busque uma cidade para começar"
            hint="Nesta demonstração, busque Recife."
          />
        )}

        {state.status === 'loading' && <LoadingState />}

        {state.status === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint="Estado vazio da demonstração. Busque Recife para visualizar o mock."
          />
        )}

        {state.status === 'error' && (
          <ErrorState
            message={state.error.message}
            onRetry={() => search(query || mockWeatherData.city.name)}
          />
        )}

        {state.status === 'success' && (
          <>
            <CurrentWeather city={state.data.city} current={state.data.current} unit={unit} />
            <ForecastList forecast={state.data.forecast} unit={unit} />
          </>
        )}
      </main>

      <footer className="px-4 py-8 text-center text-sm text-white/70">
        Dados fictícios para desenvolvimento. Provedor previsto:{' '}
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

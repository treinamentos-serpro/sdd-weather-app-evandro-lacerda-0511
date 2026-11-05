import { useId, useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

/** Barra de busca de cidade. Bloqueia submit com input vazio. */
export default function SearchBar({ onSearch, disabled }: SearchBarProps) {
  const inputId = useId();
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (disabled || !trimmed) return;
    onSearch(trimmed);
  }

  return (
    <form
      role="search"
      aria-label="Pesquisa de cidades"
      aria-busy={disabled}
      onSubmit={handleSubmit}
      className="w-full min-w-0 max-w-md"
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md focus-within:border-accent-500">
        <span aria-hidden="true" className="text-white/50">
          🔍
        </span>
        <label htmlFor={inputId} className="sr-only">
          Buscar cidade
        </label>
        <input
          id={inputId}
          type="text"
          readOnly={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar cidade…"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded bg-transparent text-white placeholder-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 read-only:cursor-wait read-only:opacity-70"
        />
        <button
          type="submit"
          aria-disabled={disabled || !value.trim()}
          disabled={!value.trim()}
          className={`min-h-11 shrink-0 rounded-lg bg-accent-400 px-4 py-1.5 text-sm font-semibold text-night-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            disabled
              ? 'cursor-wait opacity-50'
              : !value.trim()
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-accent-500'
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

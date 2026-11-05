interface EmptyStateProps {
  title: string;
  hint?: string;
}

/** Estado vazio (nenhuma busca feita ou nenhum resultado). */
export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-16 text-center backdrop-blur-md"
    >
      <span aria-hidden="true" className="text-4xl">
        🌍
      </span>
      <h2 className="text-lg font-semibold text-white/80">{title}</h2>
      {hint && <p className="text-sm text-white/70">{hint}</p>}
    </div>
  );
}

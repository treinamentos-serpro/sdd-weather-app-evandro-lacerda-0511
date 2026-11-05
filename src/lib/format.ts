/**
 * Funções puras de formatação de datas para a previsão.
 */

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Faz parse de uma data ISO (YYYY-MM-DD) como data local, sem fuso. */
function isCivilDate(iso: string | null | undefined): iso is string {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const timestamp = Date.parse(`${iso}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === iso;
}

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/**
 * Rótulo do dia relativo a "hoje":
 * - índice 0 → "Hoje"
 * - índice 1 → "Amanhã"
 * - demais → dia da semana abreviado
 */
export function getDayLabel(iso: string | null | undefined, index: number): string {
  if (!isCivilDate(iso)) return '—';
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  const date = parseLocalDate(iso);
  return WEEKDAYS[date.getDay()];
}

/** Formata a data como "12 Jun". */
export function getShortDate(iso: string | null | undefined): string {
  if (!isCivilDate(iso)) return '—';
  const date = parseLocalDate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

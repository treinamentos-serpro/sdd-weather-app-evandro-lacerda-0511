import { describe, it, expect, vi } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('format', () => {
  it('rotula o primeiro e o segundo dia', () => {
    expect(getDayLabel('2026-06-16', 0)).toBe('Hoje');
    expect(getDayLabel('2026-06-17', 1)).toBe('Amanhã');
  });

  it('usa dia da semana para os demais', () => {
    // 2026-06-18 é uma quinta-feira.
    expect(getDayLabel('2026-06-18', 2)).toBe('Qui');
    expect(getDayLabel('2026-06-22', 4)).toBe('Seg');
  });

  it('formata data curta', () => {
    expect(getShortDate('2026-06-16')).toBe('16 Jun');
  });

  it('usa travessão para datas ausentes ou inválidas', () => {
    expect(getDayLabel('', 2)).toBe('—');
    expect(getDayLabel(undefined, 0)).toBe('—');
    expect(getShortDate(null)).toBe('—');
    expect(getShortDate('2026-02-30')).toBe('—');
  });

  it('mantém a data civil em fusos horários diferentes', () => {
    try {
      vi.stubEnv('TZ', 'UTC');
      const utcLabel = getDayLabel('2026-06-18', 2);
      const utcDate = getShortDate('2026-06-18');

      vi.stubEnv('TZ', 'Pacific/Honolulu');
      expect(getDayLabel('2026-06-18', 2)).toBe(utcLabel);
      expect(getShortDate('2026-06-18')).toBe(utcDate);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

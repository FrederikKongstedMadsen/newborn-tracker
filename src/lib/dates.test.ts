import { relativeDays, todayIso } from './dates';

describe('todayIso', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('relativeDays', () => {
  it('returns "today" for the same date', () => {
    expect(relativeDays('2026-07-18', '2026-07-18')).toBe('today');
  });

  it('returns "yesterday" for one day back', () => {
    expect(relativeDays('2026-07-17', '2026-07-18')).toBe('yesterday');
  });

  it('returns "Nd ago" for multiple days back', () => {
    expect(relativeDays('2026-07-10', '2026-07-18')).toBe('8d ago');
  });

  it('handles month boundaries correctly', () => {
    expect(relativeDays('2026-06-30', '2026-07-02')).toBe('2d ago');
  });

  it('clamps future dates to "today"', () => {
    expect(relativeDays('2026-07-19', '2026-07-18')).toBe('today');
  });
});

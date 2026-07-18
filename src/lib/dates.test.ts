import { relativeDays, relativeTime, todayIso } from './dates';

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

describe('relativeTime', () => {
  const now = Date.parse('2026-07-18T14:00:00.000Z');
  it('minutes ago', () => {
    expect(relativeTime('2026-07-18T13:46:00.000Z', now)).toBe('14m ago');
  });
  it('hours ago', () => {
    expect(relativeTime('2026-07-18T11:00:00.000Z', now)).toBe('3h ago');
  });
  it('just now under a minute', () => {
    expect(relativeTime('2026-07-18T13:59:30.000Z', now)).toBe('just now');
  });
  it('falls back to days beyond 24h', () => {
    expect(relativeTime('2026-07-15T13:00:00.000Z', now)).toBe('3d ago');
  });
});

import { formatAge, relativeDays, relativeTime, timeHHmm, todayIso } from './dates';

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

describe('timeHHmm', () => {
  it('formats a morning time as 24-hour HH:mm', () => {
    const iso = new Date(2026, 6, 18, 9, 5).toISOString();
    expect(timeHHmm(iso)).toBe('09:05');
  });

  it('formats an afternoon/evening time in 24-hour form (no AM/PM)', () => {
    const iso = new Date(2026, 6, 18, 21, 30).toISOString();
    expect(timeHHmm(iso)).toBe('21:30');
  });

  it('pads midnight hour and minute', () => {
    const iso = new Date(2026, 6, 18, 0, 0).toISOString();
    expect(timeHHmm(iso)).toBe('00:00');
  });
});

describe('formatAge', () => {
  it('formats 0 days', () => {
    expect(formatAge(0)).toBe('0 days old');
  });

  it('formats 1 day singular', () => {
    expect(formatAge(1)).toBe('1 day old');
  });

  it('formats days under 14 as days', () => {
    expect(formatAge(13)).toBe('13 days old');
  });

  it('formats exactly 14 days as 2 weeks old with no remainder', () => {
    expect(formatAge(14)).toBe('2 weeks old');
  });

  it('formats 20 days as 2 weeks 6 days old', () => {
    expect(formatAge(20)).toBe('2 weeks 6 days old');
  });

  it('formats weeks with singular day remainder', () => {
    expect(formatAge(15)).toBe('2 weeks 1 day old');
  });

  it('formats 60 days in weeks form', () => {
    expect(formatAge(60)).toBe('8 weeks 4 days old');
  });

  it('formats exactly 61 days as 2 months old with no remainder', () => {
    expect(formatAge(61)).toBe('2 months old');
  });

  it('formats 75 days as 2 months 2 weeks old', () => {
    expect(formatAge(75)).toBe('2 months 2 weeks old');
  });

  it('formats months with singular week remainder', () => {
    expect(formatAge(70)).toBe('2 months 1 week old');
  });
});

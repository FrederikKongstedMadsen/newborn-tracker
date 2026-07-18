import { formatClock } from './clock';

describe('formatClock', () => {
  it('formats zero', () => {
    expect(formatClock(0)).toBe('00:00');
  });
  it('formats sub-minute seconds', () => {
    expect(formatClock(59)).toBe('00:59');
  });
  it('formats minutes and seconds', () => {
    expect(formatClock(65)).toBe('01:05');
  });
  it('formats hours as h:mm:ss above 1h', () => {
    expect(formatClock(3725)).toBe('1:02:05');
  });
});

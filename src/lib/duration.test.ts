import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('formats sub-minute as seconds', () => {
    expect(formatDuration(45)).toBe('45s');
  });
  it('formats minutes', () => {
    expect(formatDuration(14 * 60)).toBe('14m');
  });
  it('formats hours with padded minutes', () => {
    expect(formatDuration(3720)).toBe('1h 02m');
  });
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});

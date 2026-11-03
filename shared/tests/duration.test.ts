import { describe, it, expect } from 'vitest';
import { calculateConnectedDurationSeconds, formatDuration } from '../src/duration';

describe('calculateConnectedDurationSeconds', () => {
  it('returns 0 when call was never connected (connectedAt is null)', () => {
    const started = 1700000000000;
    const ended = 1700000025000;
    expect(calculateConnectedDurationSeconds(null, ended)).toBe(0);
    expect(calculateConnectedDurationSeconds(undefined, ended)).toBe(0);
  });

  it('returns 0 when endedAt is missing', () => {
    expect(calculateConnectedDurationSeconds(1700000000000, null)).toBe(0);
  });

  it('calculates exact integer seconds from millisecond difference', () => {
    const connected = 1700000010000;
    const ended = 1700000045500; // 35.5 seconds
    expect(calculateConnectedDurationSeconds(connected, ended)).toBe(35);
  });

  it('protects against clock skew or negative duration', () => {
    const connected = 1700000050000;
    const ended = 1700000040000; // negative
    expect(calculateConnectedDurationSeconds(connected, ended)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats MM:SS correctly for less than 1 hour', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(5)).toBe('00:05');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(599)).toBe('09:59');
    expect(formatDuration(3599)).toBe('59:59');
  });

  it('formats HH:MM:SS correctly for 1 hour or more', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
    expect(formatDuration(3665)).toBe('01:01:05');
    expect(formatDuration(86400)).toBe('24:00:00');
  });
});

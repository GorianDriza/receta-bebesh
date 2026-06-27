// Mock Firebase — users.ts imports it but pure functions don't use it
jest.mock('firebase/database', () => ({}));
jest.mock('../lib/firebase', () => ({ firebaseDatabase: null }));

import { computeAgeStage, formatBabyAge } from '../lib/users';

// Pin "today" so tests don't drift as calendar advances
const FIXED_NOW = new Date('2026-06-27T12:00:00Z');
const realNow = Date;

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

// ── computeAgeStage ───────────────────────────────────────────────────────────

describe('computeAgeStage', () => {
  it('returns 4-6m when baby is 3 months old', () => {
    expect(computeAgeStage('2026-03-27')).toBe('4-6m');
  });

  it('returns 4-6m at exactly 6 months', () => {
    expect(computeAgeStage('2025-12-27')).toBe('4-6m');
  });

  it('returns 6-8m at 7 months', () => {
    expect(computeAgeStage('2025-11-27')).toBe('6-8m');
  });

  it('returns 6-8m at exactly 8 months', () => {
    expect(computeAgeStage('2025-10-27')).toBe('6-8m');
  });

  it('returns 9-12m at 9 months', () => {
    expect(computeAgeStage('2025-09-27')).toBe('9-12m');
  });

  it('returns 9-12m at exactly 12 months', () => {
    expect(computeAgeStage('2025-06-27')).toBe('9-12m');
  });

  it('returns 12m+ at 13 months', () => {
    expect(computeAgeStage('2025-05-27')).toBe('12m+');
  });

  it('returns 12m+ for a 2-year-old', () => {
    expect(computeAgeStage('2024-06-27')).toBe('12m+');
  });

  it('returns 4-6m for invalid date', () => {
    expect(computeAgeStage('not-a-date')).toBe('4-6m');
  });

  it('returns 4-6m for empty string', () => {
    expect(computeAgeStage('')).toBe('4-6m');
  });
});

// ── formatBabyAge ─────────────────────────────────────────────────────────────

describe('formatBabyAge', () => {
  it('formats months in Albanian', () => {
    expect(formatBabyAge('2026-03-27', 'sq-AL')).toBe('3 muaj');
  });

  it('formats months in English', () => {
    expect(formatBabyAge('2026-03-27', 'en')).toBe('3 months');
  });

  it('formats exactly 1 year in Albanian', () => {
    expect(formatBabyAge('2025-06-27', 'sq-AL')).toBe('1 vjeç');
  });

  it('formats exactly 1 year in English (singular)', () => {
    expect(formatBabyAge('2025-06-27', 'en')).toBe('1 year');
  });

  it('formats exactly 2 years in English (plural)', () => {
    expect(formatBabyAge('2024-06-27', 'en')).toBe('2 years');
  });

  it('formats mixed years+months in Albanian', () => {
    expect(formatBabyAge('2024-12-27', 'sq-AL')).toBe('1 vj 6 m');
  });

  it('formats mixed years+months in English', () => {
    expect(formatBabyAge('2024-12-27', 'en')).toBe('1y 6m');
  });

  it('returns empty string for invalid date', () => {
    expect(formatBabyAge('bad', 'en')).toBe('');
  });
});

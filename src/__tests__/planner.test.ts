// Mock Firebase and AsyncStorage — planner.ts imports them but pure functions don't use them
jest.mock('firebase/database', () => ({}));
jest.mock('../lib/firebase', () => ({ firebaseDatabase: null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { getISOWeekKey, getWeekStartDate, offsetWeek, todayDayKey } from '../lib/planner';

// ── getISOWeekKey ─────────────────────────────────────────────────────────────

describe('getISOWeekKey', () => {
  it('returns correct week key for a known Monday', () => {
    // 2024-01-01 is Week 1 of 2024
    expect(getISOWeekKey(new Date('2024-01-01'))).toBe('2024-W01');
  });

  it('returns correct week key for a known Sunday (ISO week same week)', () => {
    // 2024-01-07 (Sunday) is still W01 2024
    expect(getISOWeekKey(new Date('2024-01-07'))).toBe('2024-W01');
  });

  it('handles week 53 correctly (2020-W53)', () => {
    // 2020-12-31 is W53 of 2020
    expect(getISOWeekKey(new Date('2020-12-31'))).toBe('2020-W53');
  });

  it('handles late December that belongs to next year week 1', () => {
    // 2019-12-30 is W01 of 2020 per ISO
    expect(getISOWeekKey(new Date('2019-12-30'))).toBe('2020-W01');
  });

  it('pads single-digit week numbers', () => {
    const key = getISOWeekKey(new Date('2024-01-01'));
    expect(key).toMatch(/W\d{2}$/);
  });

  it('is consistent: getWeekStartDate round-trips through getISOWeekKey', () => {
    const key = '2025-W22';
    const start = getWeekStartDate(key);
    expect(getISOWeekKey(start)).toBe(key);
  });
});

// ── getWeekStartDate ──────────────────────────────────────────────────────────

describe('getWeekStartDate', () => {
  it('returns Monday for W01-2024', () => {
    const d = getWeekStartDate('2024-W01');
    expect(d.getUTCDay()).toBe(1); // Monday
    expect(d.toISOString().slice(0, 10)).toBe('2024-01-01');
  });

  it('returns Monday for W26-2026', () => {
    const d = getWeekStartDate('2026-W26');
    expect(d.getUTCDay()).toBe(1);
  });
});

// ── offsetWeek ────────────────────────────────────────────────────────────────

describe('offsetWeek', () => {
  it('advances one week', () => {
    expect(offsetWeek('2024-W01', 1)).toBe('2024-W02');
  });

  it('goes back one week', () => {
    expect(offsetWeek('2024-W02', -1)).toBe('2024-W01');
  });

  it('crosses year boundary forward', () => {
    // W52 2023 + 1 = W01 2024
    expect(offsetWeek('2023-W52', 1)).toBe('2024-W01');
  });

  it('crosses year boundary backward', () => {
    expect(offsetWeek('2024-W01', -1)).toBe('2023-W52');
  });

  it('zero delta returns same week', () => {
    expect(offsetWeek('2025-W15', 0)).toBe('2025-W15');
  });

  it('large delta works correctly', () => {
    // 2025 has 52 ISO weeks; W01+52 lands on 2026-W01
    expect(offsetWeek('2025-W01', 52)).toBe('2026-W01');
  });
});

// ── todayDayKey ───────────────────────────────────────────────────────────────

describe('todayDayKey', () => {
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  it('returns a valid DayKey', () => {
    const key = todayDayKey();
    expect(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']).toContain(key);
  });

  it('matches the JS day of week', () => {
    const expected = DAYS[new Date().getDay()];
    expect(todayDayKey()).toBe(expected);
  });
});

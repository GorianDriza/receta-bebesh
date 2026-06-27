import AsyncStorage from '@react-native-async-storage/async-storage';
import { addGrowthEntry, getGrowthLog, removeGrowthEntry } from '../lib/growthTracker';

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete mockStorage[key]; return Promise.resolve(); }),
}));

const KEY = '@growth_log';

beforeEach(() => {
  delete mockStorage[KEY];
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => Promise.resolve(mockStorage[key] ?? null));
  (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => { mockStorage[key] = value; return Promise.resolve(); });
});

describe('getGrowthLog', () => {
  it('returns empty array when no data', async () => {
    expect(await getGrowthLog()).toEqual([]);
  });

  it('returns entries sorted by date ascending', async () => {
    mockStorage[KEY] = JSON.stringify([
      { id: '1', date: '2025-03-10', weightKg: 8.0 },
      { id: '2', date: '2025-01-05', weightKg: 7.0 },
      { id: '3', date: '2025-06-01', weightKg: 9.2 },
    ]);
    const log = await getGrowthLog();
    expect(log.map((e) => e.date)).toEqual(['2025-01-05', '2025-03-10', '2025-06-01']);
  });

  it('returns empty array on malformed JSON', async () => {
    mockStorage[KEY] = 'not-json';
    expect(await getGrowthLog()).toEqual([]);
  });
});

describe('addGrowthEntry', () => {
  it('appends an entry with a generated id', async () => {
    await addGrowthEntry({ date: '2025-05-01', weightKg: 7.5 });
    const log = await getGrowthLog();
    expect(log).toHaveLength(1);
    expect(log[0].date).toBe('2025-05-01');
    expect(log[0].weightKg).toBe(7.5);
    expect(typeof log[0].id).toBe('string');
    expect(log[0].id.length).toBeGreaterThan(0);
  });

  it('accumulates multiple entries', async () => {
    await addGrowthEntry({ date: '2025-05-01', weightKg: 7.5 });
    await addGrowthEntry({ date: '2025-06-01', heightCm: 68 });
    const log = await getGrowthLog();
    expect(log).toHaveLength(2);
  });

  it('stores optional note field', async () => {
    await addGrowthEntry({ date: '2025-05-01', note: 'After illness' });
    const log = await getGrowthLog();
    expect(log[0].note).toBe('After illness');
  });
});

describe('removeGrowthEntry', () => {
  it('removes the entry with the given id', async () => {
    mockStorage[KEY] = JSON.stringify([
      { id: 'aaa', date: '2025-01-01', weightKg: 6.0 },
      { id: 'bbb', date: '2025-02-01', weightKg: 6.5 },
    ]);
    await removeGrowthEntry('aaa');
    const log = await getGrowthLog();
    expect(log).toHaveLength(1);
    expect(log[0].id).toBe('bbb');
  });

  it('is a no-op for unknown id', async () => {
    mockStorage[KEY] = JSON.stringify([{ id: 'aaa', date: '2025-01-01', weightKg: 6.0 }]);
    await removeGrowthEntry('zzz');
    const log = await getGrowthLog();
    expect(log).toHaveLength(1);
  });

  it('handles empty storage gracefully', async () => {
    await expect(removeGrowthEntry('anything')).resolves.not.toThrow();
  });
});

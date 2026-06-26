import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, ref, remove, set } from 'firebase/database';
import { firebaseDatabase } from './firebase';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type PlannerMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type PlannerEntry = {
  recipeId: string;
  recipeTitle: string;
  recipeImage: string | null;
  addedAt: string;
};

export type DayPlan = Partial<Record<PlannerMealType, PlannerEntry>>;
export type WeekPlan = Partial<Record<DayKey, DayPlan>>;

function cacheKey(uid: string, weekKey: string): string {
  return `@planner_cache_${uid}_${weekKey}`;
}

async function savePlanCache(uid: string, weekKey: string, plan: WeekPlan): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(uid, weekKey), JSON.stringify(plan));
  } catch {}
}

async function loadPlanCache(uid: string, weekKey: string): Promise<WeekPlan | null> {
  try {
    const json = await AsyncStorage.getItem(cacheKey(uid, weekKey));
    return json ? (JSON.parse(json) as WeekPlan) : null;
  } catch {
    return null;
  }
}

export function getISOWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getWeekStartDate(weekKey: string): Date {
  const [yearStr, wStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wStr, 10);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  return monday;
}

export function offsetWeek(weekKey: string, delta: number): string {
  const start = getWeekStartDate(weekKey);
  start.setUTCDate(start.getUTCDate() + delta * 7);
  return getISOWeekKey(start);
}

export function todayDayKey(): DayKey {
  const d = new Date().getDay(); // 0=Sun,1=Mon,...
  const map: Record<number, DayKey> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun' };
  return map[d] ?? 'mon';
}

export async function getWeekPlan(uid: string, weekKey: string): Promise<WeekPlan> {
  if (!firebaseDatabase) {
    return (await loadPlanCache(uid, weekKey)) ?? {};
  }
  try {
    const snap = await get(ref(firebaseDatabase, `users/${uid}/planner/${weekKey}`));
    const plan = snap.exists() ? (snap.val() as WeekPlan) : {};
    await savePlanCache(uid, weekKey, plan);
    return plan;
  } catch {
    return (await loadPlanCache(uid, weekKey)) ?? {};
  }
}

export async function setPlannerEntry(
  uid: string,
  weekKey: string,
  day: DayKey,
  meal: PlannerMealType,
  entry: PlannerEntry,
): Promise<void> {
  if (!firebaseDatabase) return;
  await set(ref(firebaseDatabase, `users/${uid}/planner/${weekKey}/${day}/${meal}`), entry);
  const cached = (await loadPlanCache(uid, weekKey)) ?? {};
  const updatedDay = { ...(cached[day] ?? {}), [meal]: entry };
  await savePlanCache(uid, weekKey, { ...cached, [day]: updatedDay });
}

export async function removePlannerEntry(
  uid: string,
  weekKey: string,
  day: DayKey,
  meal: PlannerMealType,
): Promise<void> {
  if (!firebaseDatabase) return;
  await remove(ref(firebaseDatabase, `users/${uid}/planner/${weekKey}/${day}/${meal}`));
  const cached = (await loadPlanCache(uid, weekKey)) ?? {};
  const updatedDay = { ...(cached[day] ?? {}) };
  delete updatedDay[meal];
  await savePlanCache(uid, weekKey, { ...cached, [day]: updatedDay });
}

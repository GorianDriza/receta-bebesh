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

export async function getWeekPlan(uid: string, weekKey: string): Promise<WeekPlan> {
  if (!firebaseDatabase) return {};
  const snap = await get(ref(firebaseDatabase, `users/${uid}/planner/${weekKey}`));
  return snap.exists() ? (snap.val() as WeekPlan) : {};
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
}

export async function removePlannerEntry(
  uid: string,
  weekKey: string,
  day: DayKey,
  meal: PlannerMealType,
): Promise<void> {
  if (!firebaseDatabase) return;
  await remove(ref(firebaseDatabase, `users/${uid}/planner/${weekKey}/${day}/${meal}`));
}

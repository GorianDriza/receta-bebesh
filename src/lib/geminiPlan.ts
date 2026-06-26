import { AppLanguage } from '../i18n/translations';
import { RecipeRecord } from './recipes';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL   = 'gemini-2.0-flash-lite';

export type DayPlanSuggestion = Partial<Record<'breakfast' | 'lunch' | 'dinner' | 'snack', string>>;
export type WeekPlanSuggestion = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', DayPlanSuggestion>>;

export const DAYS_ORDER: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> =
  ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_LABELS: Record<AppLanguage, Record<typeof DAYS_ORDER[number], string>> = {
  'sq-AL': { mon: 'E Hënë', tue: 'E Martë', wed: 'E Mërkurë', thu: 'E Enjte', fri: 'E Premte', sat: 'E Shtunë', sun: 'E Diel' },
  en:      { mon: 'Mon',    tue: 'Tue',      wed: 'Wed',        thu: 'Thu',     fri: 'Fri',      sat: 'Sat',     sun: 'Sun'    },
};

export function getDayLabel(day: typeof DAYS_ORDER[number], language: AppLanguage) {
  return DAY_LABELS[language][day];
}

export async function generateWeeklyPlan(
  babyAgeMonths: number,
  recipes: RecipeRecord[],
  language: AppLanguage,
): Promise<WeekPlanSuggestion> {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const recipeList = recipes
    .slice(0, 60)
    .map((r) => `${r.id}|${r.title.en}|${r.mealType}`)
    .join('\n');

  const languageNote = language === 'sq-AL' ? 'The user speaks Albanian.' : 'The user speaks English.';

  const prompt = `You are a nutritionist helping parents plan meals for a baby aged ${babyAgeMonths} months.
${languageNote}

Available recipes (id|title|meal_type):
${recipeList}

Create a 7-day meal plan for a baby. Use the available recipes. Return ONLY valid JSON, no markdown, no explanation:
{
  "mon": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"},
  "tue": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"},
  "wed": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"},
  "thu": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"},
  "fri": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"},
  "sat": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"},
  "sun": {"breakfast": "recipe-id", "lunch": "recipe-id", "dinner": "recipe-id", "snack": "recipe-id"}
}
Only use recipe IDs from the list. Vary the plan across days.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonStart = raw.indexOf('{');
  const jsonEnd   = raw.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON in response');
  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as WeekPlanSuggestion;
}

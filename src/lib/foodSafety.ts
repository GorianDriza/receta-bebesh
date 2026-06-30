export type SafetyRule = {
  id: string;
  keywords: string[];
  reason_sq: string;
  reason_en: string;
  safeAfterMonths: number;
  type: 'danger' | 'warning';
};

export const SAFETY_RULES: SafetyRule[] = [
  {
    id: 'honey',
    keywords: ['honey', 'mjaltë', 'mjalte', 'mel'],
    reason_sq: 'Mjalta shkakton botulizëm tek foshnjat nën 12 muaj.',
    reason_en: 'Honey causes infant botulism in babies under 12 months.',
    safeAfterMonths: 12,
    type: 'danger',
  },
  {
    id: 'added_sugar',
    keywords: ['sugar', 'sheqer', 'syrup', 'shurup', 'brown sugar'],
    reason_sq: 'Shmangni sheqerin e shtuar tek foshnjat nën 12 muaj.',
    reason_en: 'Avoid added sugar for babies under 12 months.',
    safeAfterMonths: 12,
    type: 'warning',
  },
  {
    id: 'round_fruits',
    keywords: ['whole grape', 'grapes', 'cherry', 'qershi', 'blueberry', 'mjedër', 'olive', 'ulliri', 'tomato cherry'],
    reason_sq: 'Frutat e rrumbullakëta janë rrezik mbytjeje — pritini në katërshe.',
    reason_en: 'Round fruits are a choking hazard — cut into quarters.',
    safeAfterMonths: 48,
    type: 'warning',
  },
  {
    id: 'whole_nuts',
    keywords: ['whole almond', 'whole walnut', 'whole cashew', 'whole peanut', 'pine nut', 'whole nut'],
    reason_sq: 'Arrat e plota janë rrezik mbytjeje — bluajini ose blendoni.',
    reason_en: 'Whole nuts are a choking hazard — grind or blend instead.',
    safeAfterMonths: 60,
    type: 'warning',
  },
  {
    id: 'raw_egg',
    keywords: ['raw egg', 'vezë e papjekur', 'uncooked egg'],
    reason_sq: 'Vezët e papjekura mund të shkaktojnë sëmundje të rënda.',
    reason_en: 'Raw eggs can cause serious illness in babies.',
    safeAfterMonths: 999,
    type: 'danger',
  },
];

export type SafetyMatch = { rule: SafetyRule; ingredient: string };

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function checkSafety(ingredients: string[], ageMonths: number): SafetyMatch[] {
  const matches: SafetyMatch[] = [];
  const seen = new Set<string>();
  for (const ing of ingredients) {
    const normIng = norm(ing);
    for (const rule of SAFETY_RULES) {
      if (seen.has(rule.id)) continue;
      if (ageMonths >= rule.safeAfterMonths) continue;
      for (const kw of rule.keywords) {
        if (normIng.includes(norm(kw))) {
          matches.push({ rule, ingredient: ing });
          seen.add(rule.id);
          break;
        }
      }
    }
  }
  return matches;
}

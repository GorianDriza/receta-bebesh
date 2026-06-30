import { RecipeStage } from './recipes';

export type NutritionTarget = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

// Approximate daily solids targets by age stage
// Sources: WHO, AAP, NHS — excludes milk contribution
export const DAILY_TARGETS: Record<RecipeStage, NutritionTarget> = {
  '4-6m':  { kcal: 100,  proteinG: 5,  carbsG: 15,  fatG: 5,  fiberG: 2  },
  '6-8m':  { kcal: 200,  proteinG: 10, carbsG: 30,  fatG: 10, fiberG: 5  },
  '9-12m': { kcal: 350,  proteinG: 14, carbsG: 45,  fatG: 15, fiberG: 8  },
  '12m+':  { kcal: 550,  proteinG: 15, carbsG: 65,  fatG: 20, fiberG: 10 },
  'family':{ kcal: 900,  proteinG: 18, carbsG: 120, fatG: 30, fiberG: 15 },
};

export type NutrientKey = keyof NutritionTarget;

export const NUTRIENT_META: Array<{
  key: NutrientKey;
  label_sq: string;
  label_en: string;
  unit: string;
  color: string;
}> = [
  { key: 'kcal',     label_sq: 'Kalori',        label_en: 'Calories', unit: 'kcal', color: '#FF8C1A' },
  { key: 'proteinG', label_sq: 'Proteina',       label_en: 'Protein',  unit: 'g',    color: '#6ECAC0' },
  { key: 'carbsG',   label_sq: 'Karbohidrate',   label_en: 'Carbs',    unit: 'g',    color: '#FFB800' },
  { key: 'fatG',     label_sq: 'Yndyrna',        label_en: 'Fat',      unit: 'g',    color: '#F4A62C' },
  { key: 'fiberG',   label_sq: 'Fibra',          label_en: 'Fiber',    unit: 'g',    color: '#3AAB72' },
];

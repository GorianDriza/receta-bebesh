import { RecipeNutrition, RecipeRecord } from './recipes';

export type NutritionTotals = Required<RecipeNutrition>;

export type NutritionSummary = {
  totals: NutritionTotals;
  recipeCount: number;
  withNutritionCount: number;
};

const EMPTY_TOTALS: NutritionTotals = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  ironMg: 0,
  calciumMg: 0,
  vitaminCMg: 0,
};

export function summarizeRecipeNutrition(recipes: RecipeRecord[]): NutritionSummary {
  const totals = { ...EMPTY_TOTALS };
  let withNutritionCount = 0;

  for (const recipe of recipes) {
    if (!recipe.nutrition) {
      continue;
    }

    withNutritionCount++;
    totals.kcal += recipe.nutrition.kcal ?? 0;
    totals.proteinG += recipe.nutrition.proteinG ?? 0;
    totals.carbsG += recipe.nutrition.carbsG ?? 0;
    totals.fatG += recipe.nutrition.fatG ?? 0;
    totals.fiberG += recipe.nutrition.fiberG ?? 0;
    totals.ironMg += recipe.nutrition.ironMg ?? 0;
    totals.calciumMg += recipe.nutrition.calciumMg ?? 0;
    totals.vitaminCMg += recipe.nutrition.vitaminCMg ?? 0;
  }

  return {
    totals,
    recipeCount: recipes.length,
    withNutritionCount,
  };
}

export function roundNutritionValue(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const rounded = Number(value.toFixed(decimals));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

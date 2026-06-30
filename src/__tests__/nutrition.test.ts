import { roundNutritionValue, summarizeRecipeNutrition } from '../lib/nutrition';
import { RecipeRecord } from '../lib/recipes';

function recipe(nutrition?: RecipeRecord['nutrition']): RecipeRecord {
  return {
    id: Math.random().toString(),
    slug: 'test',
    languages: ['sq-AL', 'en'],
    title: { en: 'Test', 'sq-AL': 'Test' },
    summary: { en: '', 'sq-AL': '' },
    ingredients: { en: [], 'sq-AL': [] },
    steps: { en: [], 'sq-AL': [] },
    ageStage: '6-8m',
    mealType: 'puree',
    prepMinutes: null,
    cookMinutes: null,
    totalMinutes: null,
    image: {
      sourceUrl: null,
      storagePath: null,
      downloadUrl: null,
      contentType: null,
      mirroredAt: null,
    },
    source: {
      siteName: 'test',
      sourceId: 'test',
      url: 'https://example.com',
      imageUrl: null,
      scrapedAt: '2026-01-01T00:00:00.000Z',
    },
    translation: {
      status: 'pending',
      provider: 'manual',
      reviewedBy: null,
    },
    nutrition,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('nutrition helpers', () => {
  it('sums available nutrition and tracks coverage', () => {
    const summary = summarizeRecipeNutrition([
      recipe({ kcal: 100, proteinG: 4, carbsG: 12 }),
      recipe({ kcal: 50, fatG: 3, ironMg: 1.2 }),
      recipe(),
    ]);

    expect(summary.recipeCount).toBe(3);
    expect(summary.withNutritionCount).toBe(2);
    expect(summary.totals).toMatchObject({
      kcal: 150,
      proteinG: 4,
      carbsG: 12,
      fatG: 3,
      ironMg: 1.2,
    });
  });

  it('formats rounded nutrition values', () => {
    expect(roundNutritionValue(12.34)).toBe('12');
    expect(roundNutritionValue(12.34, 1)).toBe('12.3');
  });
});

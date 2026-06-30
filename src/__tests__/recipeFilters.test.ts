import {
  filterAndSortRecipes,
  inferRecipeMealType,
  isRecipeCompatibleWithAge,
  recipeMatchesSearch,
} from '../lib/recipeFilters';
import { RecipeRecord } from '../lib/recipes';

function recipe(overrides: Partial<RecipeRecord>): RecipeRecord {
  return {
    id: 'id',
    slug: 'id',
    languages: ['sq-AL', 'en'],
    title: { en: 'Apple Pancakes', 'sq-AL': 'Petulla me mollë' },
    summary: { en: 'Soft breakfast', 'sq-AL': 'Mëngjes i butë' },
    ingredients: { en: ['1 apple', '2 eggs'], 'sq-AL': ['1 mollë', '2 vezë'] },
    steps: { en: ['Mix', 'Cook'], 'sq-AL': ['Përziej', 'Gatuaj'] },
    ageStage: '6-8m',
    mealType: 'unknown',
    prepMinutes: 10,
    cookMinutes: 5,
    totalMinutes: 15,
    image: {
      sourceUrl: null,
      storagePath: null,
      downloadUrl: null,
      contentType: null,
      mirroredAt: null,
    },
    source: {
      siteName: 'test',
      sourceId: 'id',
      url: 'https://example.com',
      imageUrl: null,
      scrapedAt: '2026-01-01T00:00:00.000Z',
    },
    translation: {
      status: 'pending',
      provider: 'manual',
      reviewedBy: null,
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('recipe filtering helpers', () => {
  it('treats older baby stages as compatible with earlier-stage recipes', () => {
    expect(isRecipeCompatibleWithAge('4-6m', '6-8m')).toBe(true);
    expect(isRecipeCompatibleWithAge('6-8m', '9-12m')).toBe(true);
    expect(isRecipeCompatibleWithAge('9-12m', '6-8m')).toBe(false);
    expect(isRecipeCompatibleWithAge('family', '12m+')).toBe(true);
  });

  it('infers meal type from unknown scraped records', () => {
    expect(inferRecipeMealType(recipe({ title: { en: 'Banana Oat Porridge', 'sq-AL': 'Qull' } }))).toBe('breakfast');
    expect(inferRecipeMealType(recipe({ title: { en: 'Carrot Puree', 'sq-AL': 'Pure' } }))).toBe('puree');
  });

  it('searches titles, summaries, ingredients, and steps across languages', () => {
    expect(recipeMatchesSearch(recipe({}), 'mollë')).toBe(true);
    expect(recipeMatchesSearch(recipe({}), 'eggs')).toBe(true);
    expect(recipeMatchesSearch(recipe({}), 'cook')).toBe(true);
    expect(recipeMatchesSearch(recipe({}), 'salmon')).toBe(false);
  });

  it('filters and sorts recipes with shared rules', () => {
    const recipes = [
      recipe({ id: 'slow', title: { en: 'Z Soup', 'sq-AL': 'Z Supë' }, ageStage: '9-12m', mealType: 'dinner', totalMinutes: 45 }),
      recipe({ id: 'fast', title: { en: 'A Puree', 'sq-AL': 'A Pure' }, ageStage: '4-6m', mealType: 'puree', totalMinutes: 8 }),
    ];

    const result = filterAndSortRecipes(recipes, {
      ageFilter: '9-12m',
      mealFilter: 'any',
      timeFilter: 'any',
      difficultyFilter: 'any',
      sortMode: 'fastest',
      searchQuery: '',
      language: 'en',
    });

    expect(result.map((item) => item.id)).toEqual(['fast', 'slow']);
  });
});

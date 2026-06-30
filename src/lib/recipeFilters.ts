import { RecipeMealType, RecipeRecord, RecipeStage } from './recipes';

export type RecipeAgeFilter = RecipeStage | 'all' | 'fav' | 'rated';
export type RecipeMealFilter = RecipeMealType | 'any';
export type RecipeTimeFilter = 'any' | 'quick' | 'medium';
export type RecipeDifficultyFilter = 'any' | 'easy' | 'med' | 'hard';
export type RecipeSortMode = 'default' | 'az' | 'fastest' | 'rated';

const AGE_ORDER: RecipeStage[] = ['4-6m', '6-8m', '9-12m', '12m+', 'family'];

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isRecipeCompatibleWithAge(recipeStage: RecipeStage, selectedStage: RecipeStage): boolean {
  if (selectedStage === 'family') {
    return recipeStage === 'family';
  }

  if (selectedStage === '4-6m') {
    return recipeStage === '4-6m';
  }

  if (selectedStage === '12m+') {
    return true;
  }

  const recipeRank = AGE_ORDER.indexOf(recipeStage);
  const selectedRank = AGE_ORDER.indexOf(selectedStage);

  return recipeRank >= 0 && selectedRank >= 0 && recipeRank <= selectedRank;
}

export function inferRecipeMealType(recipe: RecipeRecord): RecipeMealType {
  if (recipe.mealType !== 'unknown') {
    return recipe.mealType;
  }

  const text = normalizeSearchText([
    recipe.title.en,
    recipe.title['sq-AL'],
    recipe.summary.en,
    recipe.summary['sq-AL'],
    ...(recipe.ingredients.en ?? []),
  ].join(' '));

  if (/\b(oat|pancake|waffle|breakfast|mengjes|cereal|porridge)\b/.test(text)) {
    return 'breakfast';
  }

  if (/\b(snack|muffin|bites|cracker|meze)\b/.test(text)) {
    return 'snack';
  }

  if (/\b(puree|puree|purée|mash|pure)\b/.test(text)) {
    return 'puree';
  }

  if (/\b(finger|blw|fritter|patties|sticks)\b/.test(text)) {
    return 'finger-food';
  }

  if (/\b(soup|stew|pasta|curry|dinner|darke)\b/.test(text)) {
    return 'dinner';
  }

  if (/\b(lunch|dreke|salad|bowl)\b/.test(text)) {
    return 'lunch';
  }

  return 'unknown';
}

export function matchesRecipeMealFilter(recipe: RecipeRecord, mealFilter: RecipeMealFilter): boolean {
  if (mealFilter === 'any') {
    return true;
  }

  return recipe.mealType === mealFilter || inferRecipeMealType(recipe) === mealFilter;
}

export function getRecipeStepCount(recipe: RecipeRecord): number {
  return recipe.steps?.en?.length ?? recipe.steps?.['sq-AL']?.length ?? 0;
}

export function recipeMatchesSearch(recipe: RecipeRecord, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    return true;
  }

  const corpus = [
    recipe.title.en,
    recipe.title['sq-AL'],
    recipe.summary.en,
    recipe.summary['sq-AL'],
    recipe.ageStage,
    recipe.mealType,
    ...(recipe.ingredients.en ?? []),
    ...(recipe.ingredients['sq-AL'] ?? []),
    ...(recipe.steps.en ?? []),
    ...(recipe.steps['sq-AL'] ?? []),
  ].join(' ');

  return normalizeSearchText(corpus).includes(normalizedQuery);
}

export function getRecipeDurationMinutes(recipe: RecipeRecord): number | null {
  return recipe.totalMinutes ?? recipe.prepMinutes ?? recipe.cookMinutes ?? null;
}

export function filterAndSortRecipes(
  recipes: RecipeRecord[],
  options: {
    ageFilter: RecipeAgeFilter;
    mealFilter: RecipeMealFilter;
    timeFilter: RecipeTimeFilter;
    difficultyFilter: RecipeDifficultyFilter;
    sortMode: RecipeSortMode;
    favouriteIds?: Set<string>;
    ratingsMap?: Record<string, number>;
    searchQuery?: string;
    hideAllergens?: boolean;
    reactionTerms?: string[];
    language: 'sq-AL' | 'en';
  },
): RecipeRecord[] {
  const favouriteIds = options.favouriteIds ?? new Set<string>();
  const ratingsMap = options.ratingsMap ?? {};
  const reactionTerms = options.reactionTerms ?? [];

  let filtered = recipes.filter((recipe) => {
    if (options.ageFilter === 'fav' && !favouriteIds.has(recipe.id)) {
      return false;
    }

    if (options.ageFilter === 'rated' && (ratingsMap[recipe.id] ?? 0) <= 0) {
      return false;
    }

    if (
      options.ageFilter !== 'all' &&
      options.ageFilter !== 'fav' &&
      options.ageFilter !== 'rated' &&
      !isRecipeCompatibleWithAge(recipe.ageStage, options.ageFilter)
    ) {
      return false;
    }

    if (!matchesRecipeMealFilter(recipe, options.mealFilter)) {
      return false;
    }

    const duration = getRecipeDurationMinutes(recipe) ?? 999;
    if (options.timeFilter === 'quick' && duration > 15) {
      return false;
    }

    if (options.timeFilter === 'medium' && duration > 30) {
      return false;
    }

    const steps = getRecipeStepCount(recipe);
    if (options.difficultyFilter === 'easy' && (steps > 3 || steps === 0)) {
      return false;
    }

    if (options.difficultyFilter === 'med' && (steps < 4 || steps > 6)) {
      return false;
    }

    if (options.difficultyFilter === 'hard' && steps < 7) {
      return false;
    }

    if (!recipeMatchesSearch(recipe, options.searchQuery ?? '')) {
      return false;
    }

    if (options.hideAllergens && reactionTerms.length > 0) {
      const ingredients = [
        ...(recipe.ingredients['sq-AL'] ?? []),
        ...(recipe.ingredients.en ?? []),
      ].map(normalizeSearchText).join(' ');

      if (reactionTerms.some((term) => ingredients.includes(normalizeSearchText(term)))) {
        return false;
      }
    }

    return true;
  });

  if (options.sortMode === 'az') {
    filtered = [...filtered].sort((a, b) =>
      a.title[options.language].localeCompare(b.title[options.language]),
    );
  } else if (options.sortMode === 'fastest') {
    filtered = [...filtered].sort((a, b) =>
      (getRecipeDurationMinutes(a) ?? 999) - (getRecipeDurationMinutes(b) ?? 999),
    );
  } else if (options.sortMode === 'rated') {
    filtered = [...filtered].sort((a, b) => (ratingsMap[b.id] ?? 0) - (ratingsMap[a.id] ?? 0));
  }

  return filtered;
}

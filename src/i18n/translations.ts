export type AppLanguage = 'sq-AL' | 'en';

type TranslationTree = {
  common: {
    albanian: string;
    english: string;
    synced: string;
    setup: string;
    seeAll: string;
    fillInData: string;
  };
  home: {
    title: string;
    subtitle: string;
    heroTitle: string;
    heroConnected: string;
    heroMissing: string;
    heroMissingMeta: (count: number) => string;
    heroReadyMeta: string;
    mealsTitle: string;
    journalTitle: string;
    journalSubtitle: string;
    consumed: string;
    remaining: string;
    hydration: string;
    cups: string;
    learningTitle: string;
    mealPlanLabel: string;
  };
};

export const supportedLanguages: AppLanguage[] = ['sq-AL', 'en'];

export const translations: Record<AppLanguage, TranslationTree> = {
  'sq-AL': {
    common: {
      albanian: 'Shqip',
      english: 'English',
      synced: 'Sinkronizuar',
      setup: 'Konfiguro',
      seeAll: 'Shiko të gjitha',
      fillInData: 'Plotëso të dhënat',
    },
    home: {
      title: 'Plan Ushqimi🔥',
      subtitle: 'Planifikim javor i ndritshëm për receta miqësore për bebe.',
      heroTitle: 'Personalizo Planin',
      heroConnected:
        'Profili është lidhur. Mund të ruash plane vaktesh dhe shënime ditore.',
      heroMissing:
        'Për të personalizuar menunë, na duhen ende të dhënat e Firebase.',
      heroMissingMeta: (count) => `Mungojnë ${count} vlera konfigurimi`,
      heroReadyMeta: 'Ditari dhe sinkronizimi i vakteve janë gati.',
      mealsTitle: 'Drekë ose Darkë',
      journalTitle: 'Ditari',
      journalSubtitle: 'Ditët e javës',
      consumed: 'Të konsumuara',
      remaining: 'Të mbetura',
      hydration: 'Hidratimi',
      cups: 'gota',
      learningTitle: 'Mësim',
      mealPlanLabel: 'Plan Ushqimi',
    },
  },
  en: {
    common: {
      albanian: 'Albanian',
      english: 'English',
      synced: 'Synced',
      setup: 'Setup',
      seeAll: 'See all',
      fillInData: 'Fill in Data',
    },
    home: {
      title: 'Meal Plan🔥',
      subtitle: 'Bright weekly planning for baby-friendly meals.',
      heroTitle: 'Personalize Meal Plan',
      heroConnected:
        'Profile is connected. You can start saving plans and journals.',
      heroMissing:
        'To personalize your menu, we still need your Firebase details.',
      heroMissingMeta: (count) => `Missing ${count} config values`,
      heroReadyMeta: 'Journal and meal sync are ready.',
      mealsTitle: 'Lunch or Dinner',
      journalTitle: 'Journal',
      journalSubtitle: 'Week Days',
      consumed: 'Consumed',
      remaining: 'Remaining',
      hydration: 'Hydration',
      cups: 'cups',
      learningTitle: 'Learning',
      mealPlanLabel: 'Meal Plan',
    },
  },
};

export function isSupportedLanguage(value: string): value is AppLanguage {
  return supportedLanguages.includes(value as AppLanguage);
}

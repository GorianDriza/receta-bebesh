export type AppLanguage = 'sq-AL' | 'en';

type TranslationTree = {
  common: {
    albanian: string;
    english: string;
    synced: string;
    setup: string;
    seeAll: string;
    fillInData: string;
    loadingRecipes: string;
    loadingRecipesBody: string;
    recipeSyncUnavailable: string;
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
    ageFilter: string;
    todayMeals: string;
    babyTips: string;
    recipesTitle: string;
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      loginBtn: string;
      noAccount: string;
      signUpLink: string;
      forgot: string;
      resetSent: string;
      enterEmailFirst: string;
      continueGuest: string;
    };
    signup: {
      title: string;
      subtitle: string;
      name: string;
      babyName: string;
      babyBirthdate: string;
      email: string;
      password: string;
      passHelp: string;
      createBtn: string;
      hasAccount: string;
      loginLink: string;
      nameMissing: string;
      emailMissing: string;
      passMissing: string;
      continueGuest: string;
    };
    errors: {
      invalidEmail: string;
      userNotFound: string;
      wrongPassword: string;
      invalidCredential: string;
      weakPassword: string;
      emailAlreadyInUse: string;
      tooManyRequests: string;
      networkRequestFailed: string;
      fallback: string;
    };
  };
  profile: {
    title: string;
    displayName: string;
    babyName: string;
    babyBirthdate: string;
    language: string;
    ageStage: string;
    saveBtn: string;
    saving: string;
    saved: string;
    logoutBtn: string;
    logoutConfirm: string;
    logoutYes: string;
    logoutNo: string;
    email: string;
    photoPermissionTitle: string;
    photoPermissionBody: string;
    photoRebuildTitle: string;
    photoRebuildBody: (command: string) => string;
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
      seeAll: 'Shiko te gjitha',
      fillInData: 'Ploteso te dhenat',
      loadingRecipes: 'Po ngarkohen recetat...',
      loadingRecipesBody:
        'Recetat nga Firebase po futen ne planifikuesin e vakteve.',
      recipeSyncUnavailable: 'Sinkronizimi i recetave nuk eshte i disponueshem',
    },
    home: {
      title: 'Plan Ushqimi',
      subtitle: 'Planifikim javor i ndritshem per receta miqesore per bebe.',
      heroTitle: 'Personalizo Planin',
      heroConnected:
        'Profili eshte lidhur. Mund te ruash plane vaktesh dhe shenime ditore.',
      heroMissing:
        'Per te personalizuar menune, na duhen ende te dhenat e Firebase.',
      heroMissingMeta: (count) => `Mungojne ${count} vlera konfigurimi`,
      heroReadyMeta: 'Ditari dhe sinkronizimi i vakteve jane gati.',
      mealsTitle: 'Dreke ose Darke',
      journalTitle: 'Ditari',
      journalSubtitle: 'Ditet e javes',
      consumed: 'Te konsumuara',
      remaining: 'Te mbetura',
      hydration: 'Hidratimi',
      cups: 'gota',
      learningTitle: 'Mesim',
      mealPlanLabel: 'Plan Ushqimi',
      ageFilter: 'Mosha',
      todayMeals: 'Vaktet e Sotme',
      babyTips: 'Keshilla per Bebe',
      recipesTitle: 'Recetat',
    },
    auth: {
      login: {
        title: 'Mire se vini',
        subtitle: 'Hyni per te pare recetat e bebes suaj',
        email: 'Email',
        password: 'Fjalekalimi',
        loginBtn: 'Hyni',
        noAccount: 'Nuk keni llogari?',
        signUpLink: 'Regjistrohuni',
        forgot: 'Keni harruar fjalekalimin?',
        resetSent: 'Email rivendosjeje u dergua!',
        enterEmailFirst: 'Vendosni emailin e pare',
        continueGuest: 'Vazhdo si vizitor',
      },
      signup: {
        title: 'Krijoni llogarine',
        subtitle: 'Filloni te planifikoni ushqimin e bebes suaj',
        name: 'Emri juaj',
        babyName: 'Emri i bebes',
        babyBirthdate: 'Datelindja e bebes',
        email: 'Email',
        password: 'Fjalekalimi',
        passHelp: 'Minimum 6 karaktere',
        createBtn: 'Krijoni llogarine',
        hasAccount: 'Keni tashme llogari?',
        loginLink: 'Hyni',
        nameMissing: 'Vendosni emrin tuaj',
        emailMissing: 'Vendosni emailin',
        passMissing: 'Fjalekalimi min 6 karaktere',
        continueGuest: 'Vazhdo si vizitor',
      },
      errors: {
        invalidEmail: 'Email jo valid',
        userNotFound: 'Llogaria nuk ekziston',
        wrongPassword: 'Fjalekalimi gabim',
        invalidCredential: 'Email ose fjalekalim gabim',
        weakPassword: 'Fjalekalimi shume i dobet (min 6 karaktere)',
        emailAlreadyInUse: 'Email tashme i regjistruar',
        tooManyRequests: 'Shume perpjekje, provoni me vone',
        networkRequestFailed: 'Gabim rrjeti, kontrolloni lidhjen',
        fallback: 'Ndodhi nje gabim',
      },
    },
    profile: {
      title: 'Profili',
      displayName: 'Emri juaj',
      babyName: 'Emri i bebes',
      babyBirthdate: 'Datelindja e bebes',
      language: 'Gjuha',
      ageStage: 'Faza e moshes',
      saveBtn: 'Ruaj',
      saving: 'Duke ruajtur...',
      saved: 'U ruajt!',
      logoutBtn: 'Dilni',
      logoutConfirm: 'Jeni te sigurt qe doni te dilni?',
      logoutYes: 'Po, dil',
      logoutNo: 'Anulo',
      email: 'Email',
      photoPermissionTitle: 'Leje e nevojshme',
      photoPermissionBody: 'Aplikacioni ka nevoje per qasje ne fotografi.',
      photoRebuildTitle: 'Rindertim i aplikacionit',
      photoRebuildBody: (command) =>
        `Build-i i instaluar nuk perfshin modulet native te fotove. Rindertoje dhe riinstaloje aplikacionin me: ${command}`,
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
      loadingRecipes: 'Loading recipes...',
      loadingRecipesBody:
        'Firebase recipes are being pulled into the meal planner.',
      recipeSyncUnavailable: 'Recipe sync unavailable',
    },
    home: {
      title: 'Meal Plan',
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
      ageFilter: 'Age',
      todayMeals: "Today's Meals",
      babyTips: 'Baby Tips',
      recipesTitle: 'Recipes',
    },
    auth: {
      login: {
        title: 'Welcome back',
        subtitle: 'Sign in to see recipes for your baby',
        email: 'Email',
        password: 'Password',
        loginBtn: 'Sign In',
        noAccount: "Don't have an account?",
        signUpLink: 'Sign Up',
        forgot: 'Forgot your password?',
        resetSent: 'Password reset email sent!',
        enterEmailFirst: 'Enter your email first',
        continueGuest: 'Continue as guest',
      },
      signup: {
        title: 'Create account',
        subtitle: "Start planning your baby's meals",
        name: 'Your name',
        babyName: "Baby's name",
        babyBirthdate: "Baby's birthdate",
        email: 'Email',
        password: 'Password',
        passHelp: 'Minimum 6 characters',
        createBtn: 'Create Account',
        hasAccount: 'Already have an account?',
        loginLink: 'Sign In',
        nameMissing: 'Enter your name',
        emailMissing: 'Enter your email',
        passMissing: 'Password must be at least 6 characters',
        continueGuest: 'Continue as guest',
      },
      errors: {
        invalidEmail: 'Invalid email address',
        userNotFound: 'No account with this email',
        wrongPassword: 'Wrong password',
        invalidCredential: 'Invalid email or password',
        weakPassword: 'Password too weak (min 6 chars)',
        emailAlreadyInUse: 'Email already in use',
        tooManyRequests: 'Too many attempts, try later',
        networkRequestFailed: 'Network error, check connection',
        fallback: 'Something went wrong',
      },
    },
    profile: {
      title: 'Profile',
      displayName: 'Your name',
      babyName: "Baby's name",
      babyBirthdate: "Baby's birthdate",
      language: 'Language',
      ageStage: 'Age stage',
      saveBtn: 'Save',
      saving: 'Saving...',
      saved: 'Saved!',
      logoutBtn: 'Sign Out',
      logoutConfirm: 'Are you sure you want to sign out?',
      logoutYes: 'Sign Out',
      logoutNo: 'Cancel',
      email: 'Email',
      photoPermissionTitle: 'Permission required',
      photoPermissionBody: 'The app needs access to your photos.',
      photoRebuildTitle: 'App rebuild required',
      photoRebuildBody: (command) =>
        `The installed app build does not include the native photo modules yet. Rebuild and reinstall it with: ${command}`,
    },
  },
};

export function isSupportedLanguage(value: string): value is AppLanguage {
  return supportedLanguages.includes(value as AppLanguage);
}

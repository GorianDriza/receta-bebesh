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
      seeAll: 'Shiko të gjitha',
      fillInData: 'Plotëso të dhënat',
      loadingRecipes: 'Po ngarkohen recetat...',
      loadingRecipesBody: 'Po përgatisim recetat për ju.',
      recipeSyncUnavailable: 'Recetat nuk u ngarkuan',
    },
    home: {
      title: 'Plan ushqimi',
      subtitle: 'Receta të shëndetshme për bebën, sipas moshës.',
      heroTitle: 'Personalizo planin',
      heroConnected:
        'Profili është gati. Mund të ruani plane vaktesh dhe shënime ditore.',
      heroMissing:
        'Për të personalizuar menunë, plotësoni profilin e bebës.',
      heroMissingMeta: (count) => `Mungojnë ${count} të dhëna`,
      heroReadyMeta: 'Ditari dhe plani i vakteve janë gati.',
      mealsTitle: 'Drekë ose darkë',
      journalTitle: 'Ditari',
      journalSubtitle: 'Ditët e javës',
      consumed: 'Të ngrëna',
      remaining: 'Të mbetura',
      hydration: 'Hidratimi',
      cups: 'gota',
      learningTitle: 'Mëso',
      mealPlanLabel: 'Plani i vakteve',
      ageFilter: 'Mosha',
      todayMeals: 'Vaktet e sotme',
      babyTips: 'Këshilla për bebën',
      recipesTitle: 'Recetat',
    },
    auth: {
      login: {
        title: 'Mirë se erdhët',
        subtitle: 'Hyni për të ruajtur recetat dhe planin e bebës',
        email: 'Email',
        password: 'Fjalëkalimi',
        loginBtn: 'Hyni',
        noAccount: 'Nuk keni llogari?',
        signUpLink: 'Regjistrohuni',
        forgot: 'Keni harruar fjalëkalimin?',
        resetSent: 'Ju dërguam një email për të rivendosur fjalëkalimin!',
        enterEmailFirst: 'Shkruani fillimisht emailin',
        continueGuest: 'Vazhdo pa llogari',
      },
      signup: {
        title: 'Krijoni llogarinë',
        subtitle: 'Filloni të planifikoni ushqimin e bebës suaj',
        name: 'Emri juaj',
        babyName: 'Emri i bebës',
        babyBirthdate: 'Datëlindja e bebës',
        email: 'Email',
        password: 'Fjalëkalimi',
        passHelp: 'Të paktën 6 karaktere',
        createBtn: 'Krijo llogarinë',
        hasAccount: 'Keni tashmë llogari?',
        loginLink: 'Hyni',
        nameMissing: 'Shkruani emrin tuaj',
        emailMissing: 'Shkruani emailin',
        passMissing: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere',
        continueGuest: 'Vazhdo pa llogari',
      },
      errors: {
        invalidEmail: 'Email-i nuk është i vlefshëm',
        userNotFound: 'Nuk ka llogari me këtë email',
        wrongPassword: 'Fjalëkalim i gabuar',
        invalidCredential: 'Email ose fjalëkalim i gabuar',
        weakPassword: 'Fjalëkalimi është shumë i dobët (min. 6 karaktere)',
        emailAlreadyInUse: 'Ky email është i regjistruar tashmë',
        tooManyRequests: 'Shumë përpjekje. Provoni pak më vonë',
        networkRequestFailed: 'Gabim lidhjeje. Kontrolloni internetin',
        fallback: 'Diçka shkoi keq. Provoni përsëri',
      },
    },
    profile: {
      title: 'Profili',
      displayName: 'Emri juaj',
      babyName: 'Emri i bebës',
      babyBirthdate: 'Datëlindja e bebës',
      language: 'Gjuha',
      ageStage: 'Mosha',
      saveBtn: 'Ruaj',
      saving: 'Duke ruajtur...',
      saved: 'U ruajt!',
      logoutBtn: 'Dilni',
      logoutConfirm: 'Jeni të sigurt që doni të dilni?',
      logoutYes: 'Po, dil',
      logoutNo: 'Anulo',
      email: 'Email',
      photoPermissionTitle: 'Nevojitet leje',
      photoPermissionBody: 'Aplikacioni ka nevojë për qasje në fotot tuaja.',
      photoRebuildTitle: 'Nevojitet përditësim',
      photoRebuildBody: (command) =>
        `Ky version i aplikacionit nuk mbështet ende fotot. Rindërtoni aplikacionin me: ${command}`,
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
        'Getting recipes ready for you.',
      recipeSyncUnavailable: "Couldn't load recipes",
    },
    home: {
      title: 'Meal Plan',
      subtitle: 'Healthy, age-matched recipes for your baby.',
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

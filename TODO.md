# TODO

## Current UI

- [x] Build 3-screen tab navigation (Meal Plan / Journal / Learning).
- [x] Match pastel meal-planner reference design for all 3 screens.
- [x] Floating bottom navigation — labels on active tab, fixed icon names.
- [x] Responsive layout — uses flex, no fixed widths.
- [x] App icon updated (1254×1254 PNG — icon, splash, android foreground, favicon).
- [x] Animated splash screen (logo fade-in + spring, 2.5 s total).
- [x] Remove all hardcoded recipe data; show real Firebase recipes.
- [x] Show source image on recipe cards (falls back to emoji when no URL).
- [x] Tap recipe card → full-screen article modal (image, ingredients, steps, source link).
- [ ] Replace emoji plates with real recipe photos from Firebase Storage (needs paid plan or direct URL mirror).
- [ ] Add loading skeleton / empty / error states for all remote data.
- [x] Add age-stage filter chips to Meal Plan screen (All / 4-6m / 6-8m / 9-12m / 12m+ / Saved).
- [x] Default filter auto-set from baby's age stage (profile birthdate).
- [x] Add search bar to Meal Plan screen (client-side title search).

## Authentication

- [x] Add Firebase Authentication (email/password sign-in).
- [x] Create sign-up screen (name, email, password, baby's name + birthdate).
- [x] Create login screen (with forgot-password email reset).
- [x] Gate app behind auth — unauthenticated users see login/sign-up.
- [ ] Google sign-in (requires EAS dev build + native Google SDK setup).
- [ ] Persist auth state across app restarts (Firebase JS SDK v12 lacks `getReactNativePersistence`; currently in-memory only).

## User Profile

- [x] Profile modal accessible via avatar button in MealPlan header.
- [x] Store user data in Firebase Realtime Database: `users/<uid>`.
  - `displayName`, `email`, `babyName`, `babyBirthdate`, `language`
- [x] Show baby's name + age in MealPlan header when profile is set.
- [x] Compute baby's current age stage automatically from birthdate.
- [x] Edit profile (display name, baby name, birthdate) in profile modal.
- [x] Language switcher moved from MealPlan header to profile modal.
- [x] Initials avatar (teal circle with letters).

## Favourites & Meal Planner

- [x] Save favourite recipes per user (`users/<uid>/favourites/<recipeId>`).
- [x] Heart button on recipe cards — toggles saved (filled red ♥ when saved).
- [x] Filter chip "♡ Saved" shows only favourited recipes.
- [ ] Weekly meal planner: assign recipes to days / meal types.
- [ ] Persist planner data to Firebase per user.

## Firebase

- [x] iOS Firebase config file `GoogleService-Info.plist` present in repo root.
- [x] `app.config.js` wired to resolve `GoogleService-Info.plist` for iOS.
- [ ] Enable Firebase Authentication in Firebase console.
- [ ] Add Firestore (or keep Realtime DB) security rules — currently open.
- [ ] Verify Android and iOS Firebase apps point to the same backend project.

## Localization

- [x] Albanian (`sq-AL`) is the default app language.
- [x] English as a user-selectable language via chip switcher.
- [x] Translation structure defined for UI copy, recipe fields, categories, and age labels.
- [ ] Add auth screen strings to translations (sign-up, log-in, errors).
- [ ] Add profile screen strings to translations.
- [ ] Add language switcher in profile screen (remove from home header).

## Recipe Import Pipeline

- [x] Scraper built: `scripts/import-babyfoode.js`.
  - [x] Pagination pages (`/page/2/` … `/page/10/`) — 49 recipes imported.
  - [x] Extracts title, age stage, prep/cook/total time, ingredients, steps, image URL.
  - [x] Translates English → Albanian with Gemini (machine translation).
  - [x] Saves to Firebase with both languages.
  - [x] Source attribution stored.
  - [x] Deduplication: upsert by slug.
  - [x] Gemini 429 handled with exponential backoff + 4 s throttle.
- [ ] Confirm scraping is acceptable for the target pages before bulk import.
- [ ] Run full import: `npm run import:babyfoode -- --limit=200`.
- [ ] Mirror images to Firebase Storage (requires paid Blaze plan or self-hosted proxy).

## Data Model

- [x] Recipe schema stable in `src/lib/recipes.ts`.
- [x] Translation status flag (`pending` / `machine` / `reviewed`).
- [ ] User schema: `id`, `email`, `displayName`, `babyName`, `babyBirthdate`, `language`, `favourites`.
- [ ] Meal-planner schema: `users/<uid>/planner/<week>/<day>/<mealType>` → `recipeId`.

## Notifications (future)

- [ ] Daily meal-plan reminder push notification.
- [ ] "New recipe added" notification for subscribed users.

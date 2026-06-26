# Receta Bebesh — Feature Roadmap

---

## New Features (roadmap)

### Implemented this sprint
- [x] Profile photo upload (avatar tap → gallery → compress → Firebase RTDB)
- [x] Recipe card stagger entrance animations (react-native-reanimated v4 FadeInDown)
- [x] Local push notifications — daily meal reminders at 12:00 & 17:30
- [x] Hero card redesign (no more Firebase console link, personalized per user state)
- [x] Guest mode — app opens without forced login
- [x] DatePicker for baby birthdate (inline iOS spinner, native Android dialog)
- [x] SafeAreaView inside Modal (fixes notch/back-button on iPhone 13 Pro Max)
- [x] Persistent login session + instant profile cache (AsyncStorage)
- [x] Login redirect for guest actions (heart, +, planner slots)

### Short-term (next sessions)
- [x] **Baby food intro tracker** — checklist of foods baby has tried; mark allergies / reactions; filter recipes by "already introduced" ingredients
- [x] **Shopping list** — tap ingredient to add; "Add all" button; dedicated view with checkboxes and "clear checked" action; accessible from recipe detail and main header
- [x] **Cooking mode** — full-screen step-by-step; large text; `expo-keep-awake` keeps screen on while cooking
- [x] **Personal recipe notes + star rating** — 1-5 stars + free-text note per recipe per user; shown on card
- [x] **Baby growth milestones banner** — age-aware callout ("At 6m: start purees!") that rotates weekly

### Mid-term
- [x] **Meal history / cook log** — Journal tab shows today's planned meals; ○ toggle marks each meal as cooked
- [x] **Recipe sharing** — share recipe via system sheet (title + source URL)
- [x] **Offline mode** — cache recipes in AsyncStorage; "Loaded from cache" indicator
- [x] **Allergy-aware filter** — food tracker marks reactions; "🚫 Hide allergens" chip filters recipes
- [ ] **Meal history calendar** — calendar heat-map view; streak counter
- [ ] **Multiple baby profiles** — support for siblings; switcher in header
- [ ] **Nutrition info display** — calories / protein / iron / vitamin per recipe
- [ ] **Community meal photos** — users submit their prepared-meal photo; carousel on recipe detail

### Long-term / Nice-to-have
- [ ] **Weight & height tracker** — log measurements; chart with `react-native-svg`
- [ ] **AI weekly plan** — Gemini generates 7-day plan from age + favourites
- [ ] **Voice step-by-step** — read recipe aloud in Albanian or English via TTS
- [ ] **Apple / Google Sign-In** — needs EAS dev build (`eas build --profile development`)
- [ ] **Firebase Storage photos** — upgrade to Blaze; full-res avatars + recipe images in Cloud Storage
- [ ] **Remote push notifications** — EAS build + FCM; "new recipe added" alerts

---

# TODO (original)

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
- [x] Quick Ideas tab (Spark): 3 random recipes from baby's age stage, shuffle button.
- [x] Journal tab: shows today's planner entries (recipe title + image grid).
- [x] Learning tab: 6 baby-food bilingual cards with topic filter chips.
- [x] Loading skeletons (RecipeCardSkeleton, SlotSkeleton) — animated pulse in MealPlan, Planner, Quick tabs.
- [x] Splash covers auth hydration — no flicker on app start.
- [x] Add age-stage filter chips to Meal Plan screen (All / 4-6m / 6-8m / 9-12m / 12m+ / Saved).
- [x] Default filter auto-set from baby's age stage (profile birthdate).
- [x] Add search bar to Meal Plan screen (client-side title search).

## Authentication

- [x] Add Firebase Authentication (email/password sign-in).
- [x] Create sign-up screen (name, email, password, baby's name + birthdate).
- [x] Create login screen (with forgot-password email reset).
- [x] Gate app behind auth — unauthenticated users see login/sign-up.
- [ ] Google sign-in (requires EAS dev build + native Google SDK setup).
- [x] Persist auth state across app restarts (custom AsyncStorage Persistence object — bypasses removed `getReactNativePersistence` in v12).

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
- [x] Weekly meal planner: assign recipes to days / meal types (Planner tab).
- [x] Week navigation (← / → week), day selector with activity dots.
- [x] Recipe picker modal with search (assigns to breakfast/lunch/dinner/snack slot).
- [x] Persist planner data to Firebase: `users/<uid>/planner/<weekKey>/<day>/<meal>`.
- [x] Remove recipe from slot (× button).
- [x] "Add to Plan" button in recipe detail modal.
- [x] "+" quick-add button on recipe cards (opens day/meal picker).
- [x] Shared `PlannerPickerSheet` component reused in both modal and card.

## Firebase

- [x] iOS Firebase config file `GoogleService-Info.plist` present in repo root.
- [x] `app.config.js` wired to resolve `GoogleService-Info.plist` for iOS.
- [ ] Enable Firebase Authentication in Firebase console.
- [x] Wrote `database.rules.json` — apply in Firebase console → Realtime Database → Rules.
  - `recipes`: public read, authenticated write
  - `users/$uid`: read/write only by that uid
- [ ] Verify Android and iOS Firebase apps point to the same backend project.

## Localization

- [x] Albanian (`sq-AL`) is the default app language.
- [x] English as a user-selectable language via chip switcher.
- [x] Translation structure defined for UI copy, recipe fields, categories, and age labels.
- [x] Add auth screen strings to translations (sign-up, log-in, errors).
- [x] Add profile screen strings to translations.
- [x] Add language switcher in profile screen (remove from home header).

## Recipe Import Pipeline

- [x] Scraper built: `scripts/import-babyfoode.js`.
  - [x] Pagination pages (`/page/2/` … `/page/10/`) — 100+ recipes imported.
  - [x] Extracts title, age stage, prep/cook/total time, ingredients, steps, image URL.
  - [x] Translates English → Albanian with Gemini (machine translation).
  - [x] Saves to Firebase with both languages.
  - [x] Source attribution stored.
  - [x] Deduplication: upsert by slug.
  - [x] Gemini 429 handled with exponential backoff + 4 s throttle.
- [ ] Confirm scraping is acceptable for the target pages before bulk import.
- [x] Run initial import: `npm run import:babyfoode -- --limit=100` (completed).
- [ ] Run larger import: `npm run import:babyfoode -- --limit=200` for more content.
- [ ] Mirror images to Firebase Storage (requires paid Blaze plan or self-hosted proxy).

## Data Model

- [x] Recipe schema stable in `src/lib/recipes.ts`.
- [x] Translation status flag (`pending` / `machine` / `reviewed`).
- [x] User schema: `src/lib/users.ts` — `uid`, `displayName`, `email`, `babyName`, `babyBirthdate`, `language`, `createdAt`, `updatedAt`.
- [x] Favourites schema: `users/<uid>/favourites/<recipeId>` → timestamp.
- [x] Meal-planner schema: `users/<uid>/planner/<weekKey>/<day>/<meal>` → `PlannerEntry`.

## Notifications (future)

- [x] Daily meal-plan reminder push notification.
- [ ] "New recipe added" notification for subscribed users.

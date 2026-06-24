# TODO

## Current UI

- [x] Build 3-screen tab navigation (Meal Plan / Journal / Learning).
- [x] Match pastel meal-planner reference design for all 3 screens.
- [x] Floating bottom navigation consistent across screens.
- [x] Responsive layout — uses flex, no fixed widths.
- [x] App icon updated (1254×1254 PNG — icon, splash, android foreground, favicon).
- [ ] Replace emoji plates with real recipe photos from Firebase Storage.
- [ ] Add loading skeleton / empty / error states for all remote data.

## Firebase

- [x] iOS Firebase config file `GoogleService-Info.plist` present in repo root.
- [x] `app.config.js` wired to resolve `GoogleService-Info.plist` for iOS.
- [ ] Verify Android and iOS Firebase apps point to the same backend project.
- [ ] Decide whether recipe storage stays in Firebase Realtime Database or moves to Firestore (current: Realtime Database).

## Localization

- [x] Albanian (`sq-AL`) is the default app language.
- [x] English as a user-selectable language via chip switcher.
- [x] Translation structure defined for UI copy, recipe fields, categories, and age labels.
- [ ] Add a language switcher in settings or profile flow (currently on home header).

## Recipe Import Pipeline

- [x] Scraper built: `scripts/import-babyfoode.js`.
  - [x] Fetches recipe index from `https://babyfoode.com/`.
  - [x] Follows individual recipe links (homepage-discovered links only for now).
  - [x] Extracts: source URL, title, category, age/stage, prep time, cook time, total time, ingredients, instructions, image URL.
  - [x] Normalises into Firebase-friendly schema.
  - [x] Translates English → Albanian with Gemini (machine translation; `GEMINI_API_KEY` required).
  - [x] Saves to Firebase Realtime Database under `recipes/<slug>`.
  - [x] Stores source attribution (`source.siteName`, `source.url`, `source.scrapedAt`).
  - [x] Mirrors recipe images to Firebase Storage when admin credentials are available.
  - [x] Deduplication: upsert by slug so re-running updates rather than duplicates.
- [x] Expanded scraper to crawl pagination pages (`/page/2/` … `/page/10/`) — 49 recipes imported to Firebase.
- [x] Gemini 429 rate-limit handled with exponential backoff (5s → 10s → 20s) and per-call 4s throttle.
- [ ] Confirm scraping is acceptable for the target pages before bulk import.

## Data Model

- [x] Stable recipe schema defined in `src/lib/recipes.ts`:
  - `id`, `slug`, `languages`, `ageStage`, `mealType`
  - `title`, `summary`, `ingredients`, `steps` (all localised)
  - `image`, `source`, `translation`
  - `prepMinutes`, `cookMinutes`, `totalMinutes`
  - `createdAt`, `updatedAt`
- [x] Editorial metadata (`source`, `translation`) separated from translated content.
- [x] Translation status flag (`pending` / `machine` / `reviewed`).
- [ ] Add flag for manually reviewed translations in admin flow.

## App Features After Import

- [ ] Replace hardcoded sample recipes with Firebase-backed recipe reads (filter by age + meal type).
- [ ] Filter recipes by age, meal type, and language in the Meal Plan screen.
- [ ] Loading, empty, and error states for remote recipe data.
- [ ] Basic admin/import workflow so new scraped recipes can be reviewed before publishing.

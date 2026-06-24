# TODO

## Current UI

- [ ] Finish the home screen implementation based on the provided pastel meal-planner reference.
- [ ] Make the new home screen responsive on both narrow phones and larger devices.
- [ ] Keep the floating bottom navigation and section cards visually consistent across Android and iOS.

## Firebase

- [ ] Add the iOS Firebase config file: `GoogleService-Info.plist`.
- [ ] Update `app.json` with `ios.googleServicesFile` once the plist is available in the repo.
- [ ] Verify both Android and iOS Firebase apps point to the same backend project and database.
- [ ] Decide whether recipe storage stays in Firebase Realtime Database or moves to Firestore. Current code is wired for Realtime Database.

## Localization

- [ ] Set Albanian (`sq-AL`) as the default app language.
- [ ] Add English as a user-selectable language.
- [ ] Define a translation structure for UI copy, recipe fields, categories, and age labels.
- [ ] Add a language switcher in settings or profile flow.

## Recipe Import Pipeline

- [ ] Review the structure of `https://babyfoode.com/` and map the recipe sources to import:
  - Recipe index
  - Age/stage categories
  - Individual recipe pages
- [ ] Confirm scraping is acceptable for the target pages before bulk import.
- [ ] Build a scraper/import script that collects at least:
  - Source URL
  - Title
  - Category
  - Age/stage
  - Prep time
  - Ingredients
  - Instructions
  - Image URL
- [ ] Normalize the imported recipe data into one Firebase-friendly schema.
- [ ] Translate imported recipe content from English to Albanian before saving.
- [ ] Save imported recipes into Firebase with both languages available:
  - `title.en`, `title.sq`
  - `description.en`, `description.sq`
  - `ingredients.en`, `ingredients.sq`
  - `steps.en`, `steps.sq`
- [ ] Store source attribution for every imported recipe so the original page can be traced later.
- [ ] Add deduplication so rerunning the scraper updates existing recipes instead of duplicating them.

## Data Model

- [ ] Define a stable recipe schema in Firebase:
  - `id`
  - `slug`
  - `languages`
  - `ageStage`
  - `mealType`
  - `ingredients`
  - `steps`
  - `image`
  - `source`
  - `createdAt`
  - `updatedAt`
- [ ] Separate editorial metadata from translated content.
- [ ] Add a flag for manually reviewed translations.

## App Features After Import

- [ ] Replace the hardcoded sample recipes with Firebase-backed recipe reads.
- [ ] Filter recipes by age, meal type, and language.
- [ ] Add loading, empty, and error states for remote recipe data.
- [ ] Add a basic admin/import workflow so new scraped recipes can be reviewed before publishing in the app.

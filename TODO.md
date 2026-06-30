# Receta Bebesh — Feature Roadmap

---

## New Features (roadmap)

### DONE
- [x] Script for scraping recipes needs improvement and to have more urls for scraping
  - Added `mjandhungryman.com` as second source (`--source=mjandhungryman`)
  - Candidate scan multiplier increased (30×) to find recipes past already-imported ones
  - Google Translate retries 3× with exponential backoff before failing
  - Gemini fallback when Google Translate fails
  - `--backfill-nutrition` flag to patch all existing recipes
- [x] Filter in the app is not correct
  - Replaced legacy inline filter with `filterAndSortRecipes` from `recipeFilters.ts`
  - Added missing `family` age filter chip
  - Age filter is now cumulative (6-8m shows 4-6m + 6-8m recipes)
- [x] Vlerat ushqyese nuk janë të disponueshme
  - Import script estimates nutrition (kcal, protein, carbs, fat, fiber) via Gemini from ingredients
  - Backfill script patches all 210 existing recipes with estimated nutrition
  - RecipeDetailModal already renders the `nutrition` field when present
- [x] Ditari is not calculated
  - Journal loads recipes from cache, matches today's cooked meal IDs, sums nutrition
  - Shows real kcal + macros when meals marked cooked; updates live on mark/unmark

- [x] Scraping data do not have properly formatted ingredients or instructions
  - `htmlDecode` now covers all named entities + decimal/hex numeric entities
  - `normalizeListText` strips "Step 1:", "1. ", "(1) " and bullet variants before storing
- [x] Add more learning
  - Added 5 new cards: allergen timeline, texture progression by age, iron-rich foods, meal frequency by age, healthy fats for brain development
- [x] Option to scan a food image and get recipe suggestions
- [x] Scan food image and calculate the ingredients needed for the recipe
- [x] Scan food image and calculate the calories needed for the recipe
  - `FoodScanModal` (📷 button in QuickContent header) — image picker + Gemini Vision → detected food, ingredients list, nutrition estimate (kcal/protein/carbs/fat/fiber), top 4 matching recipes (tappable → detail modal)

### TODO
- [] Check the scraped data for quality and accuracy
- [] Add option to save recipes. Use camera to scan the recipe and save it automatically. Also add option to edit and delete saved recipes and show to all users.

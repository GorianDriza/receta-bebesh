# BabyFoode Import

The importer scans BabyFoode sitemaps first, then paginated recipe index pages, and writes normalized recipe records to Firebase.

## Commands

```powershell
npm run import:babyfoode -- --limit=12
```

Use a dry run to verify scraping without Firebase writes:

```powershell
$env:TRANSLATE_PROVIDER='none'; npm run import:babyfoode -- --limit=5 --dry-run
```

## Options

- `--limit=12` controls how many valid recipes are imported.
- `--pages=30` controls how many `/recipes/page/N/` index pages are scanned after sitemaps.
- `--source-url=https://babyfoode.com/example/` adds one explicit recipe URL; repeat it for multiple URLs.
- `--source-file=urls.txt` reads one URL per line, with `#` comments allowed.
- `--dry-run` parses recipes and skips Firebase writes.

## Environment

- `TRANSLATE_PROVIDER=google|gemini|none` controls Albanian translation.
- `BABYFOODE_SOURCE_URLS=` can provide comma-separated explicit source URLs.
- Firebase `EXPO_PUBLIC_FIREBASE_*` values are required only when writing imported recipes.

## Re-translate existing recipes

Writes go through the Admin SDK (`firebase-service-account.json`, or set `FIREBASE_SERVICE_ACCOUNT`), because database rules block client writes to `recipes/`.

```bash
node scripts/import-babyfoode.js --retranslate --dry-run --limit=3   # preview
node scripts/import-babyfoode.js --retranslate                       # all recipes, resumable
```

Recipes keep their ids, so favourites, planner entries and ratings stay valid. Recipes already translated by the current `GEMINI_MODEL` are skipped; add `--force` to redo them.

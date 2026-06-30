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

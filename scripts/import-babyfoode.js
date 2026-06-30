const fs = require('fs');
const path = require('path');
const { initializeApp, getApp, getApps } = require('firebase/app');
const { get, getDatabase, goOffline, ref, update } = require('firebase/database');

const FIREBASE_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const DEFAULT_SOURCE_KEY = 'babyfoode';
const DEFAULT_IMPORT_LIMIT = 12;
const DEFAULT_DISCOVERY_PAGE_COUNT = 30;
const DEFAULT_CANDIDATE_MULTIPLIER = 30;
const MAX_SITEMAPS_TO_SCAN = 12;

const SOURCE_CONFIGS = {
  babyfoode: {
    key: 'babyfoode',
    siteName: 'babyfoode.com',
    root: 'https://babyfoode.com',
    envKey: 'BABYFOODE_SOURCE_URLS',
    recipeIndexPaths: ['recipes'],
    sitemapPaths: ['sitemap_index.xml', 'post-sitemap.xml'],
  },
  mjandhungryman: {
    key: 'mjandhungryman',
    siteName: 'mjandhungryman.com',
    root: 'https://www.mjandhungryman.com',
    envKey: 'MJANDHUNGRYMAN_SOURCE_URLS',
    recipeIndexPaths: [
      'recipe-index',
      'category/baby-kid-friendly-recipes/breakfastbrunch',
      'category/baby-kid-friendly-recipes/snacksbaking',
      'category/baby-kid-friendly-recipes/main-meals',
      'category/baby-kid-friendly-recipes/lunchbox',
      'category/baby-kid-friendly-recipes/dips-sauces',
      'category/baby-kid-friendly-recipes/vegetarian',
      'category/how-to-series',
    ],
    sitemapPaths: ['sitemap_index.xml', 'post-sitemap.xml'],
  },
};

// TRANSLATE_PROVIDER: 'google' (default, free) | 'gemini' | 'none'
const TRANSLATE_PROVIDER = process.env.TRANSLATE_PROVIDER || 'google';
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const HTTP_TIMEOUT_MS = 30000;
const DATABASE_TIMEOUT_MS = 45000;
function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requireFirebaseEnv() {
  const missingKeys = FIREBASE_KEYS.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase environment values: ${missingKeys.join(', ')}`,
    );
  }
}

function getFirebaseApp() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  return getApps().length > 0 ? getApp() : initializeApp(config);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function htmlDecode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '-')
    .replace(/&hellip;/g, '...')
    // catch any remaining decimal/hex numeric entities
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function unique(values) {
  return [...new Set(values)];
}

function getSourceConfig(sourceKey = DEFAULT_SOURCE_KEY) {
  const normalizedKey = String(sourceKey || DEFAULT_SOURCE_KEY).toLowerCase();
  const source = SOURCE_CONFIGS[normalizedKey];

  if (!source) {
    throw new Error(
      `Unknown source "${sourceKey}". Supported sources: ${Object.keys(SOURCE_CONFIGS).join(', ')}`,
    );
  }

  return {
    ...source,
    sitemapUrls: source.sitemapPaths.map((sitemapPath) => {
      try {
        return new URL(sitemapPath, `${source.root}/`).href;
      } catch {
        return `${source.root}/${sitemapPath.replace(/^\/+/, '')}`;
      }
    }),
  };
}

// ── Google Translate (free, no API key) ─────────────────────────────────────

async function googleTranslateChunk(text, attempt = 0) {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: 'sq',
    dt: 't',
    q: text,
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`, {
      headers: { 'user-agent': 'Mozilla/5.0' },
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = new Error(`Google Translate HTTP ${response.status}`);
      if (attempt < 3) {
        await sleep(1000 * Math.pow(2, attempt));
        return googleTranslateChunk(text, attempt + 1);
      }
      throw err;
    }
    const data = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('Unexpected response');
    return data[0].filter(Boolean).map((item) => item[0] || '').join('');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function googleTranslateText(text) {
  if (!text || !text.trim()) return text;
  const MAX = 1500; // safe URL length per chunk
  if (text.length <= MAX) return googleTranslateChunk(text);

  // Split on newlines, reassemble into ≤MAX chunks
  const lines = text.split('\n');
  const chunks = [];
  let cur = '';
  for (const line of lines) {
    const next = cur ? `${cur}\n${line}` : line;
    if (next.length > MAX && cur) { chunks.push(cur); cur = line; }
    else cur = next;
  }
  if (cur) chunks.push(cur);

  const results = [];
  for (const chunk of chunks) {
    results.push(await googleTranslateChunk(chunk));
    await sleep(400);
  }
  return results.join('\n');
}

async function translateRecipeWithGoogle(recipe) {
  await sleep(600);
  try {
    const titleSq   = await googleTranslateText(recipe.title.en);   await sleep(300);
    const summarySq = await googleTranslateText(recipe.summary.en); await sleep(300);

    const ingText   = recipe.ingredients.en.map((v, i) => `${i + 1}. ${v}`).join('\n');
    const ingSq     = await googleTranslateText(ingText);            await sleep(300);
    const stepText  = recipe.steps.en.map((v, i) => `${i + 1}. ${v}`).join('\n');
    const stepSq    = await googleTranslateText(stepText);

    function parseList(raw) {
      return raw.split('\n').map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    }

    return {
      ...recipe,
      title:       createLocalizedText(recipe.title.en, titleSq || recipe.title.en),
      summary:     createLocalizedText(recipe.summary.en, summarySq || recipe.summary.en),
      ingredients: createLocalizedTextList(recipe.ingredients.en, parseList(ingSq)),
      steps:       createLocalizedTextList(recipe.steps.en, parseList(stepSq)),
      translation: { status: 'machine', provider: 'google-translate-free', reviewedBy: null },
      updatedAt:   new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Google Translate failed for "${recipe.title.en}": ${err.message}`);
  }
}

// ── Gemini (optional fallback, set TRANSLATE_PROVIDER=gemini) ────────────────

function extractGeminiText(payload) {
  // Standard Gemini generateContent response
  if (payload?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return payload.candidates[0].content.parts[0].text;
  }
  // Older/alternate format
  if (Array.isArray(payload?.steps)) {
    for (const step of payload.steps) {
      if (!Array.isArray(step.content)) continue;
      const text = step.content
        .filter((item) => item?.type === 'text' && typeof item.text === 'string')
        .map((item) => item.text)
        .join('\n')
        .trim();
      if (text) return text;
    }
  }
  return null;
}

function extractJsonObject(text) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

function stripHtml(value) {
  return htmlDecode(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function normalizeListText(value) {
  return stripHtml(String(value))
    .replace(/^[\s•*\-–—▪▸►]+/, '')     // leading bullet characters
    .replace(/^step\s+\d+\s*[:\-–]?\s*/i, '') // "Step 1:" / "Step 2 -"
    .replace(/^\d+[.)]\s+/, '')           // "1. " or "1) "
    .replace(/^\(\d+\)\s*/, '')           // "(1) "
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJsonLdRecipes(html) {
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const recipes = [];

  for (const match of matches) {
    const raw = match[1].trim();

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      collectRecipeNodes(parsed, recipes);
    } catch {
      continue;
    }
  }

  return recipes;
}

function collectRecipeNodes(node, recipes) {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectRecipeNodes(item, recipes));
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  const type = node['@type'];

  if (
    type === 'Recipe' ||
    (Array.isArray(type) && type.includes('Recipe'))
  ) {
    recipes.push(node);
  }

  if (Array.isArray(node['@graph'])) {
    collectRecipeNodes(node['@graph'], recipes);
  }
}

function extractSitemapLocations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map((match) => htmlDecode(match[1].trim()))
    .filter(Boolean);
}

function durationToMinutes(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const hours = value.match(/(\d+)H/i);
  const minutes = value.match(/(\d+)M/i);

  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function normalizeInstructionSteps(instructions) {
  if (!instructions) {
    return [];
  }

  if (Array.isArray(instructions)) {
    return instructions.flatMap((item) => normalizeInstructionSteps(item));
  }

  if (typeof instructions === 'string') {
    const text = normalizeListText(instructions);
    return text ? [text] : [];
  }

  if (typeof instructions !== 'object') {
    return [];
  }

  if (instructions.itemListElement) {
    return normalizeInstructionSteps(instructions.itemListElement);
  }

  const text = typeof instructions.text === 'string'
    ? instructions.text
    : typeof instructions.name === 'string'
      ? instructions.name
      : null;

  return text ? normalizeInstructionSteps(text) : [];
}

function parseNutritionNumber(value) {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value)
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function normalizeNutrition(nutritionNode) {
  if (!nutritionNode || typeof nutritionNode !== 'object') {
    return undefined;
  }

  const nutrition = {
    kcal: parseNutritionNumber(nutritionNode.calories),
    proteinG: parseNutritionNumber(nutritionNode.proteinContent),
    carbsG: parseNutritionNumber(
      nutritionNode.carbohydrateContent || nutritionNode.carbsContent,
    ),
    fatG: parseNutritionNumber(nutritionNode.fatContent),
    fiberG: parseNutritionNumber(nutritionNode.fiberContent),
    ironMg: parseNutritionNumber(nutritionNode.ironContent),
    calciumMg: parseNutritionNumber(nutritionNode.calciumContent),
    vitaminCMg: parseNutritionNumber(nutritionNode.vitaminCContent),
  };

  const entries = Object.entries(nutrition)
    .filter(([, value]) => value !== undefined);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function guessAgeStage(title, summary, categories) {
  const corpus = `${title} ${summary} ${categories.join(' ')}`.toLowerCase();

  if (corpus.includes('4 month') || corpus.includes('4-6')) {
    return '4-6m';
  }

  if (corpus.includes('6 month') || corpus.includes('6+')) {
    return '6-8m';
  }

  if (corpus.includes('9 month') || corpus.includes('finger food')) {
    return '9-12m';
  }

  if (corpus.includes('toddler') || corpus.includes('family')) {
    return '12m+';
  }

  return 'family';
}

function guessMealType(title, categories) {
  const corpus = `${title} ${categories.join(' ')}`.toLowerCase();

  if (corpus.includes('breakfast') || corpus.includes('oat')) {
    return 'breakfast';
  }

  if (corpus.includes('lunch')) {
    return 'lunch';
  }

  if (corpus.includes('dinner')) {
    return 'dinner';
  }

  if (corpus.includes('snack') || corpus.includes('muffin')) {
    return 'snack';
  }

  if (corpus.includes('puree')) {
    return 'puree';
  }

  if (corpus.includes('finger food')) {
    return 'finger-food';
  }

  if (corpus.includes('batch')) {
    return 'batch-prep';
  }

  return 'unknown';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fallbackAlbanianText(englishText) {
  return englishText;
}

function createLocalizedText(englishText, albanianText) {
  return {
    en: englishText,
    'sq-AL': albanianText || fallbackAlbanianText(englishText),
  };
}

function createLocalizedTextList(englishValues, albanianValues) {
  return {
    en: englishValues,
    'sq-AL': albanianValues && albanianValues.length > 0
      ? albanianValues
      : englishValues,
  };
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, HTTP_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(url, {
      headers: {
        'user-agent': 'receta-bebesh-importer/1.0',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function createRecipeIndexPages(pageCount = DEFAULT_DISCOVERY_PAGE_COUNT, source = getSourceConfig()) {
  const safePageCount = Math.max(1, Math.floor(Number(pageCount) || 1));
  const pages = [];

  for (const pathName of source.recipeIndexPaths) {
    const baseUrl = `${source.root}/${pathName.replace(/^\/+|\/+$/g, '')}/`;
    pages.push(baseUrl);

    for (let page = 2; page <= safePageCount; page++) {
      pages.push(`${baseUrl}page/${page}/`);
    }
  }

  return pages;
}

async function callGeminiWithRetry(apiKey, model, body, maxRetries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  let attempt = 0;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (response.status === 429) {
      attempt++;
      if (attempt > maxRetries) throw new Error(`Gemini 429 after ${maxRetries} retries`);
      const waitMs = Math.min(60000, 5000 * Math.pow(2, attempt));
      console.log(`  Gemini rate limited — waiting ${waitMs / 1000}s...`);
      await sleep(waitMs);
      continue;
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${text}`);
    }
    return response.json();
  }
}

async function translateRecipeWithGemini(recipe) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const model  = process.env.GEMINI_MODEL || process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-lite';
  if (!apiKey) return recipe;

  await sleep(4000); // 15 RPM free tier

  let payload;
  try {
    payload = await callGeminiWithRetry(apiKey, model, {
      contents: [{
        parts: [{
          text: `Translate this recipe from English to Albanian. Return valid JSON only with keys: title, summary, ingredients (array), steps (array). Preserve meaning and units.\n\n${JSON.stringify({
            title: recipe.title.en,
            summary: recipe.summary.en,
            ingredients: recipe.ingredients.en,
            steps: recipe.steps.en,
          })}`,
        }],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    });
  } catch (err) {
    console.warn(`  Gemini skipped for "${recipe.title.en}": ${err.message}`);
    return recipe;
  }

  const outputText = extractGeminiText(payload);
  if (!outputText) {
    console.warn(`  Gemini returned no text for "${recipe.title.en}"`);
    return recipe;
  }

  let translated;
  try {
    translated = JSON.parse(extractJsonObject(outputText));
  } catch {
    console.warn(`  Gemini JSON parse failed for "${recipe.title.en}"`);
    return recipe;
  }

  return {
    ...recipe,
    title:       createLocalizedText(recipe.title.en, translated.title || recipe.title.en),
    summary:     createLocalizedText(recipe.summary.en, translated.summary || recipe.summary.en),
    ingredients: createLocalizedTextList(recipe.ingredients.en,
      Array.isArray(translated.ingredients) ? translated.ingredients.map(String) : []),
    steps:       createLocalizedTextList(recipe.steps.en,
      Array.isArray(translated.steps) ? translated.steps.map(String) : []),
    translation: { status: 'machine', provider: `gemini:${model}`, reviewedBy: null },
    updatedAt:   new Date().toISOString(),
  };
}

async function estimateNutritionWithGemini(recipe) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const model  = process.env.GEMINI_MODEL || process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-lite';
  if (!apiKey || recipe.nutrition) return recipe;

  await sleep(2000);

  let payload;
  try {
    payload = await callGeminiWithRetry(apiKey, model, {
      contents: [{
        parts: [{
          text: `Estimate the nutrition per serving for this baby food recipe. Return valid JSON only with these exact keys (numbers only, no units): kcal, proteinG, carbsG, fatG, fiberG. Omit ironMg, calciumMg, vitaminCMg if unsure. Use realistic baby serving sizes (100-200g).\n\nRecipe: ${recipe.title.en}\nIngredients: ${recipe.ingredients.en.join(', ')}`,
        }],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    });
  } catch (err) {
    console.warn(`  Gemini nutrition estimation skipped for "${recipe.title.en}": ${err.message}`);
    return recipe;
  }

  const outputText = extractGeminiText(payload);
  if (!outputText) return recipe;

  try {
    const raw = JSON.parse(extractJsonObject(outputText));
    const nutrition = {};
    for (const [key, val] of Object.entries(raw)) {
      const num = Number(val);
      if (Number.isFinite(num) && num >= 0) nutrition[key] = Math.round(num * 10) / 10;
    }
    if (Object.keys(nutrition).length > 0) {
      console.log(`  Estimated nutrition for "${recipe.title.en}": ${JSON.stringify(nutrition)}`);
      return { ...recipe, nutrition };
    }
  } catch {
    // malformed JSON — skip
  }
  return recipe;
}

async function translateRecipe(recipe) {
  if (TRANSLATE_PROVIDER === 'none') return recipe;
  if (TRANSLATE_PROVIDER === 'gemini') return translateRecipeWithGemini(recipe);
  // Default: free Google Translate, with Gemini fallback if key available
  try {
    return await translateRecipeWithGoogle(recipe);
  } catch (err) {
    console.warn(`  ${err.message}`);
    if (process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
      console.log(`  Falling back to Gemini for "${recipe.title.en}"...`);
      return translateRecipeWithGemini(recipe);
    }
    console.warn(`  No Gemini key — skipping Albanian translation for "${recipe.title.en}"`);
    return recipe;
  }
}

function normalizeSourceLink(href, source = getSourceConfig()) {
  try {
    const url = new URL(htmlDecode(href), source.root);
    const sourceOrigin = new URL(source.root).origin;

    if (url.origin !== sourceOrigin) {
      return null;
    }

    url.hash = '';
    url.search = '';

    if (!isLikelyRecipeUrl(url.href, source)) {
      return null;
    }

    return url.href.replace(/\/?$/, '/');
  } catch {
    return null;
  }
}

function isLikelyRecipeUrl(url, source = getSourceConfig()) {
  try {
    const { pathname } = new URL(url);
    const normalizedPath = pathname.replace(/\/+$/, '/').toLowerCase();
    const parts = normalizedPath.split('/').filter(Boolean);

    if (parts.length < 1) {
      return false;
    }

    if (/\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
      return false;
    }

    const skip = [
      '/category/', '/tag/', '/author/', '/about', '/contact', '/page/',
      '/privacy', '/terms', '/sitemap', '/feed', '/wp-',
      '/shop', '/courses', '/ebook', '/membership', '/comment-page-',
    ];

    const sourceIndexPaths = source.recipeIndexPaths
      .map((pathName) => `/${pathName.replace(/^\/+|\/+$/g, '').toLowerCase()}/`);

    return !skip.some((value) => normalizedPath.includes(value))
      && !sourceIndexPaths.includes(normalizedPath);
  } catch {
    return false;
  }
}

function extractRecipeLinks(html, source = getSourceConfig()) {
  const links = new Set();
  const matches = html.matchAll(/\bhref=(["'])(.*?)\1/gi);

  for (const match of matches) {
    const url = normalizeSourceLink(match[2], source);

    if (url) {
      links.add(url);
    }
  }

  return [...links];
}

function readSourceUrlsFile(sourceFile) {
  if (!sourceFile) {
    return [];
  }

  const fullPath = path.resolve(process.cwd(), sourceFile);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Source URL file does not exist: ${fullPath}`);
  }

  return fs.readFileSync(fullPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function normalizeManualSourceUrls(urls, source = getSourceConfig()) {
  return unique(urls.map((url) => normalizeSourceLink(url, source)).filter(Boolean));
}

function canonicalSourceUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(String(value));
    url.hash = '';
    url.search = '';
    url.hostname = url.hostname.toLowerCase();
    return url.href.replace(/\/?$/, '/');
  } catch {
    return String(value).trim().toLowerCase().replace(/\/?$/, '/');
  }
}

function getEnglishText(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.en || value['en-US'] || '';
}

function createDuplicateIndex() {
  return {
    ids: new Set(),
    sourceUrls: new Set(),
    titleSlugs: new Set(),
  };
}

function addRecipeToDuplicateIndex(index, recipe) {
  if (!recipe) {
    return;
  }

  if (recipe.id) {
    index.ids.add(String(recipe.id));
  }

  const sourceUrl = canonicalSourceUrl(recipe.source?.url);

  if (sourceUrl) {
    index.sourceUrls.add(sourceUrl);
  }

  const titleSlug = slugify(getEnglishText(recipe.title));

  if (titleSlug) {
    index.titleSlugs.add(titleSlug);
  }
}

function createDuplicateIndexFromRecipes(recipes) {
  const index = createDuplicateIndex();

  for (const recipe of recipes) {
    addRecipeToDuplicateIndex(index, recipe);
  }

  return index;
}

function createDuplicateIndexFromSnapshotValue(value) {
  if (!value) {
    return createDuplicateIndex();
  }

  const recipes = Array.isArray(value)
    ? value.filter(Boolean)
    : Object.values(value);

  return createDuplicateIndexFromRecipes(recipes);
}

function findDuplicateRecipe(recipe, indexes) {
  const sourceUrl = canonicalSourceUrl(recipe.source?.url);
  const titleSlug = slugify(getEnglishText(recipe.title));

  for (const { label, index } of indexes) {
    if (recipe.id && index.ids.has(String(recipe.id))) {
      return `${label} id "${recipe.id}"`;
    }

    if (sourceUrl && index.sourceUrls.has(sourceUrl)) {
      return `${label} source URL "${sourceUrl}"`;
    }

    if (titleSlug && index.titleSlugs.has(titleSlug)) {
      return `${label} title "${getEnglishText(recipe.title)}"`;
    }
  }

  return null;
}

function normalizeRecipe(url, recipeNode, source = getSourceConfig()) {
  const title = stripHtml(recipeNode.name || 'Untitled Recipe');
  const summary = stripHtml(recipeNode.description || '');
  const slug = slugify(title || url);
  const ingredients = Array.isArray(recipeNode.recipeIngredient)
    ? recipeNode.recipeIngredient.map((item) => normalizeListText(item)).filter(Boolean)
    : [];
  const steps = normalizeInstructionSteps(recipeNode.recipeInstructions);
  const categories = Array.isArray(recipeNode.recipeCategory)
    ? recipeNode.recipeCategory.map((item) => String(item))
    : recipeNode.recipeCategory
      ? [String(recipeNode.recipeCategory)]
      : [];
  const image = Array.isArray(recipeNode.image)
    ? recipeNode.image[0]
    : typeof recipeNode.image === 'string'
      ? recipeNode.image
      : recipeNode.image?.url || null;
  const nutrition = normalizeNutrition(recipeNode.nutrition);
  const now = new Date().toISOString();
  const recipe = {
    id: slug,
    slug,
    languages: ['sq-AL', 'en'],
    title: createLocalizedText(title, fallbackAlbanianText(title)),
    summary: createLocalizedText(summary, fallbackAlbanianText(summary)),
    ingredients: createLocalizedTextList(ingredients, []),
    steps: createLocalizedTextList(steps, []),
    ageStage: guessAgeStage(title, summary, categories),
    mealType: guessMealType(title, categories),
    prepMinutes: durationToMinutes(recipeNode.prepTime),
    cookMinutes: durationToMinutes(recipeNode.cookTime),
    totalMinutes: durationToMinutes(recipeNode.totalTime),
    image: {
      sourceUrl: image,
      storagePath: null,
      downloadUrl: null,
      contentType: null,
      mirroredAt: null,
    },
    source: {
      siteName: source.siteName,
      sourceId: slug,
      url,
      imageUrl: image,
      scrapedAt: now,
    },
    translation: {
      status: 'pending',
      provider: 'manual',
      reviewedBy: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  if (nutrition) {
    recipe.nutrition = nutrition;
  }

  return recipe;
}

async function collectSitemapRecipeLinks(limit, source = getSourceConfig()) {
  const seen = new Set();

  for (const sitemapUrl of source.sitemapUrls) {
    if (seen.size >= limit) break;

    console.log(`  Scanning sitemap: ${sitemapUrl}`);

    try {
      const xml = await fetchHtml(sitemapUrl);
      const locations = extractSitemapLocations(xml);
      const nestedSitemaps = locations
        .filter((url) => /sitemap.*\.xml$/i.test(url))
        .slice(0, MAX_SITEMAPS_TO_SCAN);
      const pageUrls = nestedSitemaps.length > 0 ? [] : locations;

      for (const pageUrl of pageUrls) {
        const normalizedUrl = normalizeSourceLink(pageUrl, source);
        if (normalizedUrl) {
          seen.add(normalizedUrl);
          if (seen.size >= limit) break;
        }
      }

      for (const nestedSitemapUrl of nestedSitemaps) {
        if (seen.size >= limit) break;

        try {
          console.log(`  Scanning nested sitemap: ${nestedSitemapUrl}`);
          const nestedXml = await fetchHtml(nestedSitemapUrl);
          const nestedLocations = extractSitemapLocations(nestedXml);

          for (const pageUrl of nestedLocations) {
            const normalizedUrl = normalizeSourceLink(pageUrl, source);
            if (normalizedUrl) {
              seen.add(normalizedUrl);
              if (seen.size >= limit) break;
            }
          }
        } catch (err) {
          console.warn(`  Could not fetch ${nestedSitemapUrl}: ${err.message}`);
        }
      }
    } catch (err) {
      console.warn(`  Could not fetch ${sitemapUrl}: ${err.message}`);
    }
  }

  return [...seen].slice(0, limit);
}

async function collectAllRecipeLinks(limit, options = {}) {
  const source = options.source || getSourceConfig();
  const seen = new Set(normalizeManualSourceUrls(options.sourceUrls || [], source));

  if (seen.size < limit) {
    const sitemapLinks = await collectSitemapRecipeLinks(limit, source);
    for (const link of sitemapLinks) {
      seen.add(link);
      if (seen.size >= limit) break;
    }
  }

  const categoryPages = createRecipeIndexPages(options.discoveryPageCount, source);

  for (const pageUrl of categoryPages) {
    if (seen.size >= limit) break;
    console.log(`  Scanning page: ${pageUrl}`);
    try {
      const html = await fetchHtml(pageUrl);
      const links = extractRecipeLinks(html, source);
      for (const link of links) {
        seen.add(link);
        if (seen.size >= limit) break;
      }
    } catch (err) {
      console.warn(`  Could not fetch ${pageUrl}: ${err.message}`);
    }
  }

  return [...seen].slice(0, limit);
}

async function importRecipes(limit, options = {}) {
  loadDotEnvFile(path.join(process.cwd(), '.env'));
  const source = getSourceConfig(options.source);

  if (!options.dryRun) {
    requireFirebaseEnv();
  }

  const app = options.dryRun ? null : getFirebaseApp();
  const database = app ? getDatabase(app) : null;
  let existingDuplicateIndex = createDuplicateIndex();

  if (database) {
    console.log('Reading existing recipes to skip duplicates...');
    const recipesSnapshot = await Promise.race([
      get(ref(database, 'recipes')),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Firebase read timed out after ${DATABASE_TIMEOUT_MS}ms.`,
            ),
          );
        }, DATABASE_TIMEOUT_MS);
      }),
    ]);
    existingDuplicateIndex = createDuplicateIndexFromSnapshotValue(recipesSnapshot.val());
  }

  const sourceUrls = [
    ...(process.env[source.envKey] || '').split(','),
    ...readSourceUrlsFile(options.sourceFile),
    ...(options.sourceUrls || []),
  ].map((url) => url.trim()).filter(Boolean);
  const candidateLimit = Math.max(
    limit * DEFAULT_CANDIDATE_MULTIPLIER,
    limit + 20,
  );

  console.log(`Scanning ${source.siteName} sitemaps and recipe index pages for up to ${candidateLimit} candidate links...`);
  const recipeLinks = await collectAllRecipeLinks(candidateLimit, {
    discoveryPageCount: options.discoveryPageCount,
    sourceUrls,
    source,
  });

  if (recipeLinks.length === 0) {
    throw new Error('No recipe links were found on the source site.');
  }

  const records = [];
  const pendingDuplicateIndex = createDuplicateIndex();
  let duplicateCount = 0;
  let pageWithoutRecipeDataCount = 0;

  for (const url of recipeLinks) {
    if (records.length >= limit) {
      break;
    }

    console.log(`Parsing recipe page: ${url}`);
    const pageHtml = await fetchHtml(url);
    const jsonLdRecipes = extractJsonLdRecipes(pageHtml);
    const recipeNode = jsonLdRecipes[0];

    if (!recipeNode) {
      pageWithoutRecipeDataCount++;
      console.warn(`  Skipping page without schema.org Recipe data: ${url}`);
      continue;
    }

    const normalizedRecipe = normalizeRecipe(url, recipeNode, source);
    const duplicateReason = findDuplicateRecipe(normalizedRecipe, [
      { label: 'existing recipe', index: existingDuplicateIndex },
      { label: 'current import', index: pendingDuplicateIndex },
    ]);

    if (duplicateReason) {
      duplicateCount++;
      console.warn(`  Skipping duplicate (${duplicateReason}): ${url}`);
      continue;
    }

    const translatedRecipe = await translateRecipe(normalizedRecipe);
    const withNutrition = await estimateNutritionWithGemini(translatedRecipe);

    records.push(withNutrition);
    addRecipeToDuplicateIndex(pendingDuplicateIndex, translatedRecipe);
  }

  if (records.length === 0) {
    if (duplicateCount > 0) {
      console.log(`No new recipes to import from ${source.siteName}. Skipped ${duplicateCount} duplicates.`);
      if (database) goOffline(database);
      return [];
    }

    throw new Error('No recipe pages exposed schema.org recipe data.');
  }
  const updates = {};

  for (const recipe of records) {
    updates[`recipes/${recipe.id}`] = recipe;
  }

  if (options.dryRun) {
    console.log(`Dry run complete. Parsed ${records.length} new recipes; skipped ${duplicateCount} duplicates; Firebase was not updated.`);
    return records;
  }

  console.log(`Writing ${records.length} recipes to Firebase...`);
  await Promise.race([
    update(ref(database), updates),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Firebase write timed out after ${DATABASE_TIMEOUT_MS}ms.`,
          ),
        );
      }, DATABASE_TIMEOUT_MS);
    }),
  ]);
  goOffline(database);

  console.log(`Imported ${records.length} recipes from ${source.siteName}; skipped ${duplicateCount} duplicates and ${pageWithoutRecipeDataCount} pages without recipe data.`);

  if (TRANSLATE_PROVIDER === 'none') {
    console.log('Translation disabled (TRANSLATE_PROVIDER=none). Albanian fields mirror English.');
  } else if (TRANSLATE_PROVIDER === 'gemini') {
    console.log(`Albanian translations generated with Gemini (model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'}).`);
  } else {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log(`Albanian translations: Google Translate (free)${geminiKey ? ' + Gemini fallback' : ''}.`);
  }

  console.log('Recipe images stored as source URLs (no Firebase Storage required).');
}

function parseArgs(argv) {
  const getNumberArg = (name, fallback) => {
    const arg = argv.find((value) => value.startsWith(`--${name}=`));
    return arg ? Number(arg.split('=')[1]) : fallback;
  };
  const getStringArg = (name) => {
    const arg = argv.find((value) => value.startsWith(`--${name}=`));
    return arg ? arg.slice(name.length + 3) : null;
  };
  const sourceUrls = argv
    .filter((value) => value.startsWith('--source-url='))
    .map((value) => value.slice('--source-url='.length));

  return {
    limit: getNumberArg('limit', DEFAULT_IMPORT_LIMIT),
    discoveryPageCount: getNumberArg('pages', DEFAULT_DISCOVERY_PAGE_COUNT),
    source: getStringArg('source') || DEFAULT_SOURCE_KEY,
    sourceFile: getStringArg('source-file'),
    sourceUrls,
    dryRun: argv.includes('--dry-run'),
    backfillNutrition: argv.includes('--backfill-nutrition'),
  };
}

async function backfillNutrition() {
  loadDotEnvFile(path.join(process.cwd(), '.env'));
  requireFirebaseEnv();

  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY required for --backfill-nutrition');

  const app = getFirebaseApp();
  const database = getDatabase(app);

  console.log('Loading all recipes from Firebase...');
  const snapshot = await Promise.race([
    get(ref(database, 'recipes')),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase read timeout')), DATABASE_TIMEOUT_MS)),
  ]);

  if (!snapshot.exists()) { console.log('No recipes found.'); goOffline(database); return; }

  const allRecipes = Object.values(snapshot.val());
  const missing = allRecipes.filter((r) => !r.nutrition);
  console.log(`${allRecipes.length} total recipes, ${missing.length} missing nutrition.`);

  if (missing.length === 0) { console.log('All recipes already have nutrition data.'); goOffline(database); return; }

  const updates = {};
  let done = 0;
  for (const recipe of missing) {
    const withNutrition = await estimateNutritionWithGemini(recipe);
    if (withNutrition.nutrition) {
      updates[`recipes/${recipe.id}/nutrition`] = withNutrition.nutrition;
      done++;
    }
  }

  if (Object.keys(updates).length > 0) {
    console.log(`Writing nutrition for ${done} recipes...`);
    await Promise.race([
      update(ref(database), updates),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase write timeout')), DATABASE_TIMEOUT_MS)),
    ]);
    console.log(`Done. Backfilled nutrition for ${done}/${missing.length} recipes.`);
  } else {
    console.log('Gemini could not estimate nutrition for any recipe.');
  }

  goOffline(database);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.backfillNutrition) {
    await backfillNutrition();
    process.exit(0);
  }

  const limit = options.limit;

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('The --limit value must be a positive number.');
  }

  if (!Number.isFinite(options.discoveryPageCount) || options.discoveryPageCount <= 0) {
    throw new Error('The --pages value must be a positive number.');
  }

  await importRecipes(limit, options);
  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  addRecipeToDuplicateIndex,
  canonicalSourceUrl,
  collectAllRecipeLinks,
  createDuplicateIndex,
  createDuplicateIndexFromRecipes,
  createRecipeIndexPages,
  extractJsonLdRecipes,
  extractRecipeLinks,
  extractSitemapLocations,
  findDuplicateRecipe,
  getSourceConfig,
  isLikelyRecipeUrl,
  normalizeInstructionSteps,
  normalizeNutrition,
  normalizeRecipe,
  parseArgs,
};

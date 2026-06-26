const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { initializeApp, getApp, getApps } = require('firebase/app');
const { getDatabase, goOffline, ref, update } = require('firebase/database');
const {
  applicationDefault,
  cert,
  getApp: getAdminApp,
  getApps: getAdminApps,
  initializeApp: initializeAdminApp,
} = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const FIREBASE_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const SOURCE_SITE = 'babyfoode.com';
const SOURCE_ROOT = 'https://babyfoode.com';
const DEFAULT_IMPORT_LIMIT = 12;

const CATEGORY_PAGES = [
  'https://babyfoode.com/recipes/',
  'https://babyfoode.com/recipes/page/2/',
  'https://babyfoode.com/recipes/page/3/',
  'https://babyfoode.com/recipes/page/4/',
  'https://babyfoode.com/recipes/page/5/',
  'https://babyfoode.com/recipes/page/6/',
  'https://babyfoode.com/recipes/page/7/',
  'https://babyfoode.com/recipes/page/8/',
  'https://babyfoode.com/recipes/page/9/',
  'https://babyfoode.com/recipes/page/10/',
  'https://babyfoode.com/recipes/page/11/',
  'https://babyfoode.com/recipes/page/12/',
  'https://babyfoode.com/recipes/page/13/',
  'https://babyfoode.com/recipes/page/14/',
  'https://babyfoode.com/recipes/page/15/',
];
// TRANSLATE_PROVIDER: 'google' (default, free) | 'gemini' | 'none'
const TRANSLATE_PROVIDER = process.env.TRANSLATE_PROVIDER || 'google';
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const HTTP_TIMEOUT_MS = 30000;
const DATABASE_TIMEOUT_MS = 45000;
const IMAGE_TIMEOUT_MS = 45000;

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

function getServiceAccountConfig() {
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON);
  }

  const serviceAccountPath =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccountPath) {
    return null;
  }

  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.join(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase admin service account file not found: ${resolvedPath}`);
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function getFirebaseAdminApp() {
  if (getAdminApps().length > 0) {
    return getAdminApp();
  }

  const serviceAccount = getServiceAccountConfig();

  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return null;
  }

  return initializeAdminApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
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
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8230;/g, '...')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// ── Google Translate (free, no API key) ─────────────────────────────────────

async function googleTranslateChunk(text) {
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
    if (!response.ok) throw new Error(`Google Translate HTTP ${response.status}`);
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
    console.warn(`  Google Translate failed for "${recipe.title.en}": ${err.message}`);
    return recipe;
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

function inferExtension(url, contentType) {
  if (contentType) {
    if (contentType.includes('png')) {
      return 'png';
    }

    if (contentType.includes('webp')) {
      return 'webp';
    }

    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      return 'jpg';
    }
  }

  try {
    const { pathname } = new URL(url);
    const extension = path.extname(pathname).replace('.', '').toLowerCase();

    if (extension) {
      return extension;
    }
  } catch {
    return 'jpg';
  }

  return 'jpg';
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

function durationToMinutes(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const hours = value.match(/(\d+)H/i);
  const minutes = value.match(/(\d+)M/i);

  return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
}

function normalizeInstructionStep(step) {
  if (!step) {
    return null;
  }

  if (typeof step === 'string') {
    return stripHtml(step);
  }

  if (typeof step === 'object') {
    if (typeof step.text === 'string') {
      return stripHtml(step.text);
    }

    if (typeof step.name === 'string') {
      return stripHtml(step.name);
    }
  }

  return null;
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

async function mirrorRecipeImage(recipe) {
  if (!recipe.source.imageUrl) return recipe;
  const adminApp = getFirebaseAdminApp();
  if (!adminApp) return recipe;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(recipe.source.imageUrl, {
        headers: { 'user-agent': 'receta-bebesh-importer/1.0', accept: 'image/*' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`image download ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = inferExtension(recipe.source.imageUrl, contentType);
    const buffer = Buffer.from(await response.arrayBuffer());
    const storagePath = `recipes/${recipe.slug}/cover.${extension}`;
    const downloadToken = randomUUID();
    const bucket = getStorage(adminApp).bucket();
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      resumable: false,
      contentType,
      metadata: { contentType, metadata: { firebaseStorageDownloadTokens: downloadToken, sourceUrl: recipe.source.imageUrl } },
    });

    const downloadUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
    const mirroredAt = new Date().toISOString();

    return {
      ...recipe,
      image: { sourceUrl: recipe.source.imageUrl, storagePath, downloadUrl, contentType, mirroredAt },
      updatedAt: mirroredAt,
    };
  } catch (err) {
    const msg = err.message?.split('\n')[0] ?? String(err);
    console.warn(`  Image mirror skipped for ${recipe.slug}: ${msg}`);
    return recipe;
  }
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
  const apiKey = process.env.GEMINI_API_KEY;
  const model  = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
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

async function translateRecipe(recipe) {
  if (TRANSLATE_PROVIDER === 'none') return recipe;
  if (TRANSLATE_PROVIDER === 'gemini') return translateRecipeWithGemini(recipe);
  // Default: free Google Translate
  return translateRecipeWithGoogle(recipe);
}

function extractRecipeLinks(html) {
  const links = new Set();
  const matches = html.matchAll(/href="(https:\/\/babyfoode\.com\/[^"#?]+)"/gi);

  const SKIP = [
    '/category/', '/tag/', '/author/', '/about', '/contact', '/page/',
    '/recipes/', '/privacy', '/terms', '/sitemap', '/feed', '/wp-',
  ];

  for (const match of matches) {
    const url = match[1].replace(/\/$/, '') + '/';
    // Must have at least one path segment that looks like a slug
    const { pathname } = new URL(url);
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 1) continue;
    if (SKIP.some((s) => url.includes(s))) continue;
    links.add(url);
  }

  return [...links];
}

function normalizeRecipe(url, recipeNode) {
  const title = stripHtml(recipeNode.name || 'Untitled Recipe');
  const summary = stripHtml(recipeNode.description || '');
  const slug = slugify(title || url);
  const ingredients = Array.isArray(recipeNode.recipeIngredient)
    ? recipeNode.recipeIngredient.map((item) => stripHtml(String(item))).filter(Boolean)
    : [];
  const instructionsSource = Array.isArray(recipeNode.recipeInstructions)
    ? recipeNode.recipeInstructions
    : recipeNode.recipeInstructions
      ? [recipeNode.recipeInstructions]
      : [];
  const steps = instructionsSource
    .map((item) => normalizeInstructionStep(item))
    .filter(Boolean);
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
  const now = new Date().toISOString();

  return {
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
      siteName: SOURCE_SITE,
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
}

async function collectAllRecipeLinks(limit) {
  const seen = new Set();

  for (const pageUrl of CATEGORY_PAGES) {
    if (seen.size >= limit) break;
    console.log(`  Scanning page: ${pageUrl}`);
    try {
      const html = await fetchHtml(pageUrl);
      const links = extractRecipeLinks(html);
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

async function importRecipes(limit) {
  loadDotEnvFile(path.join(process.cwd(), '.env'));
  requireFirebaseEnv();

  console.log(`Scanning ${CATEGORY_PAGES.length} category pages for recipe links...`);
  const recipeLinks = await collectAllRecipeLinks(limit);

  if (recipeLinks.length === 0) {
    throw new Error('No recipe links were found on the source site.');
  }

  const records = [];

  for (const url of recipeLinks) {
    console.log(`Parsing recipe page: ${url}`);
    const pageHtml = await fetchHtml(url);
    const jsonLdRecipes = extractJsonLdRecipes(pageHtml);
    const recipeNode = jsonLdRecipes[0];

    if (!recipeNode) {
      continue;
    }

    const normalizedRecipe = normalizeRecipe(url, recipeNode);
    const translatedRecipe = await translateRecipe(normalizedRecipe);
    const mirroredRecipe = await mirrorRecipeImage(translatedRecipe);

    records.push(mirroredRecipe);
  }

  if (records.length === 0) {
    throw new Error('No recipe pages exposed schema.org recipe data.');
  }

  const app = getFirebaseApp();
  const database = getDatabase(app);
  const updates = {};

  for (const recipe of records) {
    updates[`recipes/${recipe.id}`] = recipe;
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

  console.log(`Imported ${records.length} recipes from ${SOURCE_SITE}.`);

  if (TRANSLATE_PROVIDER === 'none') {
    console.log('Translation disabled (TRANSLATE_PROVIDER=none). Albanian fields mirror English.');
  } else if (TRANSLATE_PROVIDER === 'gemini') {
    console.log(`Albanian translations generated with Gemini (model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'}).`);
  } else {
    console.log('Albanian translations generated with Google Translate (free).');
  }

  if (getServiceAccountConfig() || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Recipe images were mirrored to Firebase Storage when available.');
  } else {
    console.log(
      'Recipe images remain on source URLs. Set FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH or FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON to mirror them into Firebase Storage.',
    );
  }
}

async function main() {
  const limitArg = process.argv.find((value) => value.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : DEFAULT_IMPORT_LIMIT;

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('The --limit value must be a positive number.');
  }

  await importRecipes(limit);
  process.exit(0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

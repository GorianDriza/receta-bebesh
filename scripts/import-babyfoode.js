const fs = require('fs');
const path = require('path');
const { initializeApp, getApp, getApps } = require('firebase/app');
const { getDatabase, goOffline, ref, update } = require('firebase/database');

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
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
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
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8230;/g, '...')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value) {
  return htmlDecode(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
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

function extractResponseText(payload) {
  if (!payload || !Array.isArray(payload.output)) {
    return null;
  }

  for (const outputItem of payload.output) {
    if (!Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem &&
        contentItem.type === 'output_text' &&
        typeof contentItem.text === 'string'
      ) {
        return contentItem.text;
      }
    }
  }

  return null;
}

async function translateRecipeWithOpenAI(recipe) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return recipe;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, HTTP_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'Translate recipe content from English into Albanian. Return valid JSON only with keys: title, summary, ingredients, steps. Preserve meaning, keep units explicit, and do not add commentary.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify({
                  title: recipe.title.en,
                  summary: recipe.summary.en,
                  ingredients: recipe.ingredients.en,
                  steps: recipe.steps.en,
                }),
              },
            ],
          },
        ],
      }),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`OpenAI translation failed: ${response.status}`);
  }

  const payload = await response.json();
  const outputText = extractResponseText(payload);

  if (!outputText) {
    throw new Error('OpenAI translation returned no text output.');
  }

  const translated = JSON.parse(outputText);

  return {
    ...recipe,
    title: createLocalizedText(recipe.title.en, translated.title || recipe.title.en),
    summary: createLocalizedText(
      recipe.summary.en,
      translated.summary || recipe.summary.en,
    ),
    ingredients: createLocalizedTextList(
      recipe.ingredients.en,
      Array.isArray(translated.ingredients)
        ? translated.ingredients.map((item) => String(item))
        : [],
    ),
    steps: createLocalizedTextList(
      recipe.steps.en,
      Array.isArray(translated.steps)
        ? translated.steps.map((item) => String(item))
        : [],
    ),
    translation: {
      status: 'machine',
      provider: `openai:${model}`,
      reviewedBy: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

function extractRecipeLinks(html) {
  const links = new Set();
  const matches = html.matchAll(/href="(https:\/\/babyfoode\.com\/[^"]+)"/gi);

  for (const match of matches) {
    const url = match[1];

    if (!url.includes('/blog/')) {
      continue;
    }

    if (
      url.includes('/category/') ||
      url.includes('/tag/') ||
      url.includes('/author/') ||
      url.includes('/about') ||
      url.includes('/contact')
    ) {
      continue;
    }

    links.add(url.split('#')[0].split('?')[0]);
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

async function importRecipes(limit) {
  loadDotEnvFile(path.join(process.cwd(), '.env'));
  requireFirebaseEnv();

  console.log(`Fetching source index from ${SOURCE_ROOT}...`);
  const homePageHtml = await fetchHtml(SOURCE_ROOT);
  const recipeLinks = extractRecipeLinks(homePageHtml).slice(0, limit);

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
    const translatedRecipe = await translateRecipeWithOpenAI(normalizedRecipe);

    records.push(translatedRecipe);
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

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) {
    console.log(
      `Albanian translations were generated with OpenAI model ${process.env.OPENAI_MODEL}.`,
    );
  } else {
    console.log(
      'Albanian fields currently mirror English. Set OPENAI_API_KEY and OPENAI_MODEL to enable automatic translation.',
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

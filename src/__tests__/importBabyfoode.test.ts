jest.mock('firebase/app', () => ({
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  goOffline: jest.fn(),
  ref: jest.fn(),
  update: jest.fn(),
}));

const {
  createRecipeIndexPages,
  extractJsonLdRecipes,
  extractRecipeLinks,
  extractSitemapLocations,
  normalizeInstructionSteps,
  normalizeNutrition,
  normalizeRecipe,
  parseArgs,
} = require('../../scripts/import-babyfoode');

describe('BabyFoode importer helpers', () => {
  it('creates a larger paginated recipe index list', () => {
    expect(createRecipeIndexPages(3)).toEqual([
      'https://babyfoode.com/recipes/',
      'https://babyfoode.com/recipes/page/2/',
      'https://babyfoode.com/recipes/page/3/',
    ]);
  });

  it('extracts likely recipe links and skips navigation links', () => {
    const html = `
      <a href="https://babyfoode.com/apple-pancakes/">Recipe</a>
      <a href="/banana-oat-muffins?utm_source=test#top">Relative</a>
      <a href="https://babyfoode.com/category/baby-food/">Category</a>
      <a href="https://example.com/not-this-site/">External</a>
    `;

    expect(extractRecipeLinks(html)).toEqual([
      'https://babyfoode.com/apple-pancakes/',
      'https://babyfoode.com/banana-oat-muffins/',
    ]);
  });

  it('extracts recipe nodes from JSON-LD graphs', () => {
    const html = `
      <script type="application/ld+json">
        {
          "@graph": [
            { "@type": "WebPage", "name": "Page" },
            { "@type": ["Recipe"], "name": "Apple Pancakes" }
          ]
        }
      </script>
    `;

    expect(extractJsonLdRecipes(html)).toEqual([
      { '@type': ['Recipe'], name: 'Apple Pancakes' },
    ]);
  });

  it('flattens HowToSection instruction steps', () => {
    const steps = normalizeInstructionSteps([
      {
        '@type': 'HowToSection',
        name: 'Instructions',
        itemListElement: [
          { '@type': 'HowToStep', text: '<p>Mash the banana.</p>' },
          { '@type': 'HowToStep', name: 'Stir in oats.' },
        ],
      },
    ]);

    expect(steps).toEqual(['Mash the banana.', 'Stir in oats.']);
  });

  it('normalizes nutrition values from schema text', () => {
    expect(normalizeNutrition({
      calories: '120 calories',
      proteinContent: '4 g',
      carbohydrateContent: '22g',
      fatContent: '3.5 g',
    })).toEqual({
      kcal: 120,
      proteinG: 4,
      carbsG: 22,
      fatG: 3.5,
    });
  });

  it('includes cleaned ingredients, steps, and nutrition in normalized records', () => {
    const recipe = normalizeRecipe('https://babyfoode.com/apple-pancakes/', {
      name: 'Apple Pancakes',
      description: '<p>Easy breakfast.</p>',
      recipeIngredient: ['• 1 apple', ' 2 eggs '],
      recipeInstructions: [
        { itemListElement: [{ text: 'Mix ingredients.' }, { text: 'Cook until set.' }] },
      ],
      recipeCategory: ['Breakfast'],
      prepTime: 'PT10M',
      cookTime: 'PT5M',
      totalTime: 'PT15M',
      image: { url: 'https://babyfoode.com/apple.jpg' },
      nutrition: { calories: '120 kcal', fiberContent: '2g' },
    });

    expect(recipe.ingredients.en).toEqual(['1 apple', '2 eggs']);
    expect(recipe.steps.en).toEqual(['Mix ingredients.', 'Cook until set.']);
    expect(recipe.mealType).toBe('breakfast');
    expect(recipe.nutrition).toEqual({ kcal: 120, fiberG: 2 });
  });

  it('parses sitemap locations and CLI source options', () => {
    expect(extractSitemapLocations(`
      <urlset>
        <url><loc>https://babyfoode.com/apple-pancakes/</loc></url>
      </urlset>
    `)).toEqual(['https://babyfoode.com/apple-pancakes/']);

    expect(parseArgs([
      '--limit=5',
      '--pages=12',
      '--source-file=urls.txt',
      '--source-url=https://babyfoode.com/apple-pancakes/',
      '--dry-run',
    ])).toEqual({
      limit: 5,
      discoveryPageCount: 12,
      sourceFile: 'urls.txt',
      sourceUrls: ['https://babyfoode.com/apple-pancakes/'],
      dryRun: true,
    });
  });
});

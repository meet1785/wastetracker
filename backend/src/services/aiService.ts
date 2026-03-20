/**
 * AI Service — stub implementation that returns realistic mock data.
 * Replace the internals with real OpenAI / custom model calls when ready.
 */

export interface RecipeSuggestion {
  name: string;
  description: string;
  ingredients: Array<{ name: string; quantity: string; optional: boolean }>;
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  dietary_tags: string[];
  calories: number;
  difficulty: 'easy' | 'medium' | 'hard';
  match_score: number;
  matching_ingredients: string[];
}

export interface ExpiryPrediction {
  item_name: string;
  predicted_expiry_days: number;
  confidence: number;
  storage_tips: string[];
}

export interface NutritionalInfo {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

const RECIPE_TEMPLATES: RecipeSuggestion[] = [
  {
    name: 'Quick Veggie Stir Fry',
    description: 'A fast and healthy stir fry using whatever vegetables you have on hand.',
    ingredients: [
      { name: 'Mixed vegetables', quantity: '2 cups', optional: false },
      { name: 'Soy sauce', quantity: '2 tbsp', optional: false },
      { name: 'Garlic', quantity: '2 cloves', optional: false },
      { name: 'Sesame oil', quantity: '1 tbsp', optional: true },
    ],
    instructions: [
      'Heat oil in a wok over high heat.',
      'Add minced garlic and stir for 30 seconds.',
      'Add vegetables in order of hardness.',
      'Drizzle soy sauce and sesame oil, toss to coat.',
      'Serve immediately over rice.',
    ],
    prep_time: 10, cook_time: 15, servings: 2,
    dietary_tags: ['vegetarian', 'vegan', 'quick'],
    calories: 320, difficulty: 'easy',
    match_score: 0.92, matching_ingredients: [],
  },
  {
    name: 'Leftover Fried Rice',
    description: 'Transform leftover rice and vegetables into a delicious fried rice.',
    ingredients: [
      { name: 'Cooked rice', quantity: '2 cups', optional: false },
      { name: 'Eggs', quantity: '2', optional: false },
      { name: 'Mixed vegetables', quantity: '1 cup', optional: false },
      { name: 'Soy sauce', quantity: '3 tbsp', optional: false },
    ],
    instructions: [
      'Beat eggs and scramble in hot oiled pan, set aside.',
      'Add vegetables and stir fry for 2 minutes.',
      'Add cold rice and break up clumps.',
      'Mix in soy sauce and scrambled eggs.',
      'Drizzle with sesame oil and serve hot.',
    ],
    prep_time: 5, cook_time: 10, servings: 2,
    dietary_tags: ['quick', 'budget-friendly'],
    calories: 410, difficulty: 'easy',
    match_score: 0.88, matching_ingredients: [],
  },
  {
    name: 'Creamy Tomato Soup',
    description: 'A comforting soup made from fresh tomatoes.',
    ingredients: [
      { name: 'Tomatoes', quantity: '6 medium', optional: false },
      { name: 'Onion', quantity: '1 large', optional: false },
      { name: 'Garlic', quantity: '3 cloves', optional: false },
      { name: 'Vegetable broth', quantity: '2 cups', optional: false },
      { name: 'Heavy cream', quantity: '¼ cup', optional: true },
    ],
    instructions: [
      'Sauté diced onion and garlic until soft.',
      'Add chopped tomatoes and broth. Simmer 20 minutes.',
      'Blend until smooth.',
      'Stir in cream and season with salt and pepper.',
      'Serve with crusty bread.',
    ],
    prep_time: 10, cook_time: 25, servings: 4,
    dietary_tags: ['vegetarian', 'gluten-free'],
    calories: 190, difficulty: 'medium',
    match_score: 0.78, matching_ingredients: [],
  },
  {
    name: 'Banana Oat Pancakes',
    description: 'Use overripe bananas to make fluffy, naturally sweet pancakes.',
    ingredients: [
      { name: 'Overripe bananas', quantity: '2', optional: false },
      { name: 'Oats', quantity: '1 cup', optional: false },
      { name: 'Eggs', quantity: '2', optional: false },
      { name: 'Milk', quantity: '¼ cup', optional: false },
    ],
    instructions: [
      'Blend bananas, oats, eggs, and milk until smooth.',
      'Let batter rest 5 minutes.',
      'Cook ¼ cup batter per pancake over medium heat.',
      'Cook 2-3 minutes per side until golden.',
      'Serve with honey or maple syrup.',
    ],
    prep_time: 5, cook_time: 15, servings: 2,
    dietary_tags: ['vegetarian', 'gluten-free', 'breakfast'],
    calories: 280, difficulty: 'easy',
    match_score: 0.85, matching_ingredients: [],
  },
  {
    name: 'Veggie Omelette',
    description: 'A protein-packed omelette with whatever vegetables are near expiry.',
    ingredients: [
      { name: 'Eggs', quantity: '3', optional: false },
      { name: 'Bell peppers', quantity: '½ cup', optional: false },
      { name: 'Spinach', quantity: '1 cup', optional: false },
      { name: 'Cheese', quantity: '¼ cup', optional: true },
    ],
    instructions: [
      'Beat eggs with salt and pepper.',
      'Sauté vegetables until soft.',
      'Pour egg mixture over vegetables.',
      'Let edges set then fold in half.',
      'Top with cheese and serve.',
    ],
    prep_time: 5, cook_time: 8, servings: 1,
    dietary_tags: ['vegetarian', 'high-protein', 'quick'],
    calories: 350, difficulty: 'easy',
    match_score: 0.90, matching_ingredients: [],
  },
];

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns AI-powered recipe recommendations based on the user's expiring ingredients.
 */
export async function getRecipeRecommendations(
  ingredientNames: string[],
  dietaryPreferences: string[] = []
): Promise<RecipeSuggestion[]> {
  await simulateDelay(300);

  const lowerIngredients = ingredientNames.map(n => n.toLowerCase());

  return RECIPE_TEMPLATES.map(recipe => {
    const matchingIngredients = recipe.ingredients
      .filter(ri => lowerIngredients.some(ui => ui.includes(ri.name.toLowerCase()) || ri.name.toLowerCase().includes(ui)))
      .map(ri => ri.name);

    const score = matchingIngredients.length > 0
      ? Math.min(0.99, 0.5 + matchingIngredients.length * 0.15)
      : Math.random() * 0.4 + 0.3;

    return { ...recipe, match_score: parseFloat(score.toFixed(2)), matching_ingredients: matchingIngredients };
  })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);
}

/**
 * Predicts the expiry date for a food item based on its category and storage method.
 */
export async function predictExpiry(
  itemName: string,
  category: string,
  storageType: string
): Promise<ExpiryPrediction> {
  await simulateDelay(150);

  const baseDays: Record<string, number> = {
    Dairy: 7, Meat: 3, Vegetables: 5, Fruits: 6,
    Grains: 180, Beverages: 14, Condiments: 90,
    Frozen: 90, Other: 7,
  };

  const storageMultiplier: Record<string, number> = {
    Refrigerator: 1, Freezer: 10, Pantry: 0.7, Counter: 0.5,
  };

  const base = baseDays[category] ?? 7;
  const multiplier = storageMultiplier[storageType] ?? 1;
  const predicted = Math.round(base * multiplier);

  const storageTipsMap: Record<string, string[]> = {
    Dairy: ['Keep in the coldest part of fridge', 'Store away from strong-smelling foods'],
    Meat: ['Store in the lowest shelf', 'Keep at 0-4°C', 'Freeze if not using within 2 days'],
    Vegetables: ['Store in crisper drawer', 'Keep away from ethylene-producing fruits'],
    Fruits: ['Store at room temperature until ripe, then refrigerate'],
    Grains: ['Store in airtight container', 'Keep in cool, dry place'],
    Frozen: ['Keep at -18°C or below', 'Avoid repeated freeze-thaw cycles'],
  };

  const tips = storageTipsMap[category] ?? ['Store in a cool, dry place', 'Check regularly for spoilage'];

  return {
    item_name: itemName,
    predicted_expiry_days: predicted,
    confidence: 0.75 + Math.random() * 0.2,
    storage_tips: tips,
  };
}

/**
 * Stub nutritional analysis for a food item.
 */
export async function analyzeNutrition(itemName: string): Promise<NutritionalInfo> {
  await simulateDelay(200);

  const nutritionMap: Record<string, NutritionalInfo> = {
    apple: { calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, fiber_g: 4.4 },
    banana: { calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, fiber_g: 3.1 },
    milk: { calories: 149, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0 },
    bread: { calories: 79, protein_g: 2.7, carbs_g: 15, fat_g: 1, fiber_g: 0.6 },
  };

  const key = itemName.toLowerCase();
  return nutritionMap[key] ?? {
    calories: Math.round(50 + Math.random() * 200),
    protein_g: parseFloat((Math.random() * 10).toFixed(1)),
    carbs_g: parseFloat((Math.random() * 30).toFixed(1)),
    fat_g: parseFloat((Math.random() * 15).toFixed(1)),
    fiber_g: parseFloat((Math.random() * 5).toFixed(1)),
  };
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  optional: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  dietary_tags: string[];
  image_url: string | null;
  calories: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: Date;
  /** Hydrated match score when returned from AI recommendation */
  match_score?: number;
  /** Which user inventory items are used */
  matching_ingredients?: string[];
}

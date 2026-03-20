import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { getRecipeRecommendations } from '../services/aiService';
import { awardPoints, POINTS } from '../services/gamificationService';

export async function getRecipes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dietary_tags, difficulty, max_time, search } = req.query;

    let query = db('recipes');

    if (search) query = query.whereILike('name', `%${search as string}%`);
    if (difficulty) query = query.where('difficulty', difficulty as string);
    if (max_time) {
      const maxTime = parseInt(max_time as string, 10);
      query = query.whereRaw('(prep_time + cook_time) <= ?', [maxTime]);
    }
    if (dietary_tags) {
      const tags = (dietary_tags as string).split(',');
      tags.forEach(tag => {
        query = query.whereRaw('dietary_tags @> ?::jsonb', [JSON.stringify([tag.trim()])]);
      });
    }

    const recipes = await query.orderBy('created_at', 'desc').limit(50);
    res.json({ success: true, data: { recipes, count: recipes.length } });
  } catch (err) {
    next(err);
  }
}

export async function getRecipeById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipe = await db('recipes').where('id', req.params.id).first();

    if (!recipe) {
      next(createError('Recipe not found', 404));
      return;
    }

    // Check if user saved this recipe
    const saved = await db('saved_recipes')
      .where({ user_id: req.userId, recipe_id: req.params.id })
      .first();

    res.json({ success: true, data: { recipe: { ...recipe, is_saved: !!saved } } });
  } catch (err) {
    next(err);
  }
}

export async function getAiRecommendations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Fetch user's expiring items to use as context for AI recommendations
    const expiringItems = await db('inventory_items')
      .where('user_id', req.userId)
      .where('is_consumed', false)
      .where('is_wasted', false)
      .whereRaw('expiry_date <= CURRENT_DATE + INTERVAL \'7 days\'')
      .pluck('name');

    const user = await db('users').where('id', req.userId).select('dietary_preferences').first();
    const dietaryPreferences = (user?.dietary_preferences as string[]) ?? [];

    const recommendations = await getRecipeRecommendations(
      expiringItems as string[],
      dietaryPreferences
    );

    res.json({
      success: true,
      data: {
        recommendations,
        based_on_ingredients: expiringItems,
        count: recommendations.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markRecipeUsed(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { recipe_id } = req.body as { recipe_id: string };

    const recipe = await db('recipes').where('id', recipe_id).first();
    if (!recipe) {
      next(createError('Recipe not found', 404));
      return;
    }

    await awardPoints(req.userId!, POINTS.RECIPE_USED, 'recipe used');

    res.json({ success: true, message: 'Recipe usage recorded', points_earned: POINTS.RECIPE_USED });
  } catch (err) {
    next(err);
  }
}

export async function saveRecipe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { recipe_id } = req.params;

    const recipe = await db('recipes').where('id', recipe_id).first();
    if (!recipe) {
      next(createError('Recipe not found', 404));
      return;
    }

    await db('saved_recipes')
      .insert({ user_id: req.userId, recipe_id })
      .onConflict(['user_id', 'recipe_id'])
      .ignore();

    res.json({ success: true, message: 'Recipe saved' });
  } catch (err) {
    next(err);
  }
}

export async function unsaveRecipe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await db('saved_recipes')
      .where({ user_id: req.userId, recipe_id: req.params.recipe_id })
      .delete();

    res.json({ success: true, message: 'Recipe removed from saved' });
  } catch (err) {
    next(err);
  }
}

export async function getSavedRecipes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipes = await db('recipes')
      .join('saved_recipes', 'recipes.id', 'saved_recipes.recipe_id')
      .where('saved_recipes.user_id', req.userId)
      .select('recipes.*', 'saved_recipes.saved_at')
      .orderBy('saved_recipes.saved_at', 'desc');

    res.json({ success: true, data: { recipes, count: recipes.length } });
  } catch (err) {
    next(err);
  }
}

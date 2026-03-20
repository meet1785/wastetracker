import { Router } from 'express';
import {
  getRecipes,
  getRecipeById,
  getAiRecommendations,
  markRecipeUsed,
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes,
} from '../controllers/recipeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getRecipes);
router.get('/recommendations', getAiRecommendations);
router.get('/saved', getSavedRecipes);
router.get('/:id', getRecipeById);
router.post('/mark-used', markRecipeUsed);
router.post('/:recipe_id/save', saveRecipe);
router.delete('/:recipe_id/save', unsaveRecipe);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getShoppingList,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  clearPurchased,
  generateAutoList,
} from '../controllers/shoppingController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getShoppingList);
router.post('/auto-generate', generateAutoList);
router.delete('/clear-purchased', clearPurchased);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Item name is required')],
  addShoppingItem
);

router.put('/:id', updateShoppingItem);
router.delete('/:id', deleteShoppingItem);

export default router;

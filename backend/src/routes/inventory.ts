import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getExpiryPrediction,
  bulkUpdateInventory,
} from '../controllers/inventoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getInventory);

router.get('/expiry-prediction',
  [
    query('item_name').notEmpty().withMessage('item_name is required'),
    query('category').notEmpty().withMessage('category is required'),
  ],
  getExpiryPrediction
);

router.get('/:id', getInventoryItem);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('expiry_date').isISO8601().toDate().withMessage('Valid expiry_date is required'),
    body('quantity').optional().isFloat({ min: 0 }),
    body('estimated_cost').optional().isFloat({ min: 0 }),
  ],
  createInventoryItem
);

router.put('/bulk', bulkUpdateInventory);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('expiry_date').optional().isISO8601().toDate(),
    body('quantity').optional().isFloat({ min: 0 }),
    body('is_consumed').optional().isBoolean(),
    body('is_wasted').optional().isBoolean(),
  ],
  updateInventoryItem
);

router.delete('/:id', deleteInventoryItem);

export default router;

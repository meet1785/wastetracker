import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { awardPoints, POINTS } from '../services/gamificationService';
import { predictExpiry } from '../services/aiService';

export async function getInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, storage_type, expiring_within, show_consumed, show_wasted, search } = req.query;

    let query = db('inventory_items').where('user_id', req.userId);

    if (show_consumed !== 'true') query = query.where('is_consumed', false);
    if (show_wasted !== 'true') query = query.where('is_wasted', false);
    if (category) query = query.where('category', category as string);
    if (storage_type) query = query.where('storage_type', storage_type as string);
    if (search) query = query.whereILike('name', `%${search as string}%`);
    if (expiring_within) {
      const days = parseInt(expiring_within as string, 10);
      query = query.whereRaw('expiry_date <= CURRENT_DATE + INTERVAL \'? days\'', [days]);
    }

    const items = await query.orderBy('expiry_date', 'asc');
    res.json({ success: true, data: { items, count: items.length } });
  } catch (err) {
    next(err);
  }
}

export async function getInventoryItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await db('inventory_items')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!item) {
      next(createError('Item not found', 404));
      return;
    }

    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

export async function createInventoryItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const purchase_date = (body.purchase_date as string) ?? new Date().toISOString().split('T')[0];

    const [item] = await db('inventory_items')
      .insert({ ...body, user_id: req.userId, purchase_date })
      .returning('*');

    await awardPoints(req.userId!, POINTS.ITEM_ADDED, 'item added to inventory');

    res.status(201).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

export async function updateInventoryItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db('inventory_items')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!existing) {
      next(createError('Item not found', 404));
      return;
    }

    const updateData = req.body as Record<string, unknown>;

    // Award points when item is marked consumed
    if (updateData.is_consumed === true && !existing.is_consumed) {
      await awardPoints(req.userId!, POINTS.ITEM_CONSUMED, 'item consumed');
      await db('users').where('id', req.userId).increment('items_saved', 1);
      if (existing.estimated_cost) {
        await db('users')
          .where('id', req.userId)
          .increment('money_saved', existing.estimated_cost as number);
      }
    }

    // Deduct points when item is marked wasted
    if (updateData.is_wasted === true && !existing.is_wasted) {
      await awardPoints(req.userId!, POINTS.ITEM_WASTED, 'item wasted');
      // Log the waste automatically
      await db('waste_logs').insert({
        user_id: req.userId,
        item_id: existing.id,
        item_name: existing.name,
        category: existing.category,
        quantity: existing.quantity,
        unit: existing.unit,
        estimated_cost: existing.estimated_cost,
        reason: 'expired',
      });
    }

    const [item] = await db('inventory_items')
      .where({ id: req.params.id, user_id: req.userId })
      .update(updateData)
      .returning('*');

    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

export async function deleteInventoryItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await db('inventory_items')
      .where({ id: req.params.id, user_id: req.userId })
      .delete();

    if (!deleted) {
      next(createError('Item not found', 404));
      return;
    }

    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getExpiryPrediction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { item_name, category, storage_type } = req.query;

    if (!item_name || !category) {
      next(createError('item_name and category are required', 400));
      return;
    }

    const prediction = await predictExpiry(
      item_name as string,
      category as string,
      (storage_type as string) ?? 'Refrigerator'
    );

    res.json({ success: true, data: { prediction } });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdateInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids, updates } = req.body as { ids: string[]; updates: Record<string, unknown> };

    if (!Array.isArray(ids) || ids.length === 0) {
      next(createError('ids array is required', 400));
      return;
    }

    await db('inventory_items')
      .whereIn('id', ids)
      .where('user_id', req.userId)
      .update(updates);

    res.json({ success: true, message: `Updated ${ids.length} items` });
  } catch (err) {
    next(err);
  }
}

import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export async function getShoppingList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { show_purchased } = req.query;
    let query = db('shopping_list_items').where('user_id', req.userId);
    if (show_purchased !== 'true') query = query.where('is_purchased', false);

    const items = await query.orderBy([
      { column: 'priority', order: 'desc' },
      { column: 'created_at', order: 'asc' },
    ]);

    res.json({ success: true, data: { items, count: items.length } });
  } catch (err) {
    next(err);
  }
}

export async function addShoppingItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const [item] = await db('shopping_list_items')
      .insert({ ...body, user_id: req.userId })
      .returning('*');

    res.status(201).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

export async function updateShoppingItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db('shopping_list_items')
      .where({ id: req.params.id, user_id: req.userId })
      .first();

    if (!existing) {
      next(createError('Shopping item not found', 404));
      return;
    }

    const [item] = await db('shopping_list_items')
      .where({ id: req.params.id, user_id: req.userId })
      .update(req.body as Record<string, unknown>)
      .returning('*');

    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

export async function deleteShoppingItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await db('shopping_list_items')
      .where({ id: req.params.id, user_id: req.userId })
      .delete();

    if (!deleted) {
      next(createError('Shopping item not found', 404));
      return;
    }

    res.json({ success: true, message: 'Item removed from shopping list' });
  } catch (err) {
    next(err);
  }
}

export async function clearPurchased(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await db('shopping_list_items')
      .where({ user_id: req.userId, is_purchased: true })
      .delete();

    res.json({ success: true, message: `Cleared ${deleted} purchased items` });
  } catch (err) {
    next(err);
  }
}

export async function generateAutoList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Find items nearly depleted (quantity <= 1) or consumed recently
    const lowItems = await db('inventory_items')
      .where('user_id', req.userId)
      .where('is_consumed', false)
      .where('is_wasted', false)
      .where('quantity', '<=', 1)
      .select('name', 'category', 'unit');

    const added: string[] = [];

    for (const item of lowItems) {
      // Check if already on the list
      const existing = await db('shopping_list_items')
        .where({ user_id: req.userId, name: item.name, is_purchased: false })
        .first();

      if (!existing) {
        await db('shopping_list_items').insert({
          user_id: req.userId,
          name: item.name as string,
          category: item.category as string,
          unit: item.unit as string,
          quantity: 1,
          is_auto_generated: true,
          priority: 5,
        });
        added.push(item.name as string);
      }
    }

    res.json({
      success: true,
      message: `Auto-generated ${added.length} shopping list items`,
      data: { added_items: added },
    });
  } catch (err) {
    next(err);
  }
}

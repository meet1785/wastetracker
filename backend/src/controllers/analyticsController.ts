import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

interface WasteByCategory {
  category: string;
  total_items: number;
  total_cost: string;
}

interface WasteByMonth {
  month: string;
  total_items: number;
  total_cost: string;
}

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    // Parallel queries for efficiency
    const [user, inventoryStats, expiringItems, recentWaste] = await Promise.all([
      db('users')
        .where('id', userId)
        .select('points', 'streak_days', 'items_saved', 'money_saved')
        .first(),
      db('inventory_items')
        .where('user_id', userId)
        .where('is_consumed', false)
        .where('is_wasted', false)
        .count('* as total')
        .first(),
      db('inventory_items')
        .where('user_id', userId)
        .where('is_consumed', false)
        .where('is_wasted', false)
        .whereRaw('expiry_date <= CURRENT_DATE + INTERVAL \'3 days\'')
        .whereRaw('expiry_date >= CURRENT_DATE')
        .count('* as expiring_soon')
        .first(),
      db('waste_logs')
        .where('user_id', userId)
        .whereRaw('logged_at >= NOW() - INTERVAL \'30 days\'')
        .count('* as recent_waste')
        .sum('estimated_cost as cost_wasted')
        .first(),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          total_items: parseInt(String(inventoryStats?.total ?? 0), 10),
          expiring_soon: parseInt(String(expiringItems?.expiring_soon ?? 0), 10),
          points: user?.points ?? 0,
          streak_days: user?.streak_days ?? 0,
          items_saved: user?.items_saved ?? 0,
          money_saved: parseFloat(String(user?.money_saved ?? 0)).toFixed(2),
          recent_waste_count: parseInt(String(recentWaste?.recent_waste ?? 0), 10),
          recent_waste_cost: parseFloat(String(recentWaste?.cost_wasted ?? 0)).toFixed(2),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getWasteAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { period = '30' } = req.query;
    const days = parseInt(period as string, 10);

    const [byCategory, byMonth, totalStats] = await Promise.all([
      db('waste_logs')
        .where('user_id', userId)
        .whereRaw('logged_at >= NOW() - INTERVAL \'? days\'', [days])
        .select('category')
        .count('* as total_items')
        .sum('estimated_cost as total_cost')
        .groupBy('category')
        .orderBy('total_items', 'desc') as unknown as Promise<WasteByCategory[]>,

      db('waste_logs')
        .where('user_id', userId)
        .whereRaw('logged_at >= NOW() - INTERVAL \'? days\'', [days])
        .select(db.raw('TO_CHAR(logged_at, \'YYYY-MM\') as month'))
        .count('* as total_items')
        .sum('estimated_cost as total_cost')
        .groupBy('month')
        .orderBy('month', 'asc') as unknown as Promise<WasteByMonth[]>,

      db('waste_logs')
        .where('user_id', userId)
        .whereRaw('logged_at >= NOW() - INTERVAL \'? days\'', [days])
        .count('* as total_waste_events')
        .sum('estimated_cost as total_cost_wasted')
        .first(),
    ]);

    res.json({
      success: true,
      data: {
        period_days: days,
        summary: {
          total_waste_events: parseInt(String(totalStats?.total_waste_events ?? 0), 10),
          total_cost_wasted: parseFloat(String(totalStats?.total_cost_wasted ?? 0)).toFixed(2),
        },
        by_category: byCategory,
        by_month: byMonth,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getWasteLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const [logs, countResult] = await Promise.all([
      db('waste_logs')
        .where('user_id', req.userId)
        .orderBy('logged_at', 'desc')
        .limit(parseInt(limit as string, 10))
        .offset(offset),
      db('waste_logs').where('user_id', req.userId).count('* as total').first(),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total: parseInt(String(countResult?.total ?? 0), 10),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createWasteLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;

    const [log] = await db('waste_logs')
      .insert({ ...body, user_id: req.userId })
      .returning('*');

    res.status(201).json({ success: true, data: { log } });
  } catch (err) {
    next(err);
  }
}

export async function getSavingsReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    const [user, consumedItems] = await Promise.all([
      db('users').where('id', userId).select('items_saved', 'money_saved').first(),
      db('inventory_items')
        .where({ user_id: userId, is_consumed: true })
        .whereRaw('updated_at >= NOW() - INTERVAL \'30 days\'')
        .sum('estimated_cost as monthly_saved')
        .count('* as monthly_items')
        .first(),
    ]);

    res.json({
      success: true,
      data: {
        all_time: {
          items_saved: user?.items_saved ?? 0,
          money_saved: parseFloat(String(user?.money_saved ?? 0)).toFixed(2),
        },
        last_30_days: {
          items_saved: parseInt(String(consumedItems?.monthly_items ?? 0), 10),
          money_saved: parseFloat(String(consumedItems?.monthly_saved ?? 0)).toFixed(2),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

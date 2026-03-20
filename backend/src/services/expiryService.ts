import db from '../config/database';

export interface ExpiryAlert {
  item_id: string;
  item_name: string;
  expiry_date: string;
  days_until_expiry: number;
  user_id: string;
}

/**
 * Returns all active (non-consumed, non-wasted) inventory items expiring within
 * the given threshold for a specific user.
 */
export async function getExpiringItems(
  userId: string,
  withinDays: number = 3
): Promise<ExpiryAlert[]> {
  const rows = await db('inventory_items')
    .where('user_id', userId)
    .where('is_consumed', false)
    .where('is_wasted', false)
    .whereRaw('expiry_date <= CURRENT_DATE + INTERVAL \'? days\'', [withinDays])
    .whereRaw('expiry_date >= CURRENT_DATE')
    .select('id', 'name', 'expiry_date', 'user_id')
    .orderBy('expiry_date', 'asc');

  return rows.map(row => ({
    item_id: row.id as string,
    item_name: row.name as string,
    expiry_date: row.expiry_date as string,
    days_until_expiry: Math.ceil(
      (new Date(row.expiry_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
    user_id: row.user_id as string,
  }));
}

/**
 * Returns all items that have already passed their expiry date.
 */
export async function getExpiredItems(userId: string): Promise<ExpiryAlert[]> {
  const rows = await db('inventory_items')
    .where('user_id', userId)
    .where('is_consumed', false)
    .where('is_wasted', false)
    .whereRaw('expiry_date < CURRENT_DATE')
    .select('id', 'name', 'expiry_date', 'user_id')
    .orderBy('expiry_date', 'asc');

  return rows.map(row => ({
    item_id: row.id as string,
    item_name: row.name as string,
    expiry_date: row.expiry_date as string,
    days_until_expiry: Math.ceil(
      (new Date(row.expiry_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
    user_id: row.user_id as string,
  }));
}

/**
 * Suggests recommended storage type based on category.
 */
export function getRecommendedStorage(category: string): string {
  const storageMap: Record<string, string> = {
    Dairy: 'Refrigerator',
    Meat: 'Refrigerator',
    Vegetables: 'Refrigerator',
    Fruits: 'Counter',
    Grains: 'Pantry',
    Beverages: 'Refrigerator',
    Condiments: 'Refrigerator',
    Frozen: 'Freezer',
    Other: 'Pantry',
  };
  return storageMap[category] ?? 'Pantry';
}

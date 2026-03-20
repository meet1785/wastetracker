import db from '../config/database';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  badge_type: string;
}

export const POINTS = {
  ITEM_ADDED: 5,
  ITEM_CONSUMED: 20,
  RECIPE_USED: 15,
  ITEM_WASTED: -5,
  STREAK_BONUS: 10,
  COMMUNITY_POST: 10,
} as const;

/**
 * Adds or subtracts points for a user and returns the new total.
 */
export async function awardPoints(userId: string, points: number, reason: string): Promise<number> {
  console.log(`[Gamification] Awarding ${points} points to user ${userId} for: ${reason}`);

  await db('users')
    .where('id', userId)
    .increment('points', points);

  const [user] = await db('users').where('id', userId).select('points');
  const newTotal = (user?.points as number) ?? 0;

  // Check and award badges after every point update
  await checkAndAwardBadges(userId);

  return newTotal;
}

/**
 * Updates the user's streak and awards bonus points on increment.
 */
export async function updateStreak(userId: string): Promise<{ streak_days: number; bonus_points: number }> {
  const [user] = await db('users').where('id', userId).select('last_active', 'streak_days');
  if (!user) return { streak_days: 0, bonus_points: 0 };

  const today = new Date().toISOString().split('T')[0];
  const lastActive = user.last_active
    ? new Date(user.last_active as string).toISOString().split('T')[0]
    : null;

  let newStreak = (user.streak_days as number) ?? 0;
  let bonusPoints = 0;

  if (lastActive === today) {
    // Already active today — no change
    return { streak_days: newStreak, bonus_points: 0 };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActive === yesterdayStr) {
    newStreak += 1;
    bonusPoints = POINTS.STREAK_BONUS;
  } else {
    newStreak = 1; // reset
  }

  await db('users').where('id', userId).update({
    streak_days: newStreak,
    last_active: today,
    points: db.raw('points + ?', [bonusPoints]),
  });

  return { streak_days: newStreak, bonus_points: bonusPoints };
}

/**
 * Checks whether the user qualifies for any new badges and awards them.
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const [user] = await db('users')
    .where('id', userId)
    .select('points', 'streak_days', 'items_saved');

  if (!user) return [];

  const allBadges: Badge[] = await db('badges').select('*');
  const existingBadgeIds: string[] = (
    await db('user_badges').where('user_id', userId).pluck('badge_id')
  ) as string[];

  const newlyEarned: Badge[] = [];

  for (const badge of allBadges) {
    if (existingBadgeIds.includes(badge.id)) continue;

    let qualifies = false;

    switch (badge.badge_type) {
      case 'points':
        qualifies = (user.points as number) >= badge.points_required;
        break;
      case 'streak':
        qualifies =
          (badge.name.includes('Week') && (user.streak_days as number) >= 7) ||
          (badge.name.includes('Month') && (user.streak_days as number) >= 30);
        break;
      case 'items_saved':
        qualifies =
          (badge.name === 'First Save' && (user.items_saved as number) >= 1) ||
          (badge.name === 'Eco Warrior' && (user.items_saved as number) >= 10) ||
          (badge.name === 'Zero Waste Hero' && (user.items_saved as number) >= 50);
        break;
      default:
        break;
    }

    if (qualifies) {
      await db('user_badges').insert({ user_id: userId, badge_id: badge.id }).onConflict().ignore();
      newlyEarned.push(badge);
    }
  }

  return newlyEarned;
}

/**
 * Returns the user's full badge collection with earned status.
 */
export async function getUserBadges(userId: string): Promise<Array<Badge & { earned: boolean; earned_at?: Date }>> {
  const allBadges: Badge[] = await db('badges').select('*').orderBy('points_required', 'asc');
  const earnedBadges: Array<{ badge_id: string; earned_at: Date }> = await db('user_badges')
    .where('user_id', userId)
    .select('badge_id', 'earned_at');

  const earnedMap = new Map(earnedBadges.map(b => [b.badge_id, b.earned_at]));

  return allBadges.map(badge => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earned_at: earnedMap.get(badge.id),
  }));
}

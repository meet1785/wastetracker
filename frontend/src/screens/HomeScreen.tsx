import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootState, AppDispatch } from '../store';
import { fetchDashboardThunk } from '../store/analyticsSlice';
import { fetchInventoryThunk } from '../store/inventorySlice';
import { fetchRecommendationsThunk } from '../store/recipeSlice';
import { COLORS } from '../utils/constants';
import { getExpiryStatus } from '../utils/expiryHelper';
import RecipeCard from '../components/RecipeCard';
import ExpiryBadge from '../components/ExpiryBadge';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<Nav>();

  const { user } = useSelector((state: RootState) => state.auth);
  const { dashboard, loading: analyticsLoading } = useSelector((state: RootState) => state.analytics);
  const { items } = useSelector((state: RootState) => state.inventory);
  const { recommendations } = useSelector((state: RootState) => state.recipes);

  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchDashboardThunk());
    dispatch(fetchInventoryThunk({ expiring_within: 7 }));
    dispatch(fetchRecommendationsThunk());
  }, [dispatch]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchDashboardThunk()),
      dispatch(fetchInventoryThunk({ expiring_within: 7 })),
      dispatch(fetchRecommendationsThunk()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const expiringItems = items
    .filter(i => {
      const s = getExpiryStatus(i.expiry_date);
      return s === 'critical' || s === 'warning' || s === 'caution';
    })
    .slice(0, 5);

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>{greetingTime()}, {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
          <Text style={styles.greetingSub}>Let&apos;s reduce waste today</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={styles.pointsText}>{dashboard?.points ?? user?.points ?? 0}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      {analyticsLoading && !dashboard ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard icon="🥗" label="Items in Fridge" value={String(dashboard?.total_items ?? 0)} color={COLORS.info} />
          <StatCard icon="⚠️" label="Expiring Soon" value={String(dashboard?.expiring_soon ?? 0)} color={COLORS.warning} highlight={!!dashboard?.expiring_soon} />
          <StatCard icon="♻️" label="Items Saved" value={String(dashboard?.items_saved ?? user?.items_saved ?? 0)} color={COLORS.primary} />
          <StatCard icon="💰" label="Money Saved" value={`$${parseFloat(dashboard?.money_saved ?? String(user?.money_saved ?? 0)).toFixed(0)}`} color={COLORS.primaryDark} />
        </View>
      )}

      {/* Streak Banner */}
      {(dashboard?.streak_days ?? 0) > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakText}>
            {dashboard?.streak_days}-day streak! Keep it up!
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <QuickAction icon="➕" label="Add Food" onPress={() => navigation.navigate('AddItem')} color={COLORS.primary} />
          <QuickAction icon="🛒" label="Shopping List" onPress={() => navigation.navigate('ShoppingList')} color={COLORS.info} />
          <QuickAction icon="🤝" label="Community" onPress={() => navigation.navigate('Community')} color={COLORS.secondary} />
        </View>
      </View>

      {/* Expiring Soon */}
      {expiringItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expiring Soon ⚠️</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.expiringList}>
            {expiringItems.map(item => (
              <View key={item.id} style={styles.expiringCard}>
                <Text style={styles.expiringName} numberOfLines={1}>{item.name}</Text>
                <ExpiryBadge expiryDate={item.expiry_date} compact />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* AI Recipe Suggestions */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Recipe Ideas</Text>
          <Text style={styles.sectionSub}>Based on your expiring ingredients</Text>
          {recommendations.slice(0, 2).map(recipe => (
            <RecipeCard key={recipe.id ?? recipe.name} recipe={recipe} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, highlight }: { icon: string; label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <View style={[styles.statCard, highlight && { borderColor: color, borderWidth: 2 }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Text style={styles.quickActionEmoji}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 24 },
  loader: { marginVertical: 24 },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  greetingSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  pointsIcon: { fontSize: 16 },
  pointsText: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  streakFire: { fontSize: 20 },
  streakText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  section: { marginTop: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: 20, marginBottom: 8 },
  sectionSub: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: 20, marginTop: -6, marginBottom: 8 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickActionEmoji: { fontSize: 28 },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  expiringList: { paddingHorizontal: 16, gap: 10 },
  expiringCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    width: 120,
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  expiringName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});

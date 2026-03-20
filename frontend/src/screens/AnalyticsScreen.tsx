import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchDashboardThunk, fetchWasteAnalyticsThunk } from '../store/analyticsSlice';
import { COLORS } from '../utils/constants';
import WasteChart from '../components/WasteChart';

const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function AnalyticsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboard, waste, loading } = useSelector((state: RootState) => state.analytics);
  const [period, setPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardThunk());
    dispatch(fetchWasteAnalyticsThunk(period));
  }, [dispatch, period]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchDashboardThunk()),
      dispatch(fetchWasteAnalyticsThunk(period)),
    ]);
    setRefreshing(false);
  }, [dispatch, period]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
    >
      {/* Summary Cards */}
      <Text style={styles.sectionTitle}>Your Impact 🌍</Text>
      <View style={styles.impactGrid}>
        <ImpactCard icon="♻️" label="Items Saved" value={String(dashboard?.items_saved ?? 0)} color={COLORS.primary} />
        <ImpactCard icon="💰" label="Money Saved" value={`$${parseFloat(dashboard?.money_saved ?? '0').toFixed(2)}`} color={COLORS.primaryDark} />
        <ImpactCard icon="🔥" label="Streak" value={`${dashboard?.streak_days ?? 0}d`} color={COLORS.secondary} />
        <ImpactCard icon="⭐" label="Points" value={String(dashboard?.points ?? 0)} color={COLORS.warning} />
      </View>

      {/* Period Filter */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.value}
            style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
            onPress={() => setPeriod(p.value)}
          >
            <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !waste ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <>
          {/* Waste Summary */}
          <View style={styles.wasteSummary}>
            <View style={styles.wasteStat}>
              <Text style={styles.wasteStatValue}>{waste?.summary.total_waste_events ?? 0}</Text>
              <Text style={styles.wasteStatLabel}>Items Wasted</Text>
            </View>
            <View style={styles.wasteDivider} />
            <View style={styles.wasteStat}>
              <Text style={[styles.wasteStatValue, { color: COLORS.danger }]}>
                ${parseFloat(waste?.summary.total_cost_wasted ?? '0').toFixed(2)}
              </Text>
              <Text style={styles.wasteStatLabel}>Cost of Waste</Text>
            </View>
          </View>

          {/* Waste Over Time Chart */}
          <View style={styles.chartCard}>
            <WasteChart
              data={waste?.by_month ?? []}
              type="bar"
              title="Items Wasted by Month"
            />
          </View>

          <View style={styles.chartCard}>
            <WasteChart
              data={waste?.by_month ?? []}
              type="line"
              showCost
              title="Cost of Waste by Month ($)"
            />
          </View>

          {/* Waste by Category */}
          {(waste?.by_category ?? []).length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Waste by Category</Text>
              {(waste?.by_category ?? []).map(cat => (
                <View key={cat.category} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <View style={styles.categoryBarBg}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${Math.min(100, (cat.total_items / Math.max(...(waste?.by_category ?? []).map(c => c.total_items))) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryCount}>{cat.total_items}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Waste Reduction Tips</Text>
            <Text style={styles.tip}>• Plan meals weekly to avoid over-purchasing</Text>
            <Text style={styles.tip}>• Store produce in the correct place (not everything in fridge)</Text>
            <Text style={styles.tip}>• Use the FIFO method: First In, First Out</Text>
            <Text style={styles.tip}>• Freeze items before they expire</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ImpactCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.impactCard, { borderTopColor: color }]}>
      <Text style={styles.impactIcon}>{icon}</Text>
      <Text style={[styles.impactValue, { color }]}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  impactCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  impactIcon: { fontSize: 28, marginBottom: 8 },
  impactValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  impactLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodBtn: { flex: 1, borderRadius: 10, padding: 10, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  periodTextActive: { color: '#fff', fontWeight: '700' },
  loader: { marginTop: 48 },
  wasteSummary: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20,
    marginBottom: 16, justifyContent: 'space-around',
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  wasteStat: { alignItems: 'center' },
  wasteStatValue: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  wasteStatLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  wasteDivider: { width: 1, backgroundColor: COLORS.border },
  chartCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  categoryName: { width: 80, fontSize: 13, color: COLORS.textSecondary },
  categoryBarBg: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  categoryBarFill: { height: 8, backgroundColor: COLORS.danger, borderRadius: 4 },
  categoryCount: { width: 24, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'right' },
  tipsCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 10 },
  tip: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 6, lineHeight: 20 },
});

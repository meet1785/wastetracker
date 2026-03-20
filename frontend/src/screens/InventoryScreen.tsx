import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../store';
import { fetchInventoryThunk, updateInventoryItemThunk, deleteInventoryItemThunk, InventoryItem } from '../store/inventorySlice';
import { COLORS, FOOD_CATEGORIES } from '../utils/constants';
import InventoryItemCard from '../components/InventoryItem';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS = ['All', 'Expiring', ...FOOD_CATEGORIES] as const;

export default function InventoryScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<Nav>();
  const { items, loading } = useSelector((state: RootState) => state.inventory);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { dispatch(fetchInventoryThunk({})); }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchInventoryThunk({}));
    setRefreshing(false);
  }, [dispatch]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.brand ?? '').toLowerCase().includes(search.toLowerCase());

    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Expiring') {
      const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000);
      return matchesSearch && days <= 7 && days >= 0;
    }
    return matchesSearch && item.category === activeFilter;
  });

  function handleConsume(item: InventoryItem) {
    Alert.alert(
      'Mark as Consumed?',
      `Did you use "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, consumed!',
          onPress: () => dispatch(updateInventoryItemThunk({ id: item.id, data: { is_consumed: true } })),
        },
      ]
    );
  }

  function handleWaste(item: InventoryItem) {
    Alert.alert(
      'Mark as Wasted?',
      `Was "${item.name}" thrown away?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, wasted',
          style: 'destructive',
          onPress: () => dispatch(updateInventoryItemThunk({ id: item.id, data: { is_wasted: true } })),
        },
      ]
    );
  }

  function handleDelete(item: InventoryItem) {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteInventoryItemThunk(item.id)),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddItem')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={styles.count}>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</Text>

      {loading && items.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <InventoryItemCard
              item={item}
              onPress={() => handleDelete(item)}
              onConsume={handleConsume}
              onWaste={handleWaste}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🥗</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'No items match your search' : 'Your pantry is empty'}
              </Text>
              <Text style={styles.emptySub}>
                {search ? 'Try a different keyword' : 'Tap + to add your first food item'}
              </Text>
              {!search && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddItem')}>
                  <Text style={styles.emptyBtnText}>Add Food Item</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={filteredItems.length === 0 ? styles.emptyContainer : styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  clearIcon: { fontSize: 14, color: COLORS.textTertiary },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
  filters: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  count: { fontSize: 13, color: COLORS.textTertiary, paddingHorizontal: 20, marginBottom: 4 },
  loader: { marginTop: 48 },
  list: { paddingVertical: 4, paddingBottom: 20 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

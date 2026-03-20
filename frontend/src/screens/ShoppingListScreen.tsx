import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FOOD_CATEGORIES, CATEGORY_ICONS } from '../utils/constants';
import { shoppingApi } from '../services/api';

interface ShoppingItem {
  id: string;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  is_purchased: boolean;
  is_auto_generated: boolean;
  priority: number;
}

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('units');
  const [generatingAuto, setGeneratingAuto] = useState(false);

  async function loadList() {
    try {
      const res = await shoppingApi.getList(false);
      setItems(res.data.data.items as ShoppingItem[]);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadList().finally(() => setLoading(false));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadList();
    setRefreshing(false);
  }, []);

  async function togglePurchased(item: ShoppingItem) {
    try {
      await shoppingApi.updateItem(item.id, { is_purchased: !item.is_purchased });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i));
    } catch { Alert.alert('Error', 'Could not update item.'); }
  }

  async function handleDelete(item: ShoppingItem) {
    Alert.alert('Remove Item', `Remove "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await shoppingApi.deleteItem(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
          } catch { Alert.alert('Error', 'Could not remove item.'); }
        },
      },
    ]);
  }

  async function handleAddItem() {
    if (!newItemName.trim()) { Alert.alert('Required', 'Enter a name.'); return; }
    try {
      const res = await shoppingApi.addItem({
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: parseFloat(newItemQty) || 1,
        unit: newItemUnit || 'units',
      });
      setItems(prev => [...prev, res.data.data.item as ShoppingItem]);
      setShowAddModal(false);
      setNewItemName(''); setNewItemCategory('Other'); setNewItemQty('1'); setNewItemUnit('units');
    } catch { Alert.alert('Error', 'Could not add item.'); }
  }

  async function handleAutoGenerate() {
    setGeneratingAuto(true);
    try {
      const res = await shoppingApi.autoGenerate();
      const added = res.data.data.added_items as string[];
      if (added.length > 0) {
        await loadList();
        Alert.alert('✅ Auto-Generated', `Added ${added.length} item${added.length > 1 ? 's' : ''} to your list.`);
      } else {
        Alert.alert('Up to Date', 'No items need restocking right now.');
      }
    } catch { Alert.alert('Error', 'Could not generate list.'); }
    setGeneratingAuto(false);
  }

  async function handleClearPurchased() {
    const purchasedCount = items.filter(i => i.is_purchased).length;
    if (purchasedCount === 0) { Alert.alert('Nothing to Clear', 'No purchased items.'); return; }
    Alert.alert('Clear Purchased', `Remove ${purchasedCount} purchased item${purchasedCount > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          try {
            await shoppingApi.clearPurchased();
            setItems(prev => prev.filter(i => !i.is_purchased));
          } catch { Alert.alert('Error', 'Could not clear items.'); }
        },
      },
    ]);
  }

  const pending = items.filter(i => !i.is_purchased);
  const purchased = items.filter(i => i.is_purchased);

  return (
    <View style={styles.container}>
      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.actionBtnText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.autoBtn, generatingAuto && styles.disabled]}
          onPress={handleAutoGenerate}
          disabled={generatingAuto}
        >
          {generatingAuto ? <ActivityIndicator size="small" color={COLORS.info} /> : <Text style={styles.autoBtnText}>🤖 Auto-Fill</Text>}
        </TouchableOpacity>
        {purchased.length > 0 && (
          <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={handleClearPurchased}>
            <Text style={styles.clearBtnText}>🗑 Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {pending.length} remaining · {purchased.length} purchased
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={[...pending, ...purchased]}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, item.is_purchased && styles.itemPurchased]}
              onPress={() => togglePurchased(item)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, item.is_purchased && styles.checkboxChecked]}>
                {item.is_purchased && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.category ?? 'Other'] ?? '📦'}</Text>
                  <Text style={[styles.itemName, item.is_purchased && styles.itemNamePurchased]}>
                    {item.name}
                  </Text>
                  {item.is_auto_generated && (
                    <View style={styles.autoBadge}><Text style={styles.autoBadgeText}>auto</Text></View>
                  )}
                </View>
                <Text style={styles.itemMeta}>
                  {item.quantity ?? 1} {item.unit ?? 'units'}
                  {item.category && ` · ${item.category}`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>Your list is empty</Text>
              <Text style={styles.emptySub}>Add items manually or use Auto-Fill to suggest items you need</Text>
            </View>
          }
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        />
      )}

      {/* Add Item Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Item</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>Name *</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Greek Yogurt" placeholderTextColor={COLORS.textTertiary} value={newItemName} onChangeText={setNewItemName} autoFocus />
          </View>

          <View style={styles.modalRow}>
            <View style={[styles.modalField, { flex: 1 }]}>
              <Text style={styles.modalLabel}>Qty</Text>
              <TextInput style={styles.modalInput} placeholder="1" value={newItemQty} onChangeText={setNewItemQty} keyboardType="numeric" placeholderTextColor={COLORS.textTertiary} />
            </View>
            <View style={[styles.modalField, { flex: 1 }]}>
              <Text style={styles.modalLabel}>Unit</Text>
              <TextInput style={styles.modalInput} placeholder="units" value={newItemUnit} onChangeText={setNewItemUnit} placeholderTextColor={COLORS.textTertiary} />
            </View>
          </View>

          <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddItem}>
            <Text style={styles.modalSaveBtnText}>Add to List</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  actionBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.primary, justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  autoBtn: { backgroundColor: COLORS.infoLight },
  autoBtnText: { color: COLORS.info, fontWeight: '700', fontSize: 14 },
  clearBtn: { backgroundColor: COLORS.dangerLight, marginLeft: 'auto' },
  clearBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.6 },
  stats: { paddingHorizontal: 16, paddingVertical: 8 },
  statsText: { fontSize: 13, color: COLORS.textSecondary },
  loader: { marginTop: 48 },
  list: { paddingVertical: 4, paddingBottom: 20 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 12, marginVertical: 4,
    backgroundColor: COLORS.surface, borderRadius: 12, gap: 12,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2, elevation: 1,
  },
  itemPurchased: { opacity: 0.6 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 13 },
  itemContent: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  categoryIcon: { fontSize: 16 },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  itemNamePurchased: { textDecorationLine: 'line-through', color: COLORS.textTertiary },
  autoBadge: { backgroundColor: COLORS.infoLight, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  autoBadgeText: { fontSize: 10, color: COLORS.info, fontWeight: '600' },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary },
  deleteIcon: { fontSize: 14, color: COLORS.textTertiary, padding: 4 },
  modal: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  modalClose: { fontSize: 20, color: COLORS.textSecondary },
  modalField: { marginBottom: 16 },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.surface },
  modalSaveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  modalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

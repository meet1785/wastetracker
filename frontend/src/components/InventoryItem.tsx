import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, CATEGORY_ICONS, STORAGE_ICONS } from '../utils/constants';
import { getExpiryStatus, getExpiryLabel, getExpiryColor, getExpiryBackgroundColor } from '../utils/expiryHelper';
import { InventoryItem } from '../store/inventorySlice';
import ExpiryBadge from './ExpiryBadge';

interface Props {
  item: InventoryItem;
  onPress?: (item: InventoryItem) => void;
  onConsume?: (item: InventoryItem) => void;
  onWaste?: (item: InventoryItem) => void;
}

export default function InventoryItemCard({ item, onPress, onConsume, onWaste }: Props) {
  const status = getExpiryStatus(item.expiry_date);
  const bgColor = getExpiryBackgroundColor(status);
  const borderColor = getExpiryColor(status);
  const categoryIcon = CATEGORY_ICONS[item.category] ?? '📦';
  const storageIcon = STORAGE_ICONS[item.storage_type] ?? '📦';

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: borderColor, backgroundColor: status === 'expired' ? COLORS.dangerLight : COLORS.surface }]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <Text style={styles.categoryIcon}>{categoryIcon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <ExpiryBadge expiryDate={item.expiry_date} />
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{storageIcon} {item.storage_type}</Text>
          <Text style={styles.metaText}>  ·  </Text>
          <Text style={styles.metaText}>Qty: {item.quantity} {item.unit}</Text>
          {item.brand && <Text style={styles.metaText}>  ·  {item.brand}</Text>}
        </View>

        <View style={[styles.expiryBar, { backgroundColor: bgColor }]}>
          <Text style={[styles.expiryText, { color: borderColor }]}>
            {getExpiryLabel(item.expiry_date)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onConsume && (
          <TouchableOpacity style={[styles.actionBtn, styles.consumeBtn]} onPress={() => onConsume(item)}>
            <Text style={styles.actionBtnText}>✓</Text>
          </TouchableOpacity>
        )}
        {onWaste && (
          <TouchableOpacity style={[styles.actionBtn, styles.wasteBtn]} onPress={() => onWaste(item)}>
            <Text style={styles.actionBtnText}>✗</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: { fontSize: 22 },
  content: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  expiryBar: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  expiryText: { fontSize: 12, fontWeight: '600' },
  actions: { marginLeft: 8, gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consumeBtn: { backgroundColor: COLORS.primaryLight },
  wasteBtn: { backgroundColor: COLORS.dangerLight },
  actionBtnText: { fontSize: 16, fontWeight: '700' },
});

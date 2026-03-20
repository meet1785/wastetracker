import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getExpiryStatus, getExpiryColor, getExpiryBackgroundColor, getDaysUntilExpiry } from '../utils/expiryHelper';

interface Props {
  expiryDate: string;
  compact?: boolean;
}

export default function ExpiryBadge({ expiryDate, compact = false }: Props) {
  const status = getExpiryStatus(expiryDate);
  const color = getExpiryColor(status);
  const bgColor = getExpiryBackgroundColor(status);
  const days = getDaysUntilExpiry(expiryDate);

  const label = (() => {
    if (days < 0) return compact ? `${Math.abs(days)}d ago` : 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return compact ? '1d' : 'Tomorrow';
    return compact ? `${days}d` : `${days} days`;
  })();

  const emoji = (() => {
    if (days < 0) return '💀';
    if (days <= 1) return '🔴';
    if (days <= 3) return '🟠';
    if (days <= 7) return '🟡';
    return '🟢';
  })();

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color }, compact && styles.compact]}>
      {!compact && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.text, { color }, compact && styles.compactText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 4,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emoji: { fontSize: 12 },
  text: { fontSize: 12, fontWeight: '700' },
  compactText: { fontSize: 11 },
});

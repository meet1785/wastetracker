import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at?: Date;
}

interface Props {
  badge: Badge;
  size?: 'small' | 'medium' | 'large';
}

export default function GamificationBadge({ badge, size = 'medium' }: Props) {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View style={[styles.container, sizeStyle.container, !badge.earned && styles.unearned]}>
      <View style={[styles.iconWrapper, sizeStyle.iconWrapper, badge.earned && styles.earnedIcon]}>
        <Text style={sizeStyle.icon}>{badge.icon}</Text>
      </View>
      {size !== 'small' && (
        <View style={styles.textWrapper}>
          <Text style={[styles.name, !badge.earned && styles.unearnedText]} numberOfLines={1}>
            {badge.name}
          </Text>
          {size === 'large' && (
            <Text style={styles.description} numberOfLines={2}>{badge.description}</Text>
          )}
          {badge.earned && badge.earned_at && (
            <Text style={styles.earnedAt}>
              Earned {new Date(badge.earned_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const SIZE_STYLES = {
  small: {
    container: { width: 56, height: 56 },
    iconWrapper: { width: 48, height: 48, borderRadius: 24 },
    icon: { fontSize: 24 } as object,
  },
  medium: {
    container: { width: 90, alignItems: 'center' as const },
    iconWrapper: { width: 60, height: 60, borderRadius: 30, marginBottom: 6 },
    icon: { fontSize: 28 } as object,
  },
  large: {
    container: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 12 },
    iconWrapper: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
    icon: { fontSize: 26 } as object,
  },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  unearned: { opacity: 0.4 },
  iconWrapper: {
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  earnedIcon: {
    backgroundColor: COLORS.primaryLight,
    shadowColor: COLORS.primary,
  },
  textWrapper: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  unearnedText: { color: COLORS.textTertiary },
  description: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  earnedAt: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
});

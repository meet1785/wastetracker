import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  RefreshControl, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/authSlice';
import { clearInventory } from '../store/inventorySlice';
import { fetchDashboardThunk } from '../store/analyticsSlice';
import { authApi } from '../services/api';
import { COLORS } from '../utils/constants';
import GamificationBadge from '../components/GamificationBadge';

const ALL_BADGES = [
  { id: '1', name: 'First Save', description: 'Save your first food item', icon: '🌱', threshold: 1 },
  { id: '2', name: '10 Saves', description: 'Save 10 food items', icon: '🥗', threshold: 10 },
  { id: '3', name: '50 Saves', description: 'Save 50 food items', icon: '🌿', threshold: 50 },
  { id: '4', name: 'Week Streak', description: '7-day login streak', icon: '🔥', threshold: 7 },
  { id: '5', name: 'Month Streak', description: '30-day login streak', icon: '⚡', threshold: 30 },
  { id: '6', name: 'Chef', description: 'Use 5 AI recipes', icon: '👨‍🍳', threshold: 5 },
  { id: '7', name: 'Community Hero', description: 'Share food 3 times', icon: '🤝', threshold: 3 },
  { id: '8', name: '$10 Saved', description: 'Save $10 worth of food', icon: '💰', threshold: 10 },
];

const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher'];

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { dashboard } = useSelector((state: RootState) => state.analytics);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editDietary, setEditDietary] = useState<string[]>(user?.dietary_preferences ?? []);
  const [saving, setSaving] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchDashboardThunk());
    setRefreshing(false);
  }, [dispatch]);

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          dispatch(clearInventory());
        },
      },
    ]);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await authApi.updateProfile({ name: editName.trim(), dietary_preferences: editDietary });
      setShowEditModal(false);
      Alert.alert('✅ Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not update profile.');
    }
    setSaving(false);
  }

  function toggleDietary(opt: string) {
    setEditDietary(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  }

  const itemsSaved = dashboard?.items_saved ?? user?.items_saved ?? 0;
  const moneySaved = parseFloat(dashboard?.money_saved ?? String(user?.money_saved ?? 0));
  const points = dashboard?.points ?? user?.points ?? 0;
  const streak = dashboard?.streak_days ?? user?.streak_days ?? 0;

  const earnedBadges = ALL_BADGES.filter(badge => {
    switch (badge.id) {
      case '1': return itemsSaved >= 1;
      case '2': return itemsSaved >= 10;
      case '3': return itemsSaved >= 50;
      case '4': return streak >= 7;
      case '5': return streak >= 30;
      case '8': return moneySaved >= 10;
      default: return false;
    }
  }).map(b => b.id);

  const levelInfo = getLevel(points);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
    >
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.levelRow}>
            <View style={[styles.levelBadge, { backgroundColor: levelInfo.color }]}>
              <Text style={styles.levelText}>{levelInfo.icon} {levelInfo.name}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => { setEditName(user?.name ?? ''); setEditDietary(user?.dietary_preferences ?? []); setShowEditModal(true); }}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* XP Bar */}
      <View style={styles.xpCard}>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>Level {levelInfo.level} · {points} pts</Text>
          <Text style={styles.xpLabel}>{levelInfo.nextLevelPts} pts to level {levelInfo.level + 1}</Text>
        </View>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${levelInfo.progress * 100}%` }]} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox icon="♻️" label="Items Saved" value={String(itemsSaved)} />
        <StatBox icon="💰" label="$ Saved" value={`$${moneySaved.toFixed(0)}`} />
        <StatBox icon="🔥" label="Streak" value={`${streak}d`} />
        <StatBox icon="⭐" label="Points" value={String(points)} />
      </View>

      {/* Dietary Preferences */}
      {(user?.dietary_preferences ?? []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.chips}>
            {(user?.dietary_preferences ?? []).map(pref => (
              <View key={pref} style={styles.chip}>
                <Text style={styles.chipText}>{pref}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements 🏆</Text>
        <View style={styles.badgesGrid}>
          {ALL_BADGES.map(badge => (
            <GamificationBadge
              key={badge.id}
              badge={{ ...badge, earned: earnedBadges.includes(badge.id) }}
              size="medium"
            />
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <SettingsRow icon="🔔" label="Expiry Notifications" onPress={() => Alert.alert('Notifications', 'Manage notification settings in your device settings.')} />
          <SettingsRow icon="🔒" label="Change Password" onPress={() => Alert.alert('Change Password', 'Password change coming soon.')} />
          <SettingsRow icon="📤" label="Export My Data" onPress={() => Alert.alert('Export', 'Data export coming soon.')} />
          <SettingsRow icon="🗑" label="Delete Account" danger onPress={() => Alert.alert('Delete Account', 'This will permanently delete your account and all data.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => {} }])} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={COLORS.textTertiary} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Dietary Preferences</Text>
            <View style={styles.chipsRow}>
              {DIETARY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dietChip, editDietary.includes(opt) && styles.dietChipSelected]}
                  onPress={() => toggleDietary(opt)}
                >
                  <Text style={[styles.dietChipText, editDietary.includes(opt) && styles.dietChipTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function getLevel(points: number) {
  const levels = [
    { level: 1, name: 'Seedling', icon: '🌱', color: '#86EFAC', pts: 0, next: 100 },
    { level: 2, name: 'Sprout', icon: '🌿', color: '#4ADE80', pts: 100, next: 300 },
    { level: 3, name: 'Green Thumb', icon: '🌾', color: '#22C55E', pts: 300, next: 600 },
    { level: 4, name: 'Food Saver', icon: '🥗', color: '#16A34A', pts: 600, next: 1000 },
    { level: 5, name: 'Eco Warrior', icon: '🌍', color: '#15803D', pts: 1000, next: 2000 },
    { level: 6, name: 'Zero Waste Hero', icon: '⭐', color: '#166534', pts: 2000, next: Infinity },
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    const lvl = levels[i];
    if (points >= lvl.pts) {
      const progress = lvl.next === Infinity ? 1 : (points - lvl.pts) / (lvl.next - lvl.pts);
      return { ...lvl, progress: Math.min(1, progress), nextLevelPts: lvl.next === Infinity ? 0 : lvl.next - points };
    }
  }
  return { ...levels[0], progress: 0, nextLevelPts: 100 };
}

function StatBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxIcon}>{icon}</Text>
      <Text style={styles.statBoxValue}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, danger, onPress }: { icon: string; label: string; danger?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[styles.settingsLabel, danger && styles.settingsDanger]}>{label}</Text>
      <Text style={styles.settingsArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 20, padding: 20, marginBottom: 12,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  levelRow: { flexDirection: 'row' },
  levelBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  editBtn: { padding: 8 },
  editBtnText: { fontSize: 20 },
  xpCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  xpBarBg: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  xpBarFill: { height: 10, backgroundColor: COLORS.primary, borderRadius: 5 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  statBoxIcon: { fontSize: 22, marginBottom: 4 },
  statBoxValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  statBoxLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '600' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-around' },
  settingsCard: { backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingsIcon: { fontSize: 18, width: 32 },
  settingsLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  settingsDanger: { color: COLORS.danger },
  settingsArrow: { fontSize: 20, color: COLORS.textTertiary },
  logoutBtn: { backgroundColor: COLORS.dangerLight, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  logoutBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 16 },
  modal: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  modalClose: { fontSize: 20, color: COLORS.textSecondary },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.surface },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dietChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.surface },
  dietChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  dietChipText: { fontSize: 13, color: COLORS.textSecondary },
  dietChipTextSelected: { color: COLORS.primaryDark, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  disabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

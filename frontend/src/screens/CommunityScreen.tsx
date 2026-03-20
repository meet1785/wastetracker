import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
  Alert, ScrollView,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { communityApi } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Post {
  id: string;
  title: string;
  description?: string;
  item_name: string;
  quantity?: number;
  unit?: string;
  post_type: 'give' | 'sell' | 'trade';
  price?: number;
  location?: string;
  is_available: boolean;
  author_name: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  give: COLORS.primary,
  sell: COLORS.secondary,
  trade: COLORS.info,
};

const TYPE_LABELS: Record<string, string> = {
  give: '🎁 Free',
  sell: '💰 For Sale',
  trade: '🔄 Trade',
};

export default function CommunityScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formItemName, setFormItemName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<'give' | 'sell' | 'trade'>('give');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState('units');
  const [submitting, setSubmitting] = useState(false);

  async function loadPosts(type?: string) {
    try {
      const params = type && type !== 'all' ? { post_type: type } : {};
      const res = await communityApi.getPosts(params);
      setPosts(res.data.data.posts as Post[]);
    } catch { /* ignore */ }
  }

  useEffect(() => { loadPosts(filterType).finally(() => setLoading(false)); }, [filterType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts(filterType);
    setRefreshing(false);
  }, [filterType]);

  async function handlePost() {
    if (!formTitle.trim() || !formItemName.trim()) {
      Alert.alert('Required', 'Title and item name are required.'); return;
    }
    if (formType === 'sell' && !formPrice) {
      Alert.alert('Required', 'Please enter a price for sale posts.'); return;
    }
    setSubmitting(true);
    try {
      const res = await communityApi.createPost({
        title: formTitle.trim(),
        item_name: formItemName.trim(),
        description: formDesc.trim() || undefined,
        post_type: formType,
        price: formPrice ? parseFloat(formPrice) : undefined,
        location: formLocation.trim() || undefined,
        quantity: parseFloat(formQty) || 1,
        unit: formUnit || 'units',
      });
      setPosts(prev => [res.data.data.post as Post, ...prev]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('🎉 Posted!', 'Your post is now live on the community board.');
    } catch { Alert.alert('Error', 'Could not create post.'); }
    setSubmitting(false);
  }

  function resetForm() {
    setFormTitle(''); setFormItemName(''); setFormDesc('');
    setFormType('give'); setFormPrice(''); setFormLocation('');
    setFormQty('1'); setFormUnit('units');
  }

  async function handleMarkUnavailable(post: Post) {
    if (post.author_name !== user?.name) return;
    try {
      await communityApi.updatePost(post.id, { is_available: false });
      setPosts(prev => prev.filter(p => p.id !== post.id));
      Alert.alert('Marked as Claimed', 'Your post has been removed from the feed.');
    } catch { Alert.alert('Error', 'Could not update post.'); }
  }

  const filteredPosts = filterType === 'all' ? posts : posts.filter(p => p.post_type === filterType);

  return (
    <View style={styles.container}>
      {/* Filter & Post */}
      <View style={styles.topBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {['all', 'give', 'sell', 'trade'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filterType === f && styles.filterChipActive]}
              onPress={() => setFilterType(f)}
            >
              <Text style={[styles.filterText, filterType === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : TYPE_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.postBtn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLORS[item.post_type]}20` }]}>
                  <Text style={[styles.typeText, { color: TYPE_COLORS[item.post_type] }]}>
                    {TYPE_LABELS[item.post_type]}
                  </Text>
                </View>
                {item.post_type === 'sell' && item.price !== undefined && (
                  <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                )}
              </View>

              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.itemName}>🍽 {item.item_name} · {item.quantity} {item.unit}</Text>
              {item.description && <Text style={styles.postDesc} numberOfLines={2}>{item.description}</Text>}

              <View style={styles.postMeta}>
                <Text style={styles.postMetaText}>👤 {item.author_name}</Text>
                {item.location && <Text style={styles.postMetaText}>📍 {item.location}</Text>}
                <Text style={styles.postMetaText}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>

              {item.author_name === user?.name && (
                <TouchableOpacity style={styles.claimBtn} onPress={() => handleMarkUnavailable(item)}>
                  <Text style={styles.claimBtnText}>Mark as Claimed</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={filteredPosts.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyTitle}>Nothing posted yet</Text>
              <Text style={styles.emptySub}>Be the first to share excess food with your community!</Text>
            </View>
          }
        />
      )}

      {/* Add Post Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Food</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Post Type */}
            <View style={styles.field}>
              <Text style={styles.label}>Post Type</Text>
              <View style={styles.typeRow}>
                {(['give', 'sell', 'trade'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, formType === t && { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] }]}
                    onPress={() => setFormType(t)}
                  >
                    <Text style={[styles.typeBtnText, formType === t && styles.typeBtnTextActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput style={styles.input} placeholder="e.g. Fresh tomatoes available" placeholderTextColor={COLORS.textTertiary} value={formTitle} onChangeText={setFormTitle} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Cherry Tomatoes" placeholderTextColor={COLORS.textTertiary} value={formItemName} onChangeText={setFormItemName} />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} placeholder="1" value={formQty} onChangeText={setFormQty} keyboardType="numeric" placeholderTextColor={COLORS.textTertiary} />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput style={styles.input} placeholder="kg / pcs" value={formUnit} onChangeText={setFormUnit} placeholderTextColor={COLORS.textTertiary} />
              </View>
            </View>

            {formType === 'sell' && (
              <View style={styles.field}>
                <Text style={styles.label}>Price ($) *</Text>
                <TextInput style={styles.input} placeholder="0.00" value={formPrice} onChangeText={setFormPrice} keyboardType="decimal-pad" placeholderTextColor={COLORS.textTertiary} />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Any details about the item..." value={formDesc} onChangeText={setFormDesc} multiline numberOfLines={3} placeholderTextColor={COLORS.textTertiary} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} placeholder="e.g. Downtown, Zone 3" value={formLocation} onChangeText={setFormLocation} placeholderTextColor={COLORS.textTertiary} />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: TYPE_COLORS[formType] }, submitting && styles.disabled]}
              onPress={handlePost}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post to Community</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingRight: 12 },
  filters: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flex: 1 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  postBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loader: { marginTop: 48 },
  list: { padding: 12, gap: 12, paddingBottom: 20 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  postCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  postTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  itemName: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  postDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 10 },
  postMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  postMetaText: { fontSize: 12, color: COLORS.textTertiary },
  claimBtn: { marginTop: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 8, alignItems: 'center' },
  claimBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  modalClose: { fontSize: 20, color: COLORS.textSecondary },
  field: { marginBottom: 16 },
  rowFields: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.surface },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, alignItems: 'center', backgroundColor: COLORS.surface },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  submitBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.7 },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView, Modal, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchRecipesThunk, fetchRecommendationsThunk, Recipe } from '../store/recipeSlice';
import { COLORS } from '../utils/constants';
import RecipeCard from '../components/RecipeCard';
import { recipesApi } from '../services/api';

const TABS = ['AI Picks', 'All Recipes', 'Saved'] as const;
type Tab = typeof TABS[number];

export default function RecipesScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { recipes, recommendations, recommendationsLoading, loading } = useSelector((state: RootState) => state.recipes);

  const [activeTab, setActiveTab] = useState<Tab>('AI Picks');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchRecommendationsThunk());
    dispatch(fetchRecipesThunk({}));
    loadSaved();
  }, [dispatch]);

  async function loadSaved() {
    try {
      const res = await recipesApi.getSaved();
      const ids = new Set<string>((res.data.data.recipes as Recipe[]).map(r => r.id));
      setSavedIds(ids);
    } catch { /* ignore */ }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchRecommendationsThunk()),
      dispatch(fetchRecipesThunk({})),
      loadSaved(),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  async function handleSave(recipe: Recipe) {
    try {
      if (savedIds.has(recipe.id)) {
        await recipesApi.unsaveRecipe(recipe.id);
        setSavedIds(prev => { const n = new Set(prev); n.delete(recipe.id); return n; });
      } else {
        await recipesApi.saveRecipe(recipe.id);
        setSavedIds(prev => new Set([...prev, recipe.id]));
      }
    } catch {
      Alert.alert('Error', 'Could not save recipe.');
    }
  }

  async function handleMarkUsed(recipe: Recipe) {
    try {
      await recipesApi.markUsed(recipe.id);
      Alert.alert('🎉 Points Earned!', 'You earned 15 points for using this recipe!');
    } catch { /* ignore */ }
  }

  const displayedRecipes = () => {
    switch (activeTab) {
      case 'AI Picks': return recommendations.map(r => ({ ...r, is_saved: savedIds.has(r.id) }));
      case 'All Recipes': return recipes.map(r => ({ ...r, is_saved: savedIds.has(r.id) }));
      case 'Saved': return recipes.filter(r => savedIds.has(r.id)).map(r => ({ ...r, is_saved: true }));
    }
  };

  const isLoading = activeTab === 'AI Picks' ? recommendationsLoading : loading;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'AI Picks' && (
        <View style={styles.aiBanner}>
          <Text style={styles.aiBannerText}>🤖 Personalized recipes based on your expiring ingredients</Text>
        </View>
      )}

      {isLoading && displayedRecipes().length === 0 ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={displayedRecipes()}
          keyExtractor={(item, idx) => item.id ?? String(idx)}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={r => setSelectedRecipe(r)}
              onSave={handleSave}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{activeTab === 'Saved' ? '🔖' : '👨‍🍳'}</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'Saved' ? 'No saved recipes yet' : 'No recipes found'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'Saved' ? 'Tap the bookmark icon to save recipes' : 'Add items to see AI recommendations'}
              </Text>
            </View>
          }
        />
      )}

      {/* Recipe Detail Modal */}
      <Modal visible={!!selectedRecipe} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedRecipe(null)}>
        {selectedRecipe && (
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedRecipe(null)}>
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
            {selectedRecipe.description && <Text style={styles.modalDesc}>{selectedRecipe.description}</Text>}

            <View style={styles.modalStats}>
              <Text style={styles.modalStat}>⏱ {selectedRecipe.prep_time + selectedRecipe.cook_time} min</Text>
              <Text style={styles.modalStat}>👥 {selectedRecipe.servings} servings</Text>
              {selectedRecipe.calories && <Text style={styles.modalStat}>🔥 {selectedRecipe.calories} cal</Text>}
              <Text style={styles.modalStat}>📊 {selectedRecipe.difficulty}</Text>
            </View>

            <Text style={styles.modalSection}>Ingredients</Text>
            {selectedRecipe.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={[styles.ingredientDot, ing.optional && styles.ingredientDotOptional]} />
                <Text style={styles.ingredientText}>
                  {ing.quantity} {ing.name}
                  {ing.optional && <Text style={styles.optionalTag}> (optional)</Text>}
                </Text>
              </View>
            ))}

            <Text style={styles.modalSection}>Instructions</Text>
            {selectedRecipe.instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.usedBtn} onPress={() => { handleMarkUsed(selectedRecipe); setSelectedRecipe(null); }}>
              <Text style={styles.usedBtnText}>✅ I used this recipe! (+15 pts)</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  aiBanner: { backgroundColor: COLORS.primaryLight, padding: 12, paddingHorizontal: 16 },
  aiBannerText: { fontSize: 13, color: COLORS.primaryDark, fontStyle: 'italic' },
  loader: { marginTop: 48 },
  list: { paddingVertical: 8, paddingBottom: 20 },
  empty: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalClose: { alignSelf: 'flex-end', padding: 8, marginBottom: 8 },
  modalCloseText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  modalDesc: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 22 },
  modalStats: { flexDirection: 'row', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  modalStat: { fontSize: 13, color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSecondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  modalSection: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, marginTop: 8 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  ingredientDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
  ingredientDotOptional: { backgroundColor: COLORS.border },
  ingredientText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  optionalTag: { color: COLORS.textTertiary, fontSize: 12 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
  usedBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  usedBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

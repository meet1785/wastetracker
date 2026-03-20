import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';
import { Recipe } from '../store/recipeSlice';

interface Props {
  recipe: Recipe;
  onPress?: (recipe: Recipe) => void;
  onSave?: (recipe: Recipe) => void;
}

const DIFFICULTY_COLOR = {
  easy: COLORS.primary,
  medium: COLORS.warning,
  hard: COLORS.danger,
};

export default function RecipeCard({ recipe, onPress, onSave }: Props) {
  const totalTime = recipe.prep_time + recipe.cook_time;
  const difficultyColor = DIFFICULTY_COLOR[recipe.difficulty] ?? COLORS.textSecondary;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(recipe)} activeOpacity={0.8}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{recipe.name}</Text>
          {onSave && (
            <TouchableOpacity onPress={() => onSave(recipe)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.saveIcon}>{recipe.is_saved ? '🔖' : '🤍'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>{recipe.description}</Text>
        )}
      </View>

      {/* Match score bar (AI recommendations) */}
      {recipe.match_score !== undefined && (
        <View style={styles.matchRow}>
          <Text style={styles.matchLabel}>AI Match</Text>
          <View style={styles.matchBarBg}>
            <View style={[styles.matchBarFill, { width: `${recipe.match_score * 100}%` }]} />
          </View>
          <Text style={styles.matchPercent}>{Math.round(recipe.match_score * 100)}%</Text>
        </View>
      )}

      {/* Matching ingredients */}
      {recipe.matching_ingredients && recipe.matching_ingredients.length > 0 && (
        <View style={styles.ingredientRow}>
          <Text style={styles.ingredientLabel}>Uses: </Text>
          <Text style={styles.ingredientList} numberOfLines={1}>
            {recipe.matching_ingredients.join(', ')}
          </Text>
        </View>
      )}

      {/* Footer stats */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>⏱</Text>
          <Text style={styles.statText}>{totalTime} min</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statText}>{recipe.servings} servings</Text>
        </View>
        {recipe.calories && (
          <View style={styles.stat}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statText}>{recipe.calories} cal</Text>
          </View>
        )}
        <View style={[styles.difficultyBadge, { borderColor: difficultyColor }]}>
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
          </Text>
        </View>
      </View>

      {/* Tags */}
      {recipe.dietary_tags.length > 0 && (
        <View style={styles.tags}>
          {recipe.dietary_tags.slice(0, 4).map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { marginBottom: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  saveIcon: { fontSize: 20 },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  matchLabel: { fontSize: 12, color: COLORS.textSecondary, width: 60 },
  matchBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  matchBarFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  matchPercent: { fontSize: 12, fontWeight: '600', color: COLORS.primary, width: 36, textAlign: 'right' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ingredientLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  ingredientList: { fontSize: 12, color: COLORS.primary, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 13 },
  statText: { fontSize: 12, color: COLORS.textSecondary },
  difficultyBadge: { marginLeft: 'auto', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  difficultyText: { fontSize: 11, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: COLORS.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: COLORS.primaryDark, fontWeight: '500' },
});

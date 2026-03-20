import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppDispatch } from '../store';
import { addInventoryItemThunk } from '../store/inventorySlice';
import { COLORS, FOOD_CATEGORIES, STORAGE_TYPES, CATEGORY_ICONS } from '../utils/constants';
import { inventoryApi } from '../services/api';

export default function AddItemScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Other');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('units');
  const [storageType, setStorageType] = useState('Refrigerator');
  const [expiryDate, setExpiryDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictingExpiry, setPredictingExpiry] = useState(false);

  async function handlePredictExpiry() {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Enter a food name to predict expiry.');
      return;
    }
    setPredictingExpiry(true);
    try {
      const res = await inventoryApi.predictExpiry(name, category, storageType);
      const prediction = res.data.data.prediction as { predicted_expiry_days: number; storage_tips: string[] };
      const date = new Date();
      date.setDate(date.getDate() + prediction.predicted_expiry_days);
      const dateStr = date.toISOString().split('T')[0];
      setExpiryDate(dateStr);
      if (prediction.storage_tips.length > 0) {
        Alert.alert('Expiry Predicted!', `Suggested expiry: ${dateStr}\n\n💡 ${prediction.storage_tips[0]}`);
      }
    } catch {
      Alert.alert('Prediction Failed', 'Could not predict expiry. Please enter manually.');
    } finally {
      setPredictingExpiry(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Item name is required.'); return; }
    if (!expiryDate) { Alert.alert('Required', 'Expiry date is required.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert('Invalid Date', 'Use format YYYY-MM-DD (e.g. 2024-03-15).');
      return;
    }

    setLoading(true);
    try {
      await dispatch(addInventoryItemThunk({
        name: name.trim(),
        brand: brand.trim() || undefined,
        category,
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim() || 'units',
        storage_type: storageType,
        expiry_date: expiryDate,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes: notes.trim() || undefined,
      })).unwrap();

      Alert.alert('✅ Added!', `${name} added to your inventory.`, [
        { text: 'Add Another', onPress: resetForm },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName(''); setBrand(''); setCategory('Other'); setQuantity('1');
    setUnit('units'); setStorageType('Refrigerator'); setExpiryDate('');
    setEstimatedCost(''); setNotes('');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Food Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Organic Milk" placeholderTextColor={COLORS.textTertiary} value={name} onChangeText={setName} />
        </View>

        {/* Brand */}
        <View style={styles.field}>
          <Text style={styles.label}>Brand (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. Horizon" placeholderTextColor={COLORS.textTertiary} value={brand} onChangeText={setBrand} />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {FOOD_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
                <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quantity & Unit */}
        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput style={styles.input} placeholder="1" placeholderTextColor={COLORS.textTertiary} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Unit</Text>
            <TextInput style={styles.input} placeholder="units / kg / L" placeholderTextColor={COLORS.textTertiary} value={unit} onChangeText={setUnit} />
          </View>
        </View>

        {/* Storage Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Storage Location</Text>
          <View style={styles.chips}>
            {STORAGE_TYPES.map(st => (
              <TouchableOpacity
                key={st}
                style={[styles.chip, storageType === st && styles.chipSelected]}
                onPress={() => setStorageType(st)}
              >
                <Text style={[styles.chipText, storageType === st && styles.chipTextSelected]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Expiry Date */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Expiry Date * (YYYY-MM-DD)</Text>
            <TouchableOpacity
              style={[styles.predictBtn, predictingExpiry && styles.predictBtnDisabled]}
              onPress={handlePredictExpiry}
              disabled={predictingExpiry}
            >
              {predictingExpiry ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.predictBtnText}>🤖 AI Predict</Text>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="2024-03-15"
            placeholderTextColor={COLORS.textTertiary}
            value={expiryDate}
            onChangeText={setExpiryDate}
            keyboardType="numeric"
          />
        </View>

        {/* Cost */}
        <View style={styles.field}>
          <Text style={styles.label}>Estimated Cost ($)</Text>
          <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={COLORS.textTertiary} value={estimatedCost} onChangeText={setEstimatedCost} keyboardType="decimal-pad" />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes..."
            placeholderTextColor={COLORS.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add to Inventory</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 18 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.surface,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.surface,
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.primaryDark, fontWeight: '600' },
  predictBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  predictBtnDisabled: { opacity: 0.6 },
  predictBtnText: { fontSize: 12, color: COLORS.primaryDark, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: 15 },
});

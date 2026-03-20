export const API_BASE_URL = 'http://localhost:3000/api';

export const COLORS = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#DCFCE7',
  secondary: '#F97316',
  secondaryLight: '#FFEDD5',
  warning: '#EAB308',
  warningLight: '#FEF9C3',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderDark: '#D1D5DB',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const EXPIRY_THRESHOLDS = {
  CRITICAL: 1,
  WARNING: 3,
  CAUTION: 7,
};

export const FOOD_CATEGORIES = [
  'Dairy',
  'Meat',
  'Vegetables',
  'Fruits',
  'Grains',
  'Beverages',
  'Condiments',
  'Frozen',
  'Other',
] as const;

export const STORAGE_TYPES = [
  'Refrigerator',
  'Freezer',
  'Pantry',
  'Counter',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Dairy: '🥛',
  Meat: '🥩',
  Vegetables: '🥦',
  Fruits: '🍎',
  Grains: '🌾',
  Beverages: '🧃',
  Condiments: '🫙',
  Frozen: '🧊',
  Other: '📦',
};

export const STORAGE_ICONS: Record<string, string> = {
  Refrigerator: '❄️',
  Freezer: '🧊',
  Pantry: '🗄️',
  Counter: '🍽️',
};

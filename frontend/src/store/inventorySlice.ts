import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { inventoryApi } from '../services/api';

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  storage_type: string;
  barcode?: string;
  brand?: string;
  image_url?: string;
  estimated_cost?: number;
  is_consumed: boolean;
  is_wasted: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: InventoryState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchInventoryThunk = createAsyncThunk(
  'inventory/fetchAll',
  async (params: Parameters<typeof inventoryApi.getAll>[0] = {}, { rejectWithValue }) => {
    try {
      const res = await inventoryApi.getAll(params);
      return res.data.data.items as InventoryItem[];
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch inventory';
      return rejectWithValue(message);
    }
  }
);

export const addInventoryItemThunk = createAsyncThunk(
  'inventory/add',
  async (data: Parameters<typeof inventoryApi.create>[0], { rejectWithValue }) => {
    try {
      const res = await inventoryApi.create(data);
      return res.data.data.item as InventoryItem;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to add item';
      return rejectWithValue(message);
    }
  }
);

export const updateInventoryItemThunk = createAsyncThunk(
  'inventory/update',
  async ({ id, data }: { id: string; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const res = await inventoryApi.update(id, data);
      return res.data.data.item as InventoryItem;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to update item';
      return rejectWithValue(message);
    }
  }
);

export const deleteInventoryItemThunk = createAsyncThunk(
  'inventory/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await inventoryApi.delete(id);
      return id;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to delete item';
      return rejectWithValue(message);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearInventory(state) { state.items = []; state.lastFetched = null; },
    updateItemLocally(state, action: PayloadAction<{ id: string; changes: Partial<InventoryItem> }>) {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.changes };
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchInventoryThunk.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchInventoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchInventoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addInventoryItemThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateInventoryItemThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteInventoryItemThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
      });
  },
});

export const { clearError, clearInventory, updateItemLocally } = inventorySlice.actions;
export default inventorySlice.reducer;

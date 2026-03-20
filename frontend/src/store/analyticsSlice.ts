import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsApi } from '../services/api';

interface DashboardStats {
  total_items: number;
  expiring_soon: number;
  points: number;
  streak_days: number;
  items_saved: number;
  money_saved: string;
  recent_waste_count: number;
  recent_waste_cost: string;
}

interface WasteByCategory {
  category: string;
  total_items: number;
  total_cost: string;
}

interface WasteByMonth {
  month: string;
  total_items: number;
  total_cost: string;
}

interface WasteAnalytics {
  period_days: number;
  summary: { total_waste_events: number; total_cost_wasted: string };
  by_category: WasteByCategory[];
  by_month: WasteByMonth[];
}

interface AnalyticsState {
  dashboard: DashboardStats | null;
  waste: WasteAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  dashboard: null,
  waste: null,
  loading: false,
  error: null,
};

export const fetchDashboardThunk = createAsyncThunk(
  'analytics/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const res = await analyticsApi.getDashboard();
      return res.data.data.stats as DashboardStats;
    } catch (err: unknown) {
      return rejectWithValue(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to load dashboard'
      );
    }
  }
);

export const fetchWasteAnalyticsThunk = createAsyncThunk(
  'analytics/fetchWaste',
  async (period: number = 30, { rejectWithValue }) => {
    try {
      const res = await analyticsApi.getWaste(period);
      return res.data.data as WasteAnalytics;
    } catch (err: unknown) {
      return rejectWithValue(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to load waste analytics'
      );
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchDashboardThunk.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWasteAnalyticsThunk.fulfilled, (state, action) => {
        state.waste = action.payload;
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;

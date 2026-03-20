import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recipesApi } from '../services/api';

export interface RecipeIngredient {
  name: string;
  quantity: string;
  optional: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  dietary_tags: string[];
  image_url?: string;
  calories?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  match_score?: number;
  matching_ingredients?: string[];
  is_saved?: boolean;
}

interface RecipeState {
  recipes: Recipe[];
  recommendations: Recipe[];
  savedRecipes: Recipe[];
  loading: boolean;
  recommendationsLoading: boolean;
  error: string | null;
}

const initialState: RecipeState = {
  recipes: [],
  recommendations: [],
  savedRecipes: [],
  loading: false,
  recommendationsLoading: false,
  error: null,
};

export const fetchRecipesThunk = createAsyncThunk(
  'recipes/fetchAll',
  async (params: Parameters<typeof recipesApi.getAll>[0] = {}, { rejectWithValue }) => {
    try {
      const res = await recipesApi.getAll(params);
      return res.data.data.recipes as Recipe[];
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch recipes');
    }
  }
);

export const fetchRecommendationsThunk = createAsyncThunk(
  'recipes/fetchRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await recipesApi.getRecommendations();
      return res.data.data.recommendations as Recipe[];
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch recommendations');
    }
  }
);

export const fetchSavedRecipesThunk = createAsyncThunk(
  'recipes/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const res = await recipesApi.getSaved();
      return res.data.data.recipes as Recipe[];
    } catch (err: unknown) {
      return rejectWithValue((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch saved recipes');
    }
  }
);

const recipeSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRecipesThunk.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchRecipesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload;
      })
      .addCase(fetchRecipesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRecommendationsThunk.pending, state => { state.recommendationsLoading = true; })
      .addCase(fetchRecommendationsThunk.fulfilled, (state, action) => {
        state.recommendationsLoading = false;
        state.recommendations = action.payload;
      })
      .addCase(fetchRecommendationsThunk.rejected, state => { state.recommendationsLoading = false; })
      .addCase(fetchSavedRecipesThunk.fulfilled, (state, action) => {
        state.savedRecipes = action.payload;
      });
  },
});

export const { clearError } = recipeSlice.actions;
export default recipeSlice.reducer;

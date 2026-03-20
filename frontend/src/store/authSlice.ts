import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../services/api';
import { storeToken, storeUser, clearAuth, StoredUser } from '../services/auth';

interface AuthState {
  user: StoredUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(email, password);
      const { user, token } = res.data.data as { user: StoredUser; token: string };
      await storeToken(token);
      await storeUser(user);
      return { user, token };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (
    data: { name: string; email: string; password: string; dietary_preferences?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const res = await authApi.register(data);
      const { user, token } = res.data.data as { user: StoredUser; token: string };
      await storeToken(token);
      await storeUser(user);
      return { user, token };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchMeThunk = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authApi.getMe();
    const user = res.data.data.user as StoredUser;
    await storeUser(user);
    return user;
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to fetch user';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ user: StoredUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      clearAuth();
    },
    clearError(state) {
      state.error = null;
    },
    updateUserPoints(state, action: PayloadAction<number>) {
      if (state.user) state.user.points = action.payload;
    },
  },
  extraReducers: builder => {
    // Login
    builder
      .addCase(loginThunk.pending, state => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerThunk.pending, state => { state.loading = true; state.error = null; })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch me
    builder
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMeThunk.rejected, state => {
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, logout, clearError, updateUserPoints } = authSlice.actions;
export default authSlice.reducer;

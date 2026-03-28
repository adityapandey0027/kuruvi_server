import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../../api/axios';

// 1. Login Action
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (formData, { rejectWithValue }) => {
    try {
      // Simulate API Delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { email, password } = formData;

      // --- DUMMY LOGIN LOGIC ---
      if (email === 'admin@kuruvi.com' && password === '1234567890') {
        const dummyData = {
          token: 'dummy-jwt-token-admin',
          user: { id: '1', name: 'Atul Gautam', role: 'admin', email: 'admin@kuruvi.com' }
        };
        localStorage.setItem('token', dummyData.token);
        localStorage.setItem('user', JSON.stringify(dummyData.user));
        return dummyData;
      } 
      
      if (email === 'wh@kuruvi.com' && password === '1234567890') {
        const dummyData = {
          token: 'dummy-jwt-token-wh',
          user: { id: '2', name: 'Warehouse Staff', role: 'warehouse', email: 'wh@kuruvi.com' }
        };
        localStorage.setItem('token', dummyData.token);
        localStorage.setItem('user', JSON.stringify(dummyData.user));
        return dummyData;
      }

      return rejectWithValue('Invalid email or password');
      // -------------------------

    } catch (err) {
      return rejectWithValue('System Error');
    }
  }
);

// 2. Mock Check Auth Action
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');

      if (token && savedUser) {
        return { user: savedUser };
      }
      throw new Error('No session');
    } catch (err) {
      localStorage.clear();
      return rejectWithValue('Session expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Check Auth Cases
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
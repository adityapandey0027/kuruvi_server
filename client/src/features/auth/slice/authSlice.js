import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../../api/axios'; 

// 1. Login Admin Action
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin', // Unique action name
  async (formData, { rejectWithValue }) => {
    try {
      const { email, password } = formData;
      const response = await API.post('/admin/login', { email, password });

      if (response.data.success) {
        const { token, user, message } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { token, user, message };
      } else {
        return rejectWithValue(response.data.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Connection Error to Server';
      return rejectWithValue(errorMessage);
    }
  }
);

// 2. Login Store Action
export const loginStore = createAsyncThunk(
  'auth/loginStore', // Unique action name
  async (formData, { rejectWithValue }) => {
    try {
      const { email, password } = formData;
      const response = await API.post('/store/login', { email, password }); // Path corrected for Store

      if (response.data.success) {
        const { token, user, message } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { token, user, message };
      } else {
        return rejectWithValue(response.data.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Connection Error to Server';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    // Initial load pe hi local storage se data utha rahe hain
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    // Local check ke liye alag se action ki zaroorat nahi, 
    // initialState hi handle kar raha hai, par logout clean up zaroori hai.
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
    const handleLoginPending = (state) => {
      state.loading = true;
      state.error = null;
    };

    const handleLoginFulfilled = (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    };

    const handleLoginRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    };

    builder
      // Admin Login Cases
      .addCase(loginAdmin.pending, handleLoginPending)
      .addCase(loginAdmin.fulfilled, handleLoginFulfilled)
      .addCase(loginAdmin.rejected, handleLoginRejected)
      // Store Login Cases
      .addCase(loginStore.pending, handleLoginPending)
      .addCase(loginStore.fulfilled, handleLoginFulfilled)
      .addCase(loginStore.rejected, handleLoginRejected);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slice/authSlice';
// import warehouseReducer from '../features/warehouse-panel/warehouseSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,       
    // admin: adminReducer,        
    // warehouse: warehouseReducer, 
  },
  // DevTools is enabled by default in development mode
});

export default store;4
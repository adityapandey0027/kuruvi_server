import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';

const AppRouter = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/warehouse/login" element={<WarehouseLogin />} />

      {/* Protected Admin Panel */}
      <Route 
        path="/admin/*" 
        element={
          isAuthenticated && user.role === 'admin' 
          ? <AdminLayout /> 
          : <Navigate to="/admin/login" />
        } 
      />

      {/* Protected Warehouse Panel */}
      <Route 
        path="/warehouse/*" 
        element={
          isAuthenticated && user.role === 'warehouse' 
          ? <WarehouseLayout /> 
          : <Navigate to="/warehouse/login" />
        } 
      />
    </Routes>
  );
};
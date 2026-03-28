import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import WarehouseLayout from '../layouts/WarehouseLayout';

// Pages
import AdminLogin from '../features/auth/pages/AdminLogin';
import WarehouseLogin from '../features/auth/pages/WarehouseLogin';
import AdminDashboard from '../features/admin/dashboard/pages/AdminDashboard';
import InhouseOrders from '../features/admin/InhouseOrder/InhouseOrders';
import OrderDetail from '../features/admin/InhouseOrder/OrderDetail';

// Category Page (Ab yahi hierarchy handle karega)
import Category from '../features/admin/Products/category/Category';
import ProductForm from '../features/admin/Products/Myproducts/ProductForm';
import ProductList from '../features/admin/Products/Myproducts/ProductList';
import SubCategoryView from '../features/admin/Products/category/SubCategoryView';
import ProductDetailView from '../features/admin/Products/myProducts/ProductDetailView';

const AppRouter = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Routes> 
      {/* 1. Auth Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/warehouse/login" element={<WarehouseLogin />} />

      {/* 2. Admin Protected Routes */}
      <Route
        path="/admin"
        element={isAuthenticated && user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/admin/login" />}
      >
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="inhouse-orders" element={<InhouseOrders />} />
        
        {/* Inventory Management Routes */}
        <Route path="category" element={<Category />} />
        {/* Subcategory Route Removed */}
        <Route path="category/sub/:parentId" element={<SubCategoryView />} />
        {/* Dynamic Product Routes */}
        <Route path="my-products" element={<ProductList />} />
        <Route path="my-products/create" element={<ProductForm />} />
        <Route path="my-products/edit/:id" element={<ProductForm />} />
        <Route path="my-products/view/:id" element={<ProductDetailView />} />
        
        {/* Dynamic Order View */}
        <Route path="orders/view/:id" element={<OrderDetail />} />
        
        {/* Placeholders */}
        <Route path="orders" element={<div className="p-8 bg-white rounded-[2rem] shadow-sm font-bold uppercase text-[10px] tracking-widest text-slate-400">All Orders History Coming Soon</div>} />
        <Route path="users" element={<div className="p-8 bg-white rounded-[2rem] shadow-sm font-bold uppercase text-[10px] tracking-widest text-slate-400">Customer Records Coming Soon</div>} />
      </Route>

      {/* 3. Warehouse Protected Routes */}
      <Route
        path="/warehouse"
        element={isAuthenticated && user?.role === 'warehouse' ? <WarehouseLayout /> : <Navigate to="/warehouse/login" />}
      >
        <Route index element={<Navigate to="/warehouse/stock" />} />
        <Route path="stock" element={<div className="p-8 bg-white rounded-2xl shadow-sm font-bold text-emerald-800 tracking-tight">Warehouse Inventory</div>} />
        <Route path="incoming" element={<div className="p-8 bg-white rounded-2xl shadow-sm font-bold text-emerald-800 tracking-tight">Incoming Shipments</div>} />
      </Route>

      {/* 4. Global Redirects */}
      <Route path="/" element={<Navigate to="/admin/login" />} />
      <Route path="*" element={
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
          <h1 className="text-8xl font-black text-slate-200">404</h1>
          <p className="text-slate-400 font-bold -mt-4 uppercase tracking-widest text-[10px]">Route not found</p>
          <button onClick={() => window.history.back()} className="mt-6 text-[#7e2827] font-black uppercase text-[10px] tracking-widest hover:underline">← Go Back</button>
        </div>
      } />
    </Routes>
  );
};

export default AppRouter;
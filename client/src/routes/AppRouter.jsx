import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomeFirstBanner from '../features/admin/settings/homeBanner/pages/HomeFirstBanner';
import BrandBanner from '../features/admin/settings/homeBanner/pages/BrandBanner';
import CouponManage from '../features/admin/ecommerce-setup/pages/CouponManage';

// --- Loading Component ---
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7e2827]"></div>
  </div>
);

// --- Lazy Loaded Layouts ---
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const WarehouseLayout = lazy(() => import('../layouts/WarehouseLayout'));

// --- Lazy Loaded Pages ---
// Auth
const AdminLogin = lazy(() => import('../features/auth/pages/AdminLogin'));
const WarehouseLogin = lazy(() => import('../features/auth/pages/WarehouseLogin'));

// Admin Dashboard & Orders
const AdminDashboard = lazy(() => import('../features/admin/dashboard/pages/AdminDashboard'));
const InhouseOrders = lazy(() => import('../features/admin/InhouseOrder/InhouseOrders'));
const OrderDetail = lazy(() => import('../features/admin/InhouseOrder/OrderDetail'));

// Admin Category & Products
const Category = lazy(() => import('../features/admin/Products/category/Category'));
const ProductForm = lazy(() => import('../features/admin/Products/Myproducts/ProductForm'));
const ProductList = lazy(() => import('../features/admin/Products/Myproducts/ProductList'));
const SubCategoryView = lazy(() => import('../features/admin/Products/category/SubCategoryView'));
const ProductDetailView = lazy(() => import('../features/admin/Products/myProducts/ProductDetailView'));

// Admin Management
const StoreManagement = lazy(() => import('../features/admin/store-manage/pages/StoreManagement'));
const InventoryManage = lazy(() => import('../features/admin/inventory-mng/pages/InventoryManagement'));
const CustomerList = lazy(() => import('../features/admin/Members/CustomerList'));
const CustomerDetail = lazy(() => import('../features/admin/Members/CustomerDetail'));
const DeliveryBoyList = lazy(() => import('../features/admin/Members/DeliveryBoy/DeliveryBoyList'));
const DeliveryBoyDetail = lazy(() => import('../features/admin/Members/DeliveryBoy/DeliveryBoyDetail'));

// Warehouse Pages
const WarehouseDashboard = lazy(() => import('../features/warehouse/dashboard/pages/WarehouseDashboard'));
const WarehouseOrders = lazy(() => import('../features/warehouse/orders/pages/WarehouseOrders'));
const InventoryManagement = lazy(() => import('../features/warehouse/inventory/pages/InventoryManagement'));

const AppRouter = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. Auth Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/warehouse/login" element={<WarehouseLogin />} />

        {/* 2. Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            isAuthenticated && user?.role === 'admin' ? (
              <AdminLayout />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="inhouse-orders" element={<InhouseOrders />} />

          {/* Inventory Management */}
          <Route path="category" element={<Category />} />
          <Route path="category/sub/:parentId" element={<SubCategoryView />} />
          <Route path="my-products" element={<ProductList />} />
          <Route path="my-products/create" element={<ProductForm />} />
          <Route path="my-products/edit/:id" element={<ProductForm />} />
          <Route path="my-products/view/:id" element={<ProductDetailView />} />
          <Route path="stores" element={<StoreManagement />} />
          <Route path="inventory" element={<InventoryManage />} />

          {/* e commerce setup Management */}
          <Route path="ecommerce/coupon-manage" element={< CouponManage/>} />
          <Route path="settings/banner/first" element={<HomeFirstBanner />} />
          <Route path="settings/banner/brand" element={<BrandBanner />} />

          {/* Members / Customers */}
          <Route path="users" element={<CustomerList />} />
          <Route path="customer/view/:id" element={<CustomerDetail />} />

          {/* Delivery Boy Management */}
          <Route path="delivery-boys" element={<DeliveryBoyList />} />
          <Route path="delivery-boys/view/:id" element={<DeliveryBoyDetail />} />

          {/* Dynamic Order View */}
          <Route path="orders/view/:id" element={<OrderDetail />} />

          <Route
            path="orders"
            element={
              <div className="p-8 bg-white rounded-[2rem] shadow-sm font-bold uppercase text-[10px] tracking-widest text-slate-400">
                All Orders History Coming Soon
              </div>
            }
          />
        </Route>

        {/* 3. Warehouse Protected Routes */}
        <Route
          path="/warehouse"
          element={
            isAuthenticated && user?.role === 'store' ? (
              <WarehouseLayout />
            ) : (
              <Navigate to="/warehouse/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/warehouse/dashboard" replace />} />
          <Route path="dashboard" element={<WarehouseDashboard />} />
          <Route path="orders" element={<WarehouseOrders />} />
          <Route path="inventory" element={<InventoryManagement />} />
        </Route>

        {/* 4. Global Redirects */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route
          path="*"
          element={
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
              <h1 className="text-8xl font-black text-slate-200">404</h1>
              <p className="text-slate-400 font-bold -mt-4 uppercase tracking-widest text-[10px]">
                Route not found
              </p>
              <button
                onClick={() => window.history.back()}
                className="mt-6 text-[#7e2827] font-black uppercase text-[10px] tracking-widest hover:underline"
              >
                ← Go Back
              </button>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
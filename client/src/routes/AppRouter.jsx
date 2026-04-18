import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// --- Static / Public Components ---
import HomeLanding from '../features/static-pages/pages/HomeLanding';
import DriverPolicyView from '../features/static-pages/pages/DriverPolicyView';
import CustomerPolicyView from '../features/static-pages/pages/CustomerPolicyView';

// --- Admin Features ---
import HomeFirstBanner from '../features/admin/settings/pages/HomeFirstBanner';
import BrandBanner from '../features/admin/settings/pages/BrandBanner';
import CouponManage from '../features/admin/ecommerce-setup/pages/CouponManage';
import DeliveryConfig from '../features/admin/ecommerce-setup/pages/DeliveryConfig';
import ContactConfig from '../features/admin/settings/pages/ContactConfig';
import ProductStockReport from '../features/admin/reports/pages/ProductStockReport';

// --- Loading Spinner ---
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#7e2827]"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Kuruvi Engine...</p>
    </div>
  </div>
);

// --- Lazy Layouts ---
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const WarehouseLayout = lazy(() => import('../layouts/WarehouseLayout'));

// --- Lazy Pages ---
const AdminLogin = lazy(() => import('../features/auth/pages/AdminLogin'));
const WarehouseLogin = lazy(() => import('../features/auth/pages/WarehouseLogin'));
const AdminDashboard = lazy(() => import('../features/admin/dashboard/pages/AdminDashboard'));
const InhouseOrders = lazy(() => import('../features/admin/InhouseOrder/pages/InhouseOrders'));
const OrderDetail = lazy(() => import('../features/admin/InhouseOrder/pages/OrderDetail'));
const Category = lazy(() => import('../features/admin/Products/category/Category'));
const ProductForm = lazy(() => import('../features/admin/Products/Myproducts/ProductForm'));
const ProductList = lazy(() => import('../features/admin/Products/Myproducts/ProductList'));
const SubCategoryView = lazy(() => import('../features/admin/Products/category/SubCategoryView'));
const ProductDetailView = lazy(() => import('../features/admin/Products/myProducts/ProductDetailView'));
const StoreManagement = lazy(() => import('../features/admin/store-manage/pages/StoreManagement'));
const InventoryManage = lazy(() => import('../features/admin/inventory-mng/pages/InventoryManagement'));
const CustomerList = lazy(() => import('../features/admin/Members/CustomerList'));
const CustomerDetail = lazy(() => import('../features/admin/Members/CustomerDetail'));
const DeliveryBoyList = lazy(() => import('../features/admin/Members/DeliveryBoy/DeliveryBoyList'));
const DeliveryBoyDetail = lazy(() => import('../features/admin/Members/DeliveryBoy/DeliveryBoyDetail'));

const WarehouseDashboard = lazy(() => import('../features/warehouse/dashboard/pages/WarehouseDashboard'));
const WarehouseOrders = lazy(() => import('../features/warehouse/orders/pages/WarehouseOrders'));
const InventoryManagement = lazy(() => import('../features/warehouse/inventory/pages/InventoryManagement'));

const AppRouter = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const PublicOnlyRoute = ({ children }) => {
    if (isAuthenticated) {
      if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (user?.role === 'store') return <Navigate to="/warehouse/dashboard" replace />;
    }
    return children;
  };
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          <PublicOnlyRoute>
            <HomeLanding />
          </PublicOnlyRoute>
        } />
        <Route path="/legal/customer-policy" element={<CustomerPolicyView />} />
        <Route path="/legal/driver-policy" element={<DriverPolicyView />} />

        {/* --- SECTION 2: AUTHENTICATION --- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/warehouse/login" element={<WarehouseLogin />} />

        {/* --- SECTION 3: ADMIN PANEL (PROTECTED) --- */}
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
          {/* Index Redirect to Dashboard */}
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Orders & Logistics */}
          <Route path="inhouse-orders" element={<InhouseOrders />} />
          <Route path="orders/view/:id" element={<OrderDetail />} />

          {/* Catalog Management */}
          <Route path="category" element={<Category />} />
          <Route path="category/sub/:parentId" element={<SubCategoryView />} />
          <Route path="my-products" element={<ProductList />} />
          <Route path="my-products/create" element={<ProductForm />} />
          <Route path="my-products/edit/:id" element={<ProductForm />} />
          <Route path="my-products/view/:id" element={<ProductDetailView />} />

          {/* Operations */}
          <Route path="stores" element={<StoreManagement />} />
          <Route path="inventory" element={<InventoryManage />} />

          {/* E-commerce & System Setup */}
          <Route path="ecommerce/coupon-manage" element={<CouponManage />} />
          <Route path="ecommerce/delivery-config" element={<DeliveryConfig />} />
          <Route path="settings/banner/first" element={<HomeFirstBanner />} />
          <Route path="settings/banner/brand" element={<BrandBanner />} />
          <Route path="settings/contacts" element={<ContactConfig />} />

          {/* User & Fleet Management */}
          <Route path="users" element={<CustomerList />} />
          <Route path="customer/view/:id" element={<CustomerDetail />} />
          <Route path="delivery-boys" element={<DeliveryBoyList />} />
          <Route path="delivery-boys/view/:id" element={<DeliveryBoyDetail />} />

          <Route path="reports/product-stock" element={<ProductStockReport />} />

          {/* Coming Soon Placeholder */}
          <Route path="orders" element={
            <div className="p-12 bg-white rounded-[3rem] border border-slate-100 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archive & Reporting Module Coming Soon</p>
            </div>
          } />
        </Route>

        {/* --- SECTION 4: WAREHOUSE PANEL (PROTECTED) --- */}
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

        {/* --- SECTION 5: 404 CATCH-ALL --- */}
        <Route
          path="*"
          element={
            <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
              <h1 className="text-[120px] font-black text-slate-100 leading-none">404</h1>
              <p className="text-sm font-black uppercase tracking-tighter text-black mt-4">Lost in the Logistics?</p>
              <p className="text-xs font-bold text-slate-400 mt-2 max-w-xs">The route you are looking for has been moved or doesn't exist.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-8 bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7e2827] transition-all"
              >
                Return to Home
              </button>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/slice/authSlice';
import { toast } from 'react-toastify';

const WarehouseLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.info("Warehouse session ended");
    navigate('/warehouse/login');
  };

  // Tailwind classes for active and normal states
  const activeClass = "flex items-center gap-3 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-inner border-l-4 border-emerald-300 transition-all duration-200";
  const normalClass = "flex items-center gap-3 text-emerald-100 hover:bg-emerald-800 hover:text-white px-4 py-3 rounded-lg border-l-4 border-transparent transition-all duration-200";

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Sidebar - Emerald Green Theme */}
      <aside className="w-64 bg-emerald-900 text-white flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-6 border-b border-emerald-800">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-lg font-bold tracking-widest text-emerald-100">WAREHOUSE</h2>
            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded uppercase tracking-tighter">Inventory Control</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">

          <NavLink to="/warehouse/dashboard" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <span className="text-xl">📦</span>
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink to="/warehouse/orders" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <span className="text-xl">📥</span>
            <span className="font-medium">Orders</span>
          </NavLink>

          <NavLink to="/warehouse/inventory" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <span className="text-xl">📦</span>
            <span className="font-medium">Inventory Manage</span>
          </NavLink>

          <NavLink to="/warehouse/incoming" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <span className="text-xl">📥</span>
            <span className="font-medium">Incoming</span>
          </NavLink>

          <NavLink to="/warehouse/outgoing" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <span className="text-xl">📤</span>
            <span className="font-medium">Outgoing</span>
          </NavLink>

          <NavLink to="/warehouse/reports" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <span className="text-xl">📊</span>
            <span className="font-medium">Reports</span>
          </NavLink>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 bg-emerald-950/50 border-t border-emerald-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.charAt(0) || 'W'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.name || 'Staff'}</p>
              <p className="text-[10px] text-emerald-400">Worker ID: {user?.id?.slice(-5) || 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 border border-red-500/30"
          >
            <i className="fa fa-power-off"></i>
            Exit System
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h1 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Terminal Active</h1>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="hidden md:block italic">"Precision in every package"</span>
            <div className="h-4 w-[1px] bg-slate-300"></div>
            <span className="font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        {/* Scrolling Content Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-full p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WarehouseLayout;
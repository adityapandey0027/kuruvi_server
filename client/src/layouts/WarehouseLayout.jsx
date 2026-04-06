import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/slice/authSlice';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ClipboardList, 
  BarChart3, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const WarehouseLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    toast.info("Warehouse session ended");
    navigate('/warehouse/login');
  };

  const activeClass = "flex items-center gap-3 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-inner border-l-4 border-emerald-300 transition-all duration-200";
  const normalClass = "flex items-center gap-3 text-emerald-100 hover:bg-emerald-800 hover:text-white px-4 py-3 rounded-lg border-l-4 border-transparent transition-all duration-200";

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans relative">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive logic added */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-emerald-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <h2 className="text-lg font-bold tracking-widest text-emerald-100">WAREHOUSE</h2>
            <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded uppercase tracking-tighter">Inventory Control</span>
          </div>
          {/* Close Button for Mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-emerald-300">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <NavLink to="/warehouse/dashboard" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink to="/warehouse/orders" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <ClipboardList size={20} />
            <span className="font-medium">Orders</span>
          </NavLink>

          <NavLink to="/warehouse/inventory" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <Package size={20} />
            <span className="font-medium">Inventory Manage</span>
          </NavLink>

          <NavLink to="/warehouse/incoming" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <ArrowDownCircle size={20} />
            <span className="font-medium">Incoming</span>
          </NavLink>

          <NavLink to="/warehouse/outgoing" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <ArrowUpCircle size={20} />
            <span className="font-medium">Outgoing</span>
          </NavLink>

          <NavLink to="/warehouse/reports" className={({ isActive }) => isActive ? activeClass : normalClass}>
            <BarChart3 size={20} />
            <span className="font-medium">Reports</span>
          </NavLink>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 bg-emerald-950/50 border-t border-emerald-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 shrink-0 rounded bg-emerald-500 flex items-center justify-center font-bold text-white text-sm">
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
            <LogOut size={16} />
            Exit System
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger Button */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-emerald-50 rounded-lg text-emerald-700"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h1 className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wide">Terminal Active</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-slate-500 text-xs sm:text-sm">
            <span className="hidden md:block italic">"Precision in every package"</span>
            <div className="hidden sm:block h-4 w-[1px] bg-slate-300"></div>
            <span className="font-mono">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-full p-4 sm:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WarehouseLayout;
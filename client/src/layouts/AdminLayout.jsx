import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { logout } from '../features/auth/slice/authSlice';
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  LogOut,
  ChevronRight,
  Package,
  Layers,
  CircleDot,
  Settings,
  UserPlus,
  Menu,
  X
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // States for Dropdowns and Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Close sidebar on route change (Mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    toast.info("Logged out successfully");
    navigate('/admin/login');
  };

  const activeLink = "flex items-center gap-3 bg-red-50 text-[#7e2827] px-4 py-3 rounded-2xl transition-all duration-300 font-black border-r-[4px] border-[#7e2827] shadow-sm";
  const normalLink = "flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-4 py-3 rounded-2xl transition-all duration-200 font-bold group";

  const subLinkStyle = ({ isActive }) =>
    `block pl-12 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-[#7e2827] border-l-2 border-[#7e2827] ml-[-2px]' : 'text-slate-400 hover:text-slate-800'}`;

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-sans selection:bg-red-100 relative">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#7e2827] p-2.5 rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center">
              <Package className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900 leading-none">KURUVI <span className="text-[#7e2827]">.</span></h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Admin Panel</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto pb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Operations</p>

          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? activeLink : normalLink}>
            {({ isActive }) => (
              <>
                <LayoutDashboard size={18} className={isActive ? 'text-[#7e2827]' : 'text-slate-400 group-hover:text-slate-900'} />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>

          {/* Inventory Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setIsProductOpen(!isProductOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 font-bold ${isProductOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className={isProductOpen ? 'text-[#7e2827]' : 'text-slate-400'} />
                <span>Inventory</span>
              </div>
              <ChevronRight size={14} className={`transition-transform duration-300 ${isProductOpen ? 'rotate-90 text-[#7e2827]' : 'text-slate-300'}`} />
            </button>

            {isProductOpen && (
              <div className="ml-2 border-l-2 border-slate-100 space-y-1 mt-1">
                <NavLink to="/admin/category" className={subLinkStyle}>Categories</NavLink>
                <NavLink to="/admin/my-products" className={subLinkStyle}>All Products</NavLink>
              </div>
            )}
          </div>

          {/* Members Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setIsMembersOpen(!isMembersOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 font-bold ${isMembersOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <UserPlus size={18} className={isMembersOpen ? 'text-[#7e2827]' : 'text-slate-400'} />
                <span>Members</span>
              </div>
              <ChevronRight size={14} className={`transition-transform duration-300 ${isMembersOpen ? 'rotate-90 text-[#7e2827]' : 'text-slate-300'}`} />
            </button>

            {isMembersOpen && (
              <div className="ml-2 border-l-2 border-slate-100 space-y-1 mt-1">
                <NavLink to="/admin/users" className={subLinkStyle}>Customer List</NavLink>
                <NavLink to="/admin/delivery-boys" className={subLinkStyle}>Delivery Boys</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/admin/stores" className={({ isActive }) => isActive ? activeLink : normalLink}>
            {({ isActive }) => (
              <>
                <Warehouse size={18} className={isActive ? 'text-[#7e2827]' : 'text-slate-400 group-hover:text-slate-900'} />
                <span>Dark Stores</span>
              </>
            )}
          </NavLink>

          <NavLink to="/admin/inhouse-orders" className={({ isActive }) => isActive ? activeLink : normalLink}>
            {({ isActive }) => (
              <>
                <Layers size={18} className={isActive ? 'text-[#7e2827]' : 'text-slate-400 group-hover:text-slate-900'} />
                <span>Logistics</span>
              </>
            )}
          </NavLink>

          {/* Settings Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 font-bold ${isSettingsOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} className={isSettingsOpen ? 'text-[#7e2827]' : 'text-slate-400'} />
                <span>Settings</span>
              </div>
              <ChevronRight size={14} className={`transition-transform duration-300 ${isSettingsOpen ? 'rotate-90 text-[#7e2827]' : 'text-slate-300'}`} />
            </button>

            {isSettingsOpen && (
              <div className="ml-2 border-l-2 border-slate-100 space-y-1 mt-1">
                <NavLink to="/admin/settings/banner/first" className={subLinkStyle}>Home Banner </NavLink>
                <NavLink to="/admin/settings/banner/brand" className={subLinkStyle}>Brand Banner </NavLink>

              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 bg-slate-50/80 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-black text-white flex items-center justify-center font-black uppercase">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 truncate uppercase">{user?.name || 'Atul Gautam'}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-slate-600 hover:text-red-600 px-4 py-3 rounded-2xl transition-all duration-300 hover:bg-white group font-black uppercase text-[10px] tracking-widest"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-10 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-600 hover:text-[#7e2827]"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <CircleDot size={14} className="text-emerald-500 animate-pulse hidden xs:block" />
              <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.4em]">Node Operational</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Date</p>
              <p className="text-xs font-black text-slate-900 uppercase">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-slate-100 mx-1 sm:mx-2 hidden sm:block"></div>
            <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-10 flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
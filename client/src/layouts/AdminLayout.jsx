import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { logout } from '../features/auth/slice/authSlice';
import {
  LayoutDashboard,
  ShoppingBag,
  Warehouse,
  LogOut,
  ChevronDown,
  Package,
  Layers,
  CircleDot,
  Settings,
  UserPlus,
  Menu,
  X,
  Ticket,
  Truck,
  FileBarChart,
  Image as ImageIcon,
  Contact2,
  Bell
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    inventory: false,
    members: false,
    ecommerce: false,
    reports: false,
    settings: false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    toast.info("Session terminated safely");
    navigate('/admin/login');
  };

  // Styles
  const activeLink = "flex items-center gap-3 bg-[#7e2827] text-white px-4 py-3 rounded-2xl transition-all duration-300 font-bold shadow-lg shadow-red-900/20";
  const normalLink = "flex items-center gap-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 px-4 py-3 rounded-2xl transition-all duration-200 font-semibold group";

  const subLinkStyle = ({ isActive }) =>
    `block pl-12 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] transition-all ${isActive ? 'text-[#7e2827] bg-red-50/50 rounded-xl' : 'text-slate-400 hover:text-slate-800'}`;

  // Smooth Transition Variants
  const menuVariants = {
    open: { opacity: 1, height: "auto", marginTop: 4, transition: { duration: 0.3, ease: "circOut" } },
    closed: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2, ease: "circIn" } }
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className={({ isActive }) => isActive ? activeLink : normalLink}>
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
          <span className="tracking-tight">{label}</span>
        </>
      )}
    </NavLink>
  );

  const DropdownMenu = ({ isOpen, onToggle, icon: Icon, label, children, menuKey }) => (
    <div className="space-y-1">
      <button
        onClick={() => onToggle(menuKey)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 font-semibold ${isOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={isOpen ? 'text-[#7e2827]' : 'text-slate-400'} />
          <span className="tracking-tight">{label}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#7e2827]' : 'text-slate-300'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="ml-4 border-l-2 border-slate-100 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-red-100">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-300
        lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#7e2827] p-2.5 rounded-2xl shadow-xl shadow-red-900/30">
              <Package className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-slate-900">KURUVI<span className="text-[#7e2827]">.</span></h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Control Center</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 bg-slate-50 rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 mt-2 px-2">Main Menu</p>

          <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/admin/inhouse-orders" icon={Layers} label="Orders" />

          <DropdownMenu 
            menuKey="inventory" 
            isOpen={openMenus.inventory} 
            onToggle={toggleMenu} 
            icon={ShoppingBag} 
            label="Inventory"
          >
            <NavLink to="/admin/category" className={subLinkStyle}>Categories</NavLink>
            <NavLink to="/admin/my-products" className={subLinkStyle}>Product List</NavLink>
          </DropdownMenu>

          <DropdownMenu 
            menuKey="members" 
            isOpen={openMenus.members} 
            onToggle={toggleMenu} 
            icon={UserPlus} 
            label="Fleet & Users"
          >
            <NavLink to="/admin/users" className={subLinkStyle}>Customers</NavLink>
            <NavLink to="/admin/delivery-boys" className={subLinkStyle}>Delivery Fleet</NavLink>
          </DropdownMenu>

          <NavItem to="/admin/stores" icon={Warehouse} label="Dark Stores" />

          <DropdownMenu 
            menuKey="ecommerce" 
            isOpen={openMenus.ecommerce} 
            onToggle={toggleMenu} 
            icon={Ticket} 
            label="Marketing"
          >
            <NavLink to="/admin/ecommerce/coupon-manage" className={subLinkStyle}>Coupons</NavLink>
            <NavLink to="/admin/ecommerce/delivery-config" className={subLinkStyle}>Logistics Config</NavLink>
          </DropdownMenu>

          <DropdownMenu 
            menuKey="reports" 
            isOpen={openMenus.reports} 
            onToggle={toggleMenu} 
            icon={FileBarChart} 
            label="Reports"
          >
            <NavLink to="/admin/reports/product-stock" className={subLinkStyle}>Inventory Logs</NavLink>
          </DropdownMenu>

          <DropdownMenu 
            menuKey="settings" 
            isOpen={openMenus.settings} 
            onToggle={toggleMenu} 
            icon={Settings} 
            label="Branding"
          >
            <NavLink to="/admin/settings/banner/first" className={subLinkStyle}>Hero Banner</NavLink>
            <NavLink to="/admin/settings/banner/brand" className={subLinkStyle}>Brand Slider</NavLink>
            <NavLink to="/admin/settings/contacts" className={subLinkStyle}>Contact Point</NavLink>
          </DropdownMenu>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 mb-4 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">System Root</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-100"
          >
            <LogOut size={14} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 bg-slate-50 rounded-xl text-slate-600 hover:text-[#7e2827]"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
              <CircleDot size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Mainframe Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">System Time</p>
              <p className="text-xs font-black text-slate-900 uppercase">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#7e2827] rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 lg:p-10 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
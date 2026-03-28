import React, { useState } from 'react'; // useState add kiya
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { logout } from '../features/auth/slice/authSlice';

const AdminLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Products dropdown toggle ke liye state
  const [isProductOpen, setIsProductOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.info("Logged out successfully");
    navigate('/admin/login');
  };

  const activeLink = "flex items-center gap-3 bg-red-50 text-[#7e2827] px-4 py-3 rounded-xl transition-all duration-200 font-bold border-r-4 border-[#7e2827]";
  const normalLink = "flex items-center gap-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 px-4 py-3 rounded-xl transition-all duration-200 font-medium";
  
  // Sub-menu links ke liye style
  const subLinkStyle = ({ isActive }) => 
    `block pl-12 py-2 text-[13px] transition-all ${isActive ? 'text-[#7e2827] font-bold' : 'text-slate-400 hover:text-slate-700'}`;

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans">
      
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
              <img src="/assets/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase">Kuruvi</h2>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? activeLink : normalLink}>
            <i className="fa fa-th-large w-5"></i>
            <span>Dashboard</span>
          </NavLink>

          {/* --- Products Dropdown Menu --- */}
          <div>
            <button 
              onClick={() => setIsProductOpen(!isProductOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isProductOpen ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <i className="fa fa-shopping-bag w-5"></i>
                <span>Products</span>
              </div>
              <i className={`fa fa-chevron-right text-[10px] transition-transform duration-200 ${isProductOpen ? 'rotate-90' : ''}`}></i>
            </button>

            {/* Dropdown Links */}
            {isProductOpen && (
              <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <NavLink to="/admin/category" className={subLinkStyle}>Category</NavLink>
                <NavLink to="/admin/subcategory" className={subLinkStyle}>Subcategory</NavLink>
                <NavLink to="/admin/my-products" className={subLinkStyle}>My Products</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/admin/inhouse-orders" className={({ isActive }) => isActive ? activeLink : normalLink}>
            <i className="fa fa-building w-5"></i>
            <span>Inhouse Orders</span>
          </NavLink>

          <NavLink to="/admin/orders" className={({ isActive }) => isActive ? activeLink : normalLink}>
            <i className="fa fa-truck w-5"></i>
            <span>All Orders</span>
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => isActive ? activeLink : normalLink}>
            <i className="fa fa-users w-5"></i>
            <span>Customers</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-slate-400 hover:text-red-600 px-4 py-3 rounded-xl transition-all duration-300 group"
          >
            <i className="fa fa-sign-out group-hover:translate-x-1 transition-transform"></i>
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <h1 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Admin Control</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 leading-none">{user?.name || 'Atul Gautam'}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">System Admin</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#7e2827] font-black text-lg">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>
        
        <div className="p-8 bg-slate-50/30 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
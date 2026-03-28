import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStore, clearError } from '../slice/authSlice';
import { toast } from 'react-toastify';

const WarehouseLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { email, password } = formData;

  const handleChange = (e) => {
    // Agar pehle se koi error screen par hai, toh type karte hi use saaf karein
    if (error) dispatch(clearError());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // loginStore dispatch kar rahe hain jo unique action name use karta hai
    const resultAction = await dispatch(loginStore(formData));
    
    if (loginStore.fulfilled.match(resultAction)) {
      toast.success('Warehouse Access Authorized');
    } else {
      // Error message dikhane ke liye toast
      toast.error(resultAction.payload || 'Access Denied');
    }
  };

  // Redirect Logic: Jab user authenticate ho jaye aur uska role 'warehouse' ho
  useEffect(() => {
    if (isAuthenticated && user?.role === 'warehouse') {
      navigate('/warehouse/stock');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg mb-4 transform transition hover:rotate-6">
            <i className="fa fa-archive text-white text-3xl"></i>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-emerald-900 tracking-tight">
            Warehouse Access
          </h2>
          <p className="mt-2 text-center text-sm text-emerald-600 font-medium">
            Enter credentials to manage Kuruvi Inventory
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-[0_20px_50px_rgba(8,_112,_84,_0.1)] rounded-2xl border-t-8 border-emerald-600">
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Error Alert Box */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded flex items-center gap-3 text-red-700 text-sm animate-shake">
                  <i className="fa fa-exclamation-triangle"></i>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 tracking-wide mb-1">
                  Employee Email / ID
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa fa-id-badge text-emerald-500"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="wh.staff@kuruvi.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 tracking-wide mb-1">
                  Security Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa fa-key text-emerald-500"></i>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-300 transform active:scale-95 group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <i className="fa fa-refresh fa-spin"></i> Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Authorize & Enter <i className="fa fa-sign-in group-hover:translate-x-1 transition-transform"></i>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-10 text-center text-[10px] text-emerald-800 font-bold uppercase tracking-widest opacity-40">
            Kuruvi Inventory Management System • v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseLogin;
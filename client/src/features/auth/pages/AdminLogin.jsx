import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginAdmin, clearError } from '../slice/authSlice';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => {
    if (error) dispatch(clearError());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginAdmin(formData));
    
    if (loginAdmin.fulfilled.match(resultAction)) {
      toast.success(`Welcome, ${resultAction.payload.user.name}`);
    } else {
      toast.error(resultAction.payload || 'Login failed');
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Header */}
        <div className="flex flex-col items-center">
          <img 
            className="h-20 w-auto mb-4" 
            src="/assets/logo.png" 
            alt="Kuruvi Logo" 
            onError={(e) => { e.target.src = "https://via.placeholder.com/120?text=Kuruvi" }}
          />
          <h2 className="text-center text-2xl font-extrabold text-[#7e2827]">
            Kuruvi Qcommerce
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Admin Portal Access
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={onSubmit}>
              
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 flex items-center gap-3 text-red-700 text-sm animate-pulse">
                  <i className="fa fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Admin Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={onChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e2827] focus:border-transparent sm:text-sm transition duration-200"
                    placeholder="admin@kuruvi.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa fa-lock text-gray-400"></i>
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={password}
                    onChange={onChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e2827] focus:border-transparent sm:text-sm transition duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#7e2827] hover:bg-[#5e1d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7e2827] disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <i className="fa fa-circle-o-notch fa-spin"></i> Authenticating...
                    </span>
                  ) : 'Sign In to Dashboard'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center">
              <button 
                onClick={() => navigate('/warehouse/login')}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-2 group"
              >
                <i className="fa fa-arrow-left text-xs group-hover:-translate-x-1 transition-transform"></i>
                Switch to Store Login
              </button>
            </div>

          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            &copy; 2026 Kuruvi Qcommerce Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
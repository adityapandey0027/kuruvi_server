import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../slice/authSlice';
import { toast } from 'react-toastify';

const WarehouseLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { email, password } = formData;

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Note: Using 'email' here to match your authSlice logic, 
    // but you can label it "Employee ID" in the UI.
    const resultAction = await dispatch(loginUser(formData));
    
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success('Warehouse Access Authorized');
    } else {
      toast.error(resultAction.payload || 'Access Denied');
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'warehouse') {
      navigate('/warehouse/stock');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg mb-4">
            <i className="fa fa-archive text-white text-3xl"></i>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-emerald-900">
            Warehouse Access
          </h2>
          <p className="mt-2 text-center text-sm text-emerald-600">
            Enter credentials to manage Kuruvi Inventory
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow-2xl rounded-2xl border-t-8 border-emerald-600">
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 tracking-wide">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                    placeholder="wh.staff@kuruvi.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 tracking-wide">
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-300 transform active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <i className="fa fa-refresh fa-spin"></i> Verifying...
                    </span>
                  ) : 'Authorize & Enter'}
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center">
              <button 
                onClick={() => navigate('/admin/login')}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-2"
              >
                <i className="fa fa-arrow-left text-xs"></i>
                Switch to Admin Login
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-emerald-800 font-medium opacity-60">
            SYSTEM STATUS: SECURED & ENCRYPTED
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseLogin;
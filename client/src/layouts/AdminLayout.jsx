import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import AdminSidebar from '../components/common/AdminSidebar'; // You'll create this

const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  return (
    <div className="admin-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar specific to Admin */}
      <AdminSidebar />

      <div className="main-content" style={{ flex: 1, backgroundColor: '#f4f7fe' }}>
        <header style={{ padding: '1rem', background: '#fff', display: 'flex', justifyContent: 'space-between' }}>
          <h3>Admin Panel: Welcome, {user?.name}</h3>
          <button onClick={handleLogout}>Logout</button>
        </header>

        <main style={{ padding: '20px' }}>
          {/* This is where Admin sub-routes (Dashboard, Products) will render */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
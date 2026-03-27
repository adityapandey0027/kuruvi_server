import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

const WarehouseLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/warehouse/login');
  };

  return (
    <div className="warehouse-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Warehouse Specific Navigation */}
      <aside style={{ width: '250px', background: '#2c3e50', color: 'white' }}>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Stock Management</li>
            <li>Purchase Orders</li>
          </ul>
        </nav>
      </aside>

      <div className="content-area" style={{ flex: 1 }}>
        <nav style={{ padding: '10px', background: '#e67e22', color: 'white' }}>
          <span>Warehouse: {user?.warehouse_name || 'Main Unit'}</span>
          <button onClick={handleLogout} style={{ float: 'right' }}>Exit</button>
        </nav>

        <section style={{ padding: '20px' }}>
          <Outlet /> 
        </section>
      </div>
    </div>
  );
};

export default WarehouseLayout;
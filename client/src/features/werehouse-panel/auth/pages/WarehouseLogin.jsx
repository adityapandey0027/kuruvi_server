import React from 'react'

const WarehouseLogin = () => {
    const handleWarehouseLogin = async (credentials) => {
  try {
    const res = await api.post('/warehouse/login', credentials);
    if (res.data.user.role === 'warehouse') {
      dispatch(loginSuccess(res.data));
      navigate('/warehouse/dashboard');
    }
  } catch (err) {
    dispatch(loginFailure("Warehouse access denied"));
  }
};

  return (
    <div>WarehouseLogin</div>
  )
}

export default WarehouseLogin
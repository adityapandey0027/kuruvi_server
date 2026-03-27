import React from 'react'

const AdminLogin = () => {

    const handleAdminLogin = async (credentials) => {
  try {
    const res = await api.post('/admin/login', credentials);
    // Ensure the backend confirms this is an admin
    if (res.data.user.role === 'admin') {
      dispatch(loginSuccess(res.data));
      navigate('/admin/dashboard');
    }
  } catch (err) {
    dispatch(loginFailure("Admin access denied"));
  }
};
  return (
    <div>AdminLogin</div>
  )
}

export default AdminLogin
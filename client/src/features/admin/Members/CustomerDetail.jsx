import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Heart, Wallet, History, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const CustomerDetail = () => {
  // 'id' here will correspond to ':customerId' in your route
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // FIXED: Updated to point to your specific backend endpoint
        const response = await axios.get(`/admin/customers/details/${id}`);
        
        // Safety check: handle cases where response might be wrapped in .data or .customer
        const result = response.data.customer || response.data.data || response.data;
        setDetails(result);
      } catch (error) {
        console.error("Error fetching customer details:", error);
        toast.error("Failed to load customer insights");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-[#7e2827]" size={40} />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[2rem]">
        Customer Profile Not Found
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-400 hover:text-black font-black text-[10px] uppercase tracking-widest transition-colors"
      >
        <ArrowLeft size={14} /> Back to Members
      </button>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border-b-4 border-emerald-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{details.total_orders || 0}</h3>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-500"><ShoppingBag /></div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border-b-4 border-[#7e2827] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Spend</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">₹{details.total_spend || 0}</h3>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl text-[#7e2827]"><Wallet /></div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
          <History className="text-[#7e2827]" size={20} />
          <h3 className="font-black text-xs uppercase tracking-widest">Purchase History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-5">Order ID</th>
                <th className="p-5">Products</th>
                <th className="p-5">Total</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {details.order_history?.length > 0 ? (
                details.order_history.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-black text-slate-900">#{order.order_id}</td>
                    <td className="p-5 font-bold text-slate-600">{order.name} x {order.product_quantity}</td>
                    <td className="p-5 font-black text-slate-900">₹{order.total}</td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-tighter">
                        {order.order_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400 font-bold uppercase text-[9px]">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Wishlist, Cart, Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wishlist */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
           <h4 className="font-black text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2"><Heart className="text-red-500" size={16}/> Wishlist Items</h4>
           <div className="space-y-3">
              {details.wishlist?.length > 0 ? details.wishlist.map((item, i) => (
                <div key={i} className="flex justify-between text-xs p-3 bg-slate-50 rounded-xl font-bold border border-transparent hover:border-red-100 transition-all">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-red-500">₹{item.product_price}</span>
                </div>
              )) : <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4 tracking-widest">Empty Wishlist</p>}
           </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
           <h4 className="font-black text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingBag className="text-blue-500" size={16}/> Active Cart</h4>
           <div className="space-y-3">
              {details.cart_items?.length > 0 ? details.cart_items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs p-3 bg-slate-50 rounded-xl font-bold border border-transparent hover:border-blue-100 transition-all">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-blue-500">₹{item.product_price}</span>
                </div>
              )) : <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4 tracking-widest">No Items in Cart</p>}
           </div>
        </div>

        {/* Wallet */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
           <h4 className="font-black text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2"><Wallet className="text-emerald-500" size={16}/> Wallet Logs</h4>
           <div className="space-y-3">
              {details.wallet_balance?.length > 0 ? details.wallet_balance.map((log, i) => (
                <div key={i} className="flex justify-between text-xs p-3 bg-slate-50 rounded-xl font-bold border border-transparent hover:border-emerald-100 transition-all">
                  <span className="text-slate-400 font-black">{new Date(log.created_at).toLocaleDateString('en-GB')}</span>
                  <span className="text-emerald-600">₹{log.balance}</span>
                </div>
              )) : <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4 tracking-widest">No wallet activity</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
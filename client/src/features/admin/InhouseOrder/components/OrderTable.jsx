import React from 'react';
import { Link } from 'react-router-dom'; // Link import karna zaroori hai


const OrderTable = ({ orders }) => {
  console.log(orders);
  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"> ID</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Customer</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.orderId}</td>
              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{order.customer}</td>
              <td className="px-6 py-4">
                <span className={`
                  px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide
                  ${order.status === 'Delivered' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-700 border border-amber-200'}
                `}>
                  {order.status}
                </span>
              </td>

              <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{order.amount}</td>
              <td className="px-6 py-4 text-right">
                {/* Button ki jagah Link use karein taaki OrderDetail page par ja sakein */}
                <Link 
                  to={`/admin/orders/view/${order._id}`} 
                  className="text-[#7e2827] hover:text-[#5e1d1c] text-sm font-bold underline-offset-4 hover:underline transition-all"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Empty State Helper */}
      {orders.length === 0 && (
        <div className="p-10 text-center text-slate-400">
          <i className="fa fa-inbox block text-3xl mb-2"></i>
          <p>No recent orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
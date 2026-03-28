import React, { useEffect, useState } from 'react';
import API from '../../../../api/axios';
import OrderTable from '../components/OrderTable';
import StatCard from '../components/StatCard';
import DatePicker from 'react-datepicker'; // Modern Replacement
import "react-datepicker/dist/react-datepicker.css"; // Essential styles

const AdminDashboard = () => {
  const [data, setData] = useState({
    orders: [],
    productCount: 0,
    categoryCount: 0,
    subcategoryCount: 0,
    userCount: 0,
    deliveryBoyCount: 0,
    lowStock: []
  });

  // Using standard Date objects instead of moment for better compatibility
  const [startDate, setStartDate] = useState(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Dummy Data for testing
    setData({
      orders: [
        { id: '1024', customer: 'Atul Gautam', status: 'Delivered', amount: '1,250' },
        { id: '1025', customer: 'Suresh Kumar', status: 'Pending', amount: '840' },
      ],
      productCount: 428,
      categoryCount: 14,
      subcategoryCount: 52,
      userCount: 1240,
      deliveryBoyCount: 22,
      lowStock: [
        { pro_name: 'Amul Gold Milk 1L', stock: 4 },
        { pro_name: 'Aashirvaad Atta 5kg', stock: 2 },
      ]
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Orders" value={data.orders.length} icon="🚚" color="rose-500" />
        <StatCard label="Products" value={data.productCount} icon="📦" color="amber-500" />
        <StatCard label="Categories" value={data.categoryCount} icon="📂" color="emerald-500" />
        <StatCard label="Sub-Cats" value={data.subcategoryCount} icon="🌿" color="cyan-500" />
        <StatCard label="Customers" value={data.userCount} icon="👥" color="blue-600" />
        <StatCard label="Riders" value={data.deliveryBoyCount} icon="🛵" color="slate-600" />
        
      </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h4 className="text-xl font-bold text-slate-800">Recent Transactions</h4>
              </div>
              
              {/* Modern Date Range Selector */}
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="w-28 bg-transparent text-[11px] font-bold text-slate-600 outline-none pl-2"
                    placeholderText="Start Date"
                  />
                </div>
                <span className="text-slate-300 text-xs">→</span>
                <div className="relative">
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="w-28 bg-transparent text-[11px] font-bold text-slate-600 outline-none"
                    placeholderText="End Date"
                  />
                </div>
              </div>
            </div>
            
            <OrderTable orders={data.orders} />
          </div>
        </div>

        {/* Low Stock Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h4 className="text-xl font-bold text-slate-800 mb-6">Stock Alerts</h4>
          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.lowStock.map((item, index) => (
                  <tr key={index} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700 truncate">{item.pro_name}</td>
                    <td className="px-4 py-4 text-sm text-right font-black text-red-500">{item.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="w-full mt-6 py-4 bg-[#7e2827] text-white rounded-2xl text-sm font-bold transition-all hover:opacity-90">
            Inventory Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
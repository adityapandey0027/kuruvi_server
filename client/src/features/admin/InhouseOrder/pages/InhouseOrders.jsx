import React, { useState, useEffect } from 'react';
import { LayoutList, Search, Calendar as CalendarIcon, ArrowUpRight, PackageCheck, Timer, XCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import OrderTable from '../components/OrderTable';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const InhouseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  // Default: Last 7 days
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  const fetchInhouseOrders = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/orders/inhouse', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          page,
          limit: 20
        }
      });
      setOrders(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) {
      toast.error("Logistics sync failed");
    } finally {
      setLoading(false);
    }
  };

  // Effect triggers on Date or Page changes
  useEffect(() => {
    fetchInhouseOrders();
  }, [startDate, endDate, page]);

  const filteredOrders = searchTerm
    ? orders.filter(order =>
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders;

  const stats = {
    total: orders.length,
    pending: orders.filter(o => ["PLACED", "CONFIRMED", "PACKING"].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => ["CANCELLED", "REJECTED"].includes(o.status)).length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans text-black p-4">
      
      {/* 1. Header & Range Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#7e2827] p-3 rounded-2xl text-white shadow-lg shadow-red-900/10">
            <LayoutList size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Inhouse Logistics</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Fulfillment Dashboard</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7e2827] transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Filter ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5 w-64 transition-all shadow-inner"
            />
          </div>

          {/* Corrected Date Range Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-inner group">
            <CalendarIcon size={14} className="ml-2 text-slate-400"/>
            <DatePicker 
              selected={startDate} 
              onChange={d => { setStartDate(d); setPage(1); }}
              selectsStart 
              startDate={startDate} 
              endDate={endDate}
              maxDate={endDate}
              placeholderText="From"
              className="w-24 bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 cursor-pointer focus:text-[#7e2827]"
            />
            <span className="text-slate-300 font-bold">/</span>
            <DatePicker 
              selected={endDate} 
              onChange={d => { setEndDate(d); setPage(1); }}
              selectsEnd 
              startDate={startDate} 
              endDate={endDate} 
              minDate={startDate}
              placeholderText="To"
              className="w-24 bg-transparent text-[10px] font-black uppercase outline-none text-slate-600 cursor-pointer focus:text-[#7e2827]"
            />
          </div>

          <button
            onClick={() => { setPage(1); fetchInhouseOrders(); }}
            className={`p-2.5 bg-white border border-slate-200 rounded-xl hover:text-[#7e2827] hover:border-[#7e2827]/20 transition-all ${loading && 'animate-spin'}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* 2. Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard label="Current Period" value={stats.total} icon={<ArrowUpRight size={16}/>} color="black" />
        <StatusCard label="Active Prep" value={stats.pending} icon={<Timer size={16}/>} color="amber" />
        <StatusCard label="Delivered" value={stats.completed} icon={<PackageCheck size={16}/>} color="emerald" />
        <StatusCard label="Cancelled" value={stats.cancelled} icon={<XCircle size={16}/>} color="rose" />
      </div>

      {/* 3. Table Section */}
      <div className="bg-white p-2 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-[#7e2827] rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Syncing Logistics...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-96 text-slate-300">
            <LayoutList size={48} className="mb-2 opacity-20" />
            <p className="font-black uppercase text-[10px] tracking-widest">No orders found for this range</p>
          </div>
        ) : (
          <OrderTable orders={filteredOrders} />
        )}
      </div>

      {/* 4. Modern Pagination */}
      <div className="flex justify-between items-center px-8 py-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing {filteredOrders.length} orders • Page {page}
        </div>
        
        <div className="flex items-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => prev - 1)}
              className="p-3 border border-slate-100 rounded-2xl text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center text-xs font-black shadow-lg shadow-black/20">
                    {page}
                </span>
                <span className="text-[10px] font-black text-slate-300 uppercase">of</span>
                <span className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center text-xs font-black border border-slate-100">
                    {pagination?.pages || 1}
                </span>
            </div>

            <button
              disabled={page >= (pagination?.pages || 1)}
              onClick={() => setPage(prev => prev + 1)}
              className="p-3 border border-slate-100 rounded-2xl text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, icon, color }) => {
  const themes = {
    black: "bg-black text-white shadow-black/10",
    amber: "bg-amber-50 text-amber-600 shadow-amber-900/5",
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-900/5",
    rose: "bg-rose-50 text-rose-600 shadow-rose-900/5"
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-[#7e2827]/20 transition-all duration-300">
      <div className={`w-12 h-12 rounded-2xl ${themes[color]} flex items-center justify-center mb-4 shadow-xl`}>
        {icon}
      </div>
      <p className="text-4xl font-black text-black tracking-tighter">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
};

export default InhouseOrders;
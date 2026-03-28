import React, { useState, useEffect } from 'react';
import OrderTable from '../dashboard/components/OrderTable';
import { 
  LayoutList, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  ArrowUpRight,
  PackageCheck,
  Timer,
  XCircle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const InhouseOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  // Dummy Data for Inhouse Orders
  const [orders] = useState([
    { id: '1024', customer: 'Atul Gautam', status: 'Delivered', amount: '1,250', date: '2026-03-27' },
    { id: '1025', customer: 'Suresh Kumar', status: 'Pending', amount: '840', date: '2026-03-28' },
    { id: '1026', customer: 'Anjali Singh', status: 'Rejected', amount: '2,100', date: '2026-03-26' },
    { id: '1027', customer: 'Vikram Roy', status: 'Pending', amount: '450', date: '2026-03-28' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Header & Search Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-[#7e2827] p-3 rounded-2xl shadow-lg shadow-red-900/20 text-white">
            <LayoutList size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inhouse Logistics</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Real-time Order Management</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#7e2827] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search ID or Customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#7e2827]/5 focus:border-[#7e2827]/20 w-64 transition-all"
            />
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
             <div className="flex items-center px-2 text-slate-400"><CalendarIcon size={14}/></div>
             <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-24 bg-transparent text-[11px] font-black text-slate-600 outline-none uppercase"
              />
              <span className="text-slate-300">-</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="w-24 bg-transparent text-[11px] font-black text-slate-600 outline-none uppercase"
              />
          </div>

          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#7e2827] hover:border-[#7e2827]/20 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* 2. Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard label="Total Orders" value="142" icon={<ArrowUpRight size={16}/>} color="slate" />
        <StatusCard label="Pending" value="12" icon={<Timer size={16}/>} color="amber" />
        <StatusCard label="Completed" value="128" icon={<PackageCheck size={16}/>} color="emerald" />
        <StatusCard label="Cancelled" value="02" icon={<XCircle size={16}/>} color="rose" />
      </div>

      {/* 3. Main Order Table */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <OrderTable orders={orders} />
      </div>

      {/* 4. Pagination Placeholder */}
      <div className="flex justify-center pt-4">
         <nav className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {[1, 2, 3].map(n => (
              <button key={n} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${n === 1 ? 'bg-[#7e2827] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                {n}
              </button>
            ))}
         </nav>
      </div>
    </div>
  );
};

// Sub-component for Stats
const StatusCard = ({ label, value, icon, color }) => {
  const colors = {
    slate: "text-slate-600 bg-slate-100",
    amber: "text-amber-600 bg-amber-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50"
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-[#7e2827]/20 transition-all cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
};

export default InhouseOrders;
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Boxes, 
  Clock, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from "../../../../api/axios";

const WarehouseDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStock: 0,
    pendingOrders: 0,
    lowStockAlerts: 0,
    incomingShipments: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial Data Fetching
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Replace with your actual endpoints
        // const { data } = await API.get('/warehouse/stats');
        // setStats(data);
        
        // Dummy Data for Preview
        setStats({
          totalStock: 12450,
          pendingOrders: 28,
          lowStockAlerts: 12,
          incomingShipments: 5
        });

        setRecentActivities([
          { id: 1, type: 'IN', item: 'Basmati Rice 5kg', qty: '+50', time: '10 mins ago', status: 'completed' },
          { id: 2, type: 'OUT', item: 'Fortune Oil 1L', qty: '-12', time: '25 mins ago', status: 'pending' },
          { id: 3, type: 'ALERT', item: 'Sugar 1kg', qty: 'Low Stock', time: '1 hour ago', status: 'warning' },
        ]);
      } catch (err) {
        console.error("Dashboard Load Error");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform`}>
        <Icon size={100} />
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>
          <Icon size={24} />
        </div>
        <div className="flex items-center text-emerald-500 font-black text-[10px] bg-emerald-50 px-2 py-1 rounded-lg">
          <TrendingUp size={12} className="mr-1" /> +12%
        </div>
      </div>
      <div className="mt-6 relative z-10">
        <h3 className="text-3xl font-black text-black tracking-tighter">{value}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-4 flex items-center gap-1">
          <Clock size={10} /> {subtext}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 p-4 animate-in fade-in duration-700 font-sans">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-900/20">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">Warehouse Console</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span> Terminal Active: HUB-01
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/warehouse/stock')} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7e2827] transition-all shadow-lg">
            Manage Inventory
          </button>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Stock Units" 
          value={stats.totalStock.toLocaleString()} 
          icon={Boxes} 
          color="bg-black" 
          subtext="Updated 2 mins ago" 
        />
        <StatCard 
          title="Pending Dispatches" 
          value={stats.pendingOrders} 
          icon={Truck} 
          color="bg-blue-600" 
          subtext="12 Express deliveries" 
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStockAlerts} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
          subtext="Immediate restock needed" 
        />
        <StatCard 
          title="Incoming Goods" 
          value={stats.incomingShipments} 
          icon={Truck} 
          color="bg-emerald-600" 
          subtext="3 arriving today" 
        />
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Inventory Movement */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
               <ClipboardList size={18} className="text-emerald-600"/> Stock Movement Log
            </h3>
            <button className="text-[10px] font-black text-slate-400 hover:text-black uppercase underline decoration-2 underline-offset-4">View All Logs</button>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-4 py-4">Item Details</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Quantity</th>
                  <th className="px-4 py-4">Timestamp</th>
                  <th className="px-4 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-black uppercase">{act.item}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${act.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {act.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-xs">{act.qty}</td>
                    <td className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase">{act.time}</td>
                    <td className="px-4 py-4 text-right">
                       <span className={`h-2 w-2 rounded-full inline-block ${act.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Alerts Card */}
        <div className="space-y-6">
          <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
             <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:rotate-12 transition-transform">
               <Truck size={150} />
             </div>
             <h4 className="text-xl font-black uppercase leading-tight">Generate<br/>Pick-List</h4>
             <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Process pending 28 orders for the morning slot.</p>
             <button className="mt-8 flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                Start Picking <ChevronRight size={14}/>
             </button>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Inventory Status</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                  <span>Capacity Used</span>
                  <span>78%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                * Based on current bin assignments and aisle occupancy.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WarehouseDashboard;
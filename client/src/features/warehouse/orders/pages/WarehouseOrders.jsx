import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Eye, 
  Truck, 
  CheckCircle, 
  Clock, 
  Filter,
  ChevronRight,
  MapPin,
  Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from "../../../../api/axios";

const WarehouseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch Orders from Backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Backend should return orders assigned to this warehouse
      const { data } = await API.get('/orders/warehouse-orders'); 
      setOrders(data.data || []);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Update Order Status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await API.patch(`/orders/status/${orderId}`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders(); // Refresh list
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'packed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans text-black animate-in fade-in duration-500">
      
      {/* 1. Header & Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#00966e] p-3 rounded-2xl text-white shadow-lg shadow-emerald-900/20">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Warehouse Dispatch</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage outbound shipments & packing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="text-right hidden md:block px-4 border-r border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Ready to Pack</p>
                <p className="text-xl font-black text-[#00966e]">{orders.filter(o => o.status === 'pending').length}</p>
            </div>
            <button onClick={fetchOrders} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                <Clock size={20} className="text-slate-600"/>
            </button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Order ID, Customer Name..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#00966e]/20 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
            className="bg-slate-50 border-none rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
        >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
        </select>
      </div>

      {/* 3. Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
            <div className="py-20 text-center font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Dispatch items...</div>
        ) : orders
            .filter(o => filterStatus === "all" || o.status === filterStatus)
            .filter(o => o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || o.userName?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((order) => (
          <div key={order._id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:shadow-xl transition-all group">
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              
              {/* Order Basic Info */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-wider">#{order.orderId}</span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    ● {order.status}
                  </span>
                </div>
                <h3 className="text-lg font-black uppercase text-black">{order.userName}</h3>
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                  <MapPin size={14} className="text-[#00966e]"/> {order.address || 'Standard Delivery'}
                </div>
              </div>

              {/* Items Summary (Invoice Style) */}
              <div className="flex-1 px-6 border-l border-slate-100 hidden xl:block">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Order Contents</p>
                 <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, i) => (
                        <span key={i} className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {item.quantity}x {item.productName}
                        </span>
                    ))}
                 </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
                
                {/* Status Toggle Buttons */}
                {order.status === 'pending' && (
                    <button 
                        onClick={() => handleUpdateStatus(order._id, 'packed')}
                        className="flex-1 lg:flex-none bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00966e] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={16}/> Mark Packed
                    </button>
                )}

                {order.status === 'packed' && (
                    <button 
                        onClick={() => handleUpdateStatus(order._id, 'shipped')}
                        className="flex-1 lg:flex-none bg-[#00966e] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        <Truck size={16}/> Ready for Pickup
                    </button>
                )}

                <button 
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-black hover:text-white transition-all"
                    title="View Invoice"
                >
                    <Eye size={20}/>
                </button>
                
                <button 
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Print Label"
                >
                    <Download size={20}/>
                </button>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && !loading && (
            <div className="py-20 text-center flex flex-col items-center">
                <Package size={50} className="text-slate-100 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No orders assigned to your station</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseOrders;
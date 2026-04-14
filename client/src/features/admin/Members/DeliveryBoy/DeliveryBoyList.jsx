import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Loader2, Bike, Package, ShieldCheck, ShieldAlert, Circle } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const DeliveryBoyList = () => {
  const navigate = useNavigate();
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination State matching your JSON structure
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchDeliveryBoys = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      });
      
      const response = await API.get(`/admin/riders/all?${params.toString()}`); 
      setDeliveryBoys(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Error loading fleet data");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.limit]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => fetchDeliveryBoys(), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchDeliveryBoys]);

  // Handle the specific Status strings from your JSON (OFFLINE, ONLINE, etc.)
  const renderDutyStatus = (status) => {
    const s = status?.toUpperCase();
    switch(s) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black border border-emerald-100">
            <Circle size={8} className="fill-emerald-600 animate-pulse" /> ONLINE
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black border border-slate-200">
            <Circle size={8} className="fill-slate-400" /> OFFLINE
          </span>
        );
      case 'BUSY':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-100">
            <Circle size={8} className="fill-amber-500" /> ON DELIVERY
          </span>
        );
      default:
        return <span className="text-[9px] font-black text-slate-400 uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header Card */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Fleet Command</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Monitoring {pagination.total} Logistics Partners
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Bike className="text-[#7e2827]" size={24} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by Name or Phone..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#7e2827] text-sm font-bold transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, page: 1})); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Rider Information</th>
                <th className="px-6 py-5">Duty Status</th>
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5 text-center">Verification</th>
                <th className="px-6 py-5 text-center">Active Load</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#7e2827]" size={32} /></td></tr>
              ) : deliveryBoys.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm uppercase">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-black uppercase text-sm tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">{renderDutyStatus(item.status)}</td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                       <Bike size={16} className="text-slate-300" />
                       <span className="text-xs font-black uppercase text-slate-600 tracking-tight">{item.vehicleType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {item.isVerified ? (
                      <div className="flex items-center justify-center gap-1 text-emerald-600 font-black text-[10px] uppercase">
                        <ShieldCheck size={14} /> Verified
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-rose-400 font-black text-[10px] uppercase">
                        <ShieldAlert size={14} /> Unverified
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                      <Package size={14} className="text-slate-400" />
                      <span className="text-xs font-black">{item.activeOrders}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => navigate(`/admin/delivery-boys/view/${item._id}`)}
                      className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-black hover:border-black transition-all shadow-sm"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing Page {pagination.page} of {pagination.pages}
           </p>
           <div className="flex gap-2">
              <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({...p, page: p.page - 1}))}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-black hover:text-white"
              >
                Prev
              </button>
              <button 
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(p => ({...p, page: p.page + 1}))}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase disabled:opacity-30 transition-all hover:bg-black hover:text-white"
              >
                Next
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyList;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Search, Loader2, Trash } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const DeliveryBoyList = () => {
  const navigate = useNavigate();
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch data using the backend search query 'q'
  const fetchDeliveryBoys = async () => {
    try {
      setLoading(true);
      // Backend getAllRiders expects 'q' for search
      const response = await API.get(`/admin/riders/all?q=${searchTerm}`); 
      setDeliveryBoys(response.data.data || []);
    } catch (error) {
      toast.error("Error loading delivery boys information");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when searchTerm changes (with a small debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDeliveryBoys();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const renderStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pending' || !s) {
      return <span className="bg-amber-400 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Pending</span>;
    } else if (s === 'active' || s === 'accepted') {
      return <span className="bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Accepted</span>;
    } else {
      return <span className="bg-red-500 text-white px-3 py-1 rounded text-[10px] font-bold uppercase">Rejected</span>;
    }
  };

  const handleDeleteAll = async () => {
    if (selectedIds.length === 0) return toast.error("Please select rows to delete");
    if (window.confirm("Are you sure you want to delete selected records?")) {
      try {
        // Updated to use your likely rider bulk delete route
        await API.post('/admin/riders/delete-bulk', { ids: selectedIds });
        toast.success("Records deleted successfully");
        setSelectedIds([]);
        fetchDeliveryBoys();
      } catch (err) {
        toast.error("Failed to delete records");
      }
    }
  };

  if (loading && searchTerm === "") return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#7e2827]" size={40} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-t-2xl border-b">
        <h4 className="text-slate-700 font-black uppercase tracking-tight">Delivery Boys</h4>
        <button 
          onClick={handleDeleteAll}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-all shadow-md"
        >
          <Trash size={14} /> Delete Selected ({selectedIds.length})
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 overflow-hidden rounded-b-2xl">
        <div className="p-4 bg-slate-50/50 flex justify-between items-center border-b">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
            Show <select className="border rounded px-1 outline-none"><option>10</option></select> entries
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search Name, Email, Phone..."
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:border-[#7e2827] text-sm font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-white border-b">
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="accent-[#7e2827]"
                    onChange={(e) => setSelectedIds(e.target.checked ? deliveryBoys.map(d => d._id) : [])} 
                  />
                </th>
                <th className="p-4">Rider</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Joined On</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {deliveryBoys.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="accent-[#7e2827]"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => setSelectedIds(prev => prev.includes(item._id) ? prev.filter(i => i !== item._id) : [...prev, item._id])}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {item.image ? (
                          <img src={item.image} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <span className="text-slate-400 font-black">{item.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none mb-1">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {item._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700 font-bold">{item.phone}</p>
                    <p className="text-[11px] text-slate-400">{item.email}</p>
                  </td>
                  <td className="p-4 text-slate-500 font-bold text-xs uppercase">
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4 text-center">{renderStatus(item.status)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/delivery-boys/view/${item._id}`)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {deliveryBoys.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">
              No delivery partners registered yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyList;
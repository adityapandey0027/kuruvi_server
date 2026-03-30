import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Mail, Navigation, ChevronLeft, Save, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import API from "../../../../api/axios";

const StoreManagement = () => {
  const [view, setView] = useState('list'); // 'list' | 'add' | 'edit'
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);

  // 1. Fetch Stores
  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/stores'); // Backend endpoint check karein
      setStores(data.data || []);
    } catch (err) {
      toast.error("Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  // 2. Delete Store
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this Dark Store?")) {
      try {
        await API.delete(`/stores/${id}`);
        setStores(stores.filter(s => s._id !== id));
        toast.success("Store removed successfully");
      } catch (err) { toast.error("Delete failed"); }
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans text-black animate-in fade-in duration-500">
      {view === 'list' ? (
        <>
          {/* Header Section */}
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Dark Store Network</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage warehouse locations and service areas</p>
            </div>
            <button
              onClick={() => { setSelectedStore(null); setView('add'); }}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-xs font-black uppercase shadow-lg hover:bg-[#7e2827] transition-all"
            >
              <Plus size={16} /> Add New Store
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or city..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#7e2827]/10 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                  <tr>
                    <th className="px-8 py-5">Store Details</th>
                    <th className="px-6 py-5">Location/City</th>
                    <th className="px-6 py-5 text-center">Service Radius</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-20 text-xs font-bold text-slate-400 animate-pulse uppercase">Syncing store network...</td></tr>
                  ) : stores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.city.toLowerCase().includes(searchTerm.toLowerCase())).map((store) => (
                    <tr key={store._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-black group-hover:text-white transition-all">
                            <Navigation size={18} />
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tight">{store.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 lowercase">{store.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 font-bold text-xs uppercase text-slate-600">
                          <MapPin size={14} className="text-rose-500" /> {store.city}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                          {store.serviceRadius} KM
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[10px] font-black uppercase ${store.isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                          ● {store.isActive ? 'Live' : 'Maintenance'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedStore(store); setView('edit'); }}
                            className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100 transition-all"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(store._id)}
                            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stores.length === 0 && !loading && (
                <div className="py-24 text-center font-black text-slate-300 uppercase text-[10px] tracking-widest">No Dark Stores configured yet</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <StoreForm 
          type={view} 
          data={selectedStore} 
          onBack={() => setView('list')} 
          refresh={fetchStores} 
        />
      )}
    </div>
  );
};

// --- Add/Edit Form Component ---
const StoreForm = ({ type, data, onBack, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: data?.name || "",
    email: data?.email || "",
    password: "",
    city: data?.city || "",
    serviceRadius: data?.serviceRadius || "",
    lat: data?.location?.coordinates[1] || "",
    lng: data?.location?.coordinates[0] || "",
    isActive: data?.isActive ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'add') {
        const res = await API.post('/stores', formData);

        toast.success("New Dark Store activated!");
      } else {
        // Barcode ya password blank hai toh use payload se hata sakte hain
        const updatePayload = { ...formData };
        if (!updatePayload.password) delete updatePayload.password;
        
        await API.patch(`/stores/${data._id}`, updatePayload);
        toast.success("Store details updated!");
      }
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200 shadow-sm">
          <ChevronLeft size={20} className="text-black" />
        </button>
        <h3 className="text-sm font-black text-black uppercase tracking-widest">{type === 'add' ? 'Configure New Dark Store' : 'Edit Store Details'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Basic Info */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Store Name</label>
            <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. South Delhi Hub" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Store Email (Login ID)</label>
            <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="store@app.com" />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password {type === 'edit' && '(Leave blank to keep same)'}</label>
            <div className="relative">
              <input required={type === 'add'} type={showPassword ? "text" : "password"} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational City</label>
            <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. New Delhi" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Latitude</label>
            <input required type="number" step="any" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.lat} onChange={(e) => setFormData({...formData, lat: e.target.value})} placeholder="28.6139" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Longitude</label>
            <input required type="number" step="any" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.lng} onChange={(e) => setFormData({...formData, lng: e.target.value})} placeholder="77.2090" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Radius (KM)</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.serviceRadius} onChange={(e) => setFormData({...formData, serviceRadius: e.target.value})} placeholder="10" />
          </div>

        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? "Processing..." : <><Save size={18}/> Save Store Configuration</>}
        </button>
      </form>
    </div>
  );
};

export default StoreManagement;
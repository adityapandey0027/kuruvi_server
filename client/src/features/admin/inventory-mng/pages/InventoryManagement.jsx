import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Boxes, Package, Calendar, Tag, 
  ChevronLeft, Save, AlertCircle, Trash2, Edit3, X, Check 
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from "../../../../api/axios";

// Debounce Helper for searching variants
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const InventoryManage = () => {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/inventory'); // Backend check karein
      setInventory(data.data || []);
    } catch (err) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  return (
    <div className="space-y-6 p-4 font-sans text-black animate-in fade-in duration-500">
      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Stock Management</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage store-wise inventory & batches</p>
            </div>
            <button
              onClick={() => setView('add')}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl text-xs font-black uppercase shadow-lg hover:bg-emerald-600 transition-all"
            >
              <Plus size={16} /> Add New Stock
            </button>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Product/Variant</th>
                    <th className="px-6 py-5 text-center">Batch No.</th>
                    <th className="px-6 py-5 text-center">Current Stock</th>
                    <th className="px-6 py-5 text-center">Price</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-20 font-black text-slate-400 uppercase text-xs animate-pulse">Syncing Inventory...</td></tr>
                  ) : inventory.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                              <Package size={18} />
                           </div>
                           <div>
                              <p className="font-black text-sm uppercase">{inv.variantId?.sku || 'N/A'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{inv.variantId?.size} | {inv.storeId?.name}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-xs uppercase text-slate-600">{inv.batchNumber || '-'}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-xs font-black ${inv.stock <= inv.lowStockThreshold ? 'text-rose-500' : 'text-black'}`}>
                          {inv.stock} Units
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-emerald-700 text-xs">₹{inv.price}</td>
                      <td className="px-8 py-5 text-right">
                         <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${inv.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {inv.stock > 0 ? 'In Stock' : 'Out of Stock'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <InventoryForm onBack={() => setView('list')} refresh={fetchInventory} />
      )}
    </div>
  );
};

// --- Add Inventory Form Component ---
const InventoryForm = ({ onBack, refresh }) => {
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // States
  const [formData, setFormData] = useState({
    storeId: "", storeName: "", variantId: "", variantSku: "",
    price: "", stock: 0, lowStock: 5, batchNumber: "", expiryDate: ""
  });

  // Search States
  const [vSearch, setVSearch] = useState("");
  const [vResults, setVResults] = useState([]);
  const [showVDropdown, setShowVDropdown] = useState(false);
  const debouncedVSearch = useDebounce(vSearch, 400);

  const [stores, setStores] = useState([]);

  // Fetch Initial Data
  useEffect(() => {
    const loadStores = async () => {
      const { data } = await API.get('/stores');
      setStores(data.data || []);
    };
    loadStores();
  }, []);

  // Variant Search Logic
  useEffect(() => {
    const searchVariants = async () => {
      if (!debouncedVSearch) return;
      try {
        const { data } = await API.get(`/variants/search?q=${debouncedVSearch}`); // Check this route
        setVResults(data.data || []);
      } catch (err) { console.error(err); }
    };
    if (showVDropdown) searchVariants();
  }, [debouncedVSearch, showVDropdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/inventory', formData);
      toast.success("Inventory record added!");
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
        <h3 className="text-sm font-black text-black uppercase tracking-widest">New Stock Entry</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Store Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Dark Store</label>
            <select required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.storeId} onChange={(e) => setFormData({...formData, storeId: e.target.value})}>
              <option value="">Choose Store...</option>
              {stores.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
            </select>
          </div>

          {/* Variant Searchable Selection */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Search Variant (SKU)</label>
            <div className="relative">
               <input
                type="text"
                placeholder={formData.variantSku || "Enter SKU..."}
                className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-black outline-none focus:border-black transition-all ${formData.variantId ? 'border-emerald-200' : 'border-slate-100'}`}
                value={vSearch}
                onFocus={() => setShowVDropdown(true)}
                onChange={(e) => setVSearch(e.target.value)}
              />
              {formData.variantId && <X size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500 cursor-pointer" onClick={() => {setVSearch(""); setFormData({...formData, variantId: "", variantSku: ""})}}/>}
            </div>
            {showVDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                {vResults.map(v => (
                  <div key={v._id} className="p-4 text-sm font-bold text-black hover:bg-slate-50 cursor-pointer flex justify-between border-b last:border-0" onClick={() => {
                    setFormData({...formData, variantId: v._id, variantSku: v.sku});
                    setShowVDropdown(false);
                    setVSearch("");
                  }}>
                    {v.sku} <span className="text-[10px] text-slate-400">{v.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selling Price (₹)</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Stock Qty</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} placeholder="0" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Low Stock Alert Level</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.lowStock} onChange={(e) => setFormData({...formData, lowStock: e.target.value})} placeholder="5" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch Number</label>
            <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.batchNumber} onChange={(e) => setFormData({...formData, batchNumber: e.target.value})} placeholder="B-102" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Date</label>
            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:border-black" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
          </div>

        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? "Processing..." : <><Save size={18}/> Commit to Inventory</>}
        </button>
      </form>
    </div>
  );
};

export default InventoryManage;
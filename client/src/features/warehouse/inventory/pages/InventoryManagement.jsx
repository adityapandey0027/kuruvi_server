import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { 
  Plus, Search, Boxes, Package, ChevronLeft, Save, 
  Trash2, Edit3, X, Check, Store 
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from "../../../../api/axios";

// Helper function for Debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const InventoryManagement = () => {
  const { storeId } = useParams(); // URL context: /admin/inventory/:storeId
  const navigate = useNavigate();
  
  const [view, setView] = useState('list'); 
  const [inventory, setInventory] = useState([]);
  const [storeDetails, setStoreDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 1. Fetch Inventory for the SPECIFIC STORE only
  const fetchStoreInventory = async (query = "") => {
    if (!storeId) return;
    try {
      setLoading(true);
      const { data } = await API.get(`/inventory/store/${storeId}?q=${query}`);
      setInventory(data.data || []);
      if(data.store) setStoreDetails(data.store);
    } catch (err) {
      toast.error("Failed to load store inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreInventory(debouncedSearch);
  }, [storeId, debouncedSearch]);

  const handleDelete = async (id) => {
    if (window.confirm("Remove this item from store inventory?")) {
      try {
        await API.delete(`/inventory/${id}`);
        setInventory(inventory.filter(i => i._id !== id));
        toast.success("Stock removed");
      } catch (err) { toast.error("Action failed"); }
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans text-black animate-in fade-in duration-500">
      {view === 'list' ? (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-black p-3 rounded-2xl text-white shadow-lg">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {storeDetails?.name || 'Loading...'} 
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                   Terminal ID: {storeId?.slice(-6).toUpperCase()} | {storeDetails?.city}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"><ChevronLeft size={20}/></button>
               <button onClick={() => setView('add')} className="flex items-center gap-2 bg-[#7e2827] text-white px-6 py-3 rounded-xl text-xs font-black uppercase shadow-lg hover:scale-105 transition-all">
                <Plus size={16} /> Assign New Stock
               </button>
            </div>
          </div>

          {/* Search Table Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter by SKU or Product Name..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-slate-100">
                Active SKU Count: {inventory.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Product Info</th>
                    <th className="px-6 py-5">Batch/SKU</th>
                    <th className="px-6 py-5 text-center">In-Stock</th>
                    <th className="px-6 py-5 text-center">Unit Price</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="5" className="text-center py-20 font-black text-slate-400 uppercase text-xs animate-pulse">Scanning Inventory...</td></tr>
                  ) : inventory.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
                              {inv.variantId?.images?.[0]?.url ? 
                                <img src={inv.variantId.images[0].url} className="w-full h-full object-cover" alt="" /> : 
                                <Package size={18} className="text-slate-200" />
                              }
                           </div>
                           <div>
                              <p className="font-black text-sm uppercase text-black">{inv.variantId?.productId?.name || 'Product'}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{inv.variantId?.size} | {inv.variantId?.weight} {inv.variantId?.unit}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-600 uppercase">
                         <div className="font-black text-black">{inv.variantId?.sku}</div>
                         <div className="text-[9px] text-slate-400 mt-0.5">Batch: {inv.batchNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-xs font-black px-3 py-1 rounded-lg ${inv.stock <= inv.lowStockThreshold ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-black'}`}>
                          {inv.stock} Units
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="font-black text-emerald-700 text-sm">₹{inv.price}</p>
                        <p className="text-[8px] font-bold text-slate-400 line-through">MRP: ₹{inv.variantId?.mrp}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2.5 text-slate-400 hover:text-black hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-200 transition-all"><Edit3 size={16}/></button>
                            <button onClick={() => handleDelete(inv._id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inventory.length === 0 && !loading && (
                <div className="py-24 text-center">
                  <Boxes size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="font-black text-slate-300 uppercase text-[10px] tracking-widest">No stock assigned to this terminal</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <InventoryForm 
          onBack={() => setView('list')} 
          refresh={() => fetchStoreInventory(searchTerm)} 
          fixedStoreId={storeId}
        />
      )}
    </div>
  );
};

// --- Form Component using your JSON Data Structure ---
const InventoryForm = ({ onBack, refresh, fixedStoreId }) => {
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    storeId: fixedStoreId,
    variantId: "", variantLabel: "",
    price: "", stock: 0, lowStock: 5, batchNumber: "", expiryDate: ""
  });

  const [vSearch, setVSearch] = useState("");
  const [vResults, setVResults] = useState([]);
  const [showVDropdown, setShowVDropdown] = useState(false);
  const debouncedVSearch = useDebounce(vSearch, 400);

  // Auto-close dropdown on click outside
  useEffect(() => {
    const handle = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowVDropdown(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Variant Search Logic mapping to your JSON response
  useEffect(() => {
    const searchVariants = async () => {
      if (!debouncedVSearch) return;
      try {
        const { data: res } = await API.get(`/products/variants/search?q=${debouncedVSearch}`);
        // Your JSON structure uses data.variants array
        setVResults(res.data.variants || []);
      } catch (err) { console.error(err); }
    };
    if (showVDropdown) searchVariants();
  }, [debouncedVSearch, showVDropdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/inventories', formData);
      toast.success("Stock assigned successfully!");
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || "Check MRP rules");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all border border-slate-200 shadow-sm"><ChevronLeft size={20}/></button>
        <h3 className="text-sm font-black text-black uppercase tracking-widest">Add Inventory Record</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SEARCHABLE VARIANT FIELD */}
          <div className="lg:col-span-2 space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Search Product / SKU</label>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input
                type="text"
                placeholder={formData.variantLabel || "Type name or scan barcode..."}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:ring-4 focus:ring-black/5 focus:bg-white transition-all"
                value={vSearch}
                onFocus={() => setShowVDropdown(true)}
                onChange={(e) => setVSearch(e.target.value)}
              />
              {formData.variantId && <Check size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 rounded-full p-1 border border-emerald-100" />}
            </div>

            {showVDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl max-h-72 overflow-y-auto animate-in zoom-in-95 duration-150">
                {vResults.length > 0 ? vResults.map(v => (
                  <div key={v.variantId} className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-4 border-b border-slate-50 last:border-0" 
                    onClick={() => {
                      setFormData({...formData, variantId: v.variantId, variantLabel: `${v.productName} (${v.sku})`});
                      setShowVDropdown(false);
                      setVSearch("");
                    }}>
                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                      {v.images?.[0]?.url && <img src={v.images[0].url} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-xs uppercase text-black">{v.productName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{v.sku} | {v.size} | MRP: ₹{v.mrp}</p>
                    </div>
                    <Plus size={16} className="text-slate-300" />
                  </div>
                )) : (
                  <div className="p-10 text-center text-[10px] font-black text-slate-400 uppercase">Type to search variants...</div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Store Selling Price (₹)</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Add to Stock (Qty)</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Low Stock Warning At</label>
            <input required type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white" value={formData.lowStock} onChange={(e) => setFormData({...formData, lowStock: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Batch ID / No.</label>
            <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white" value={formData.batchNumber} onChange={(e) => setFormData({...formData, batchNumber: e.target.value})} placeholder="e.g. BTC-2026-X" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Stock Expiry Date</label>
            <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-black outline-none focus:bg-white" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-[1.5rem] shadow-xl hover:bg-[#7e2827] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
          {loading ? "Processing Warehouse Sync..." : <><Save size={18}/> Commit Stock to Inventory</>}
        </button>
      </form>
    </div>
  );
};

export default InventoryManagement;
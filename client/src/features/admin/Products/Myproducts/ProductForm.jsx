import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Edit3, Image as ImageIcon, X, Check, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductForm = () => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState([]);
  const [packInput, setPackInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Modal editing state
  const [tempVariant, setTempVariant] = useState({
    pack_size: "", mrp: 0, discount_off: 0, final_price: 0, stock: 0, description: ""
  });

  // --- FIX: Function Name Matched with Button Call ---
  const handleAddVariantToList = () => {
    if (!packInput.trim()) return;
    const newV = {
      id: Date.now(),
      pack_size: packInput,
      mrp: 0,
      discount_off: 0,
      final_price: 0,
      stock: 0,
      description: ""
    };
    setVariants([...variants, newV]);
    setPackInput("");
  };

  const openEditModal = (index) => {
    setEditingIndex(index);
    setTempVariant({ ...variants[index] });
    setIsModalOpen(true);
  };

  // Real-time Discount Calculation Logic
  useEffect(() => {
    const mrp = parseFloat(tempVariant.mrp) || 0;
    const off = parseFloat(tempVariant.discount_off) || 0;
    if (mrp >= 0) {
      const discounted = mrp - (mrp * off / 100);
      setTempVariant(prev => ({ ...prev, final_price: discounted.toFixed(2) }));
    }
  }, [tempVariant.mrp, tempVariant.discount_off]);

  const saveVariantChanges = () => {
    const updated = [...variants];
    updated[editingIndex] = tempVariant;
    setVariants(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* 1. TOP NAVIGATION BAR */}
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-[#7e2827] transition-all">
          <ArrowLeft size={16} /> Back to List
        </button>
        <button className="bg-[#7e2827] text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
          <Save size={18} /> Publish Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRODUCT & VARIANTS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General Info Card */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#7e2827] pl-4">Core Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Product Name</label>
                <input type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5" placeholder="e.g. Fortune Mustard Oil" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer">
                  <option>Select Category...</option>
                  <option>Oil & Masala</option>
                  <option>Dairy</option>
                  <option>Snacks</option>
                </select>
              </div>
            </div>
          </div>

          {/* Variants Manager Card */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#7e2827] pl-4">Price & Variants</h3>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto">
                <input 
                  type="text" 
                  value={packInput}
                  onChange={(e) => setPackInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddVariantToList()}
                  placeholder="Add Size (1kg, 500ml)" 
                  className="bg-transparent px-4 py-2 text-xs font-bold outline-none flex-1 md:w-40"
                />
                <button onClick={handleAddVariantToList} className="bg-[#7e2827] text-white p-2 rounded-xl hover:opacity-90 transition-all shadow-md shadow-red-900/10">
                  <Plus size={20}/>
                </button>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-3xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[9px]">
                  <tr>
                    <th className="px-6 py-4">Pack Size</th>
                    <th className="px-6 py-4">Final Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {variants.map((v, idx) => (
                    <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-black text-slate-700 uppercase tracking-tight">{v.pack_size}</td>
                      <td className="px-6 py-5 font-bold text-emerald-600">₹{v.final_price || "0.00"}</td>
                      <td className="px-6 py-5 font-bold text-slate-400">{v.stock || 0} pcs</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(idx)} className="p-2 bg-white border border-slate-200 text-amber-500 rounded-xl hover:bg-amber-50 transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => setVariants(variants.filter(item => item.id !== v.id))} className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {variants.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">No variants added yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MEDIA SECTION */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Main Thumbnail</h3>
            <div className="relative group aspect-square rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-[#7e2827]/20 transition-all">
                <ImageIcon size={48} className="text-slate-200 group-hover:text-[#7e2827] transition-colors" strokeWidth={1} />
                <span className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-widest">Select Image</span>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="mt-4 text-[9px] text-slate-300 font-bold uppercase tracking-tighter italic">PNG/JPG Format only</p>
          </div>
        </div>
      </div>

      {/* --- VARIANT EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <div className="flex items-center gap-3">
                  <div className="bg-[#7e2827] p-2.5 rounded-2xl text-white shadow-lg shadow-red-900/20"><Calculator size={20}/></div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">Configure Variant</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Size: {tempVariant.pack_size}</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={20}/></button>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto max-h-[65vh]">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MRP Price (₹)</label>
                <input type="number" value={tempVariant.mrp} onChange={(e) => setTempVariant({...tempVariant, mrp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Discount (%)</label>
                <input type="number" value={tempVariant.discount_off} onChange={(e) => setTempVariant({...tempVariant, discount_off: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 text-emerald-600">Calculated Final Price</label>
                <input type="text" readOnly value={tempVariant.final_price} className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black outline-none border border-emerald-100 shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stock Quantity</label>
                <input type="number" value={tempVariant.stock} onChange={(e) => setTempVariant({...tempVariant, stock: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Variant Summary</label>
                <input type="text" value={tempVariant.description} onChange={(e) => setTempVariant({...tempVariant, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5" placeholder="e.g. Best for small families..." />
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
               <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
               <button onClick={saveVariantChanges} className="bg-[#7e2827] text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                 <Check size={18}/> Save Changes
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
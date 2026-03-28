import React, { useState } from 'react';
import { ArrowLeft, Upload, Save, Eye } from 'lucide-react';

const SubcategoryForm = ({ mode, data, categories, onBack }) => {
  const [formData, setFormData] = useState({
    name: data?.name || "",
    category: data?.category || "",
  });
  const [preview, setPreview] = useState(data?.image || null);

  const isViewOnly = mode === 'view';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-[#7e2827] font-bold text-xs uppercase tracking-widest transition-colors">
        <ArrowLeft size={16} /> Back to List
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
            {mode === 'view' ? 'Subcategory Information' : `${mode} Subcategory`}
          </h3>
        </div>

        <form className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subcategory Name</label>
              <input 
                disabled={isViewOnly}
                type="text" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#7e2827]/5 disabled:opacity-60"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^A-Za-z\s]/g, '')})}
                placeholder="Ex: Cricket, Diapers..."
              />
            </div>

            {/* Category Select */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Parent Category</label>
              <select 
                disabled={isViewOnly}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#7e2827]/5 disabled:opacity-60"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Banner Image</label>
            <div className="flex items-center gap-6 p-6 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
              <div className="h-24 w-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Upload className="text-slate-200" size={30} />}
              </div>
              {!isViewOnly && (
                <div className="space-y-1">
                  <input type="file" onChange={handleImageChange} className="text-xs font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-[#7e2827] file:text-white hover:file:opacity-90 cursor-pointer" />
                  <p className="text-[10px] text-slate-400 font-medium italic">Recommended size: 512x512px (PNG/JPG)</p>
                </div>
              )}
            </div>
          </div>

          {!isViewOnly && (
            <div className="pt-6 border-t border-slate-50 flex gap-4">
              <button type="submit" className="flex-1 py-4 bg-[#7e2827] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-900/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2">
                <Save size={16} /> Save Subcategory
              </button>
              <button type="button" onClick={onBack} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubcategoryForm;
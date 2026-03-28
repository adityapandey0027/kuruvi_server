import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Search, UploadCloud } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // 1. CORE PRODUCT STATE
  const [productData, setProductData] = useState({
    name: "", brand: "", categoryId: "", categoryName: "", description: "", tags: "", isActive: true
  });

  // 2. CATEGORY SEARCH
  const [catSearch, setCatSearch] = useState("");
  const [catResults, setCatResults] = useState([]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const debouncedCatSearch = useDebounce(catSearch, 400);

  // 3. VARIANTS STATE
  const [variants, setVariants] = useState([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempVariant, setTempVariant] = useState({
    sku: "", barcode: "", mrp: "", size: "", unit: "kg", weight: "", images: [], previewUrls: []
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCatDropdown(false); };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Category Search Fetch
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await API.get(`/categories/search?q=${debouncedCatSearch}`);
        setCatResults(data.data || []);
      } catch (err) { console.error(err); }
    };
    if (showCatDropdown) fetchCats();
  }, [debouncedCatSearch, showCatDropdown]);

  // Handle Multi-image per variant
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (tempVariant.previewUrls.length + files.length > 6) return toast.warning("Max 6 images allowed");
    const urls = files.map(f => URL.createObjectURL(f));
    setTempVariant(p => ({ ...p, images: [...p.images, ...files], previewUrls: [...p.previewUrls, ...urls] }));
  };

  const removeImage = (idx) => {
    setTempVariant(p => ({ ...p, images: p.images.filter((_, i) => i !== idx), previewUrls: p.previewUrls.filter((_, i) => i !== idx) }));
  };

  const openVariantForm = (idx = null) => {
    if (idx !== null) { setEditingIndex(idx); setTempVariant({ ...variants[idx] }); }
    else { setEditingIndex(null); setTempVariant({ sku: "", barcode: "", mrp: "", size: "", unit: "kg", weight: "", images: [], previewUrls: [] }); }
    setShowVariantForm(true);
  };

  const saveVariant = () => {
    if (!tempVariant.sku || !tempVariant.mrp) return toast.warning("SKU and MRP are required");
    const updated = [...variants];
    if (editingIndex !== null) updated[editingIndex] = tempVariant;
    else updated.push({ ...tempVariant, id: Date.now() });
    setVariants(updated);
    setShowVariantForm(false);
  };

  // --- MERGED API CALL (Single Multipart Request) ---
  const handlePublish = async () => {
    if (!productData.name || !productData.categoryId || variants.length === 0) {
      return toast.warning("Complete core info and add at least one variant");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // A. Append Core Product Data
      formData.append('name', productData.name);
      formData.append('brand', productData.brand);
      formData.append('categoryId', productData.categoryId);
      formData.append('description', productData.description);
      formData.append('tags', productData.tags);

      // B. Append Variants (As JSON String)
      // Note: We strip the 'images' and 'previewUrls' from JSON because files are sent separately
      const variantsMetadata = variants.map((v, index) => ({
        sku: v.sku, barcode: v.barcode, mrp: v.mrp, 
        size: v.size, unit: v.unit, weight: v.weight,
        imageCount: v.images.length // Helps backend know how many files belong to this variant
      }));
      formData.append('variantsMetadata', JSON.stringify(variantsMetadata));

      // C. Append All Images with indexed keys
      variants.forEach((v, vIdx) => {
        v.images.forEach((imgFile, imgIdx) => {
          formData.append(`variant_images_${vIdx}`, imgFile);
        });
      });

      // Single API Call
      if (id) {
        await API.put(`/products/${id}`, formData);
        toast.success("Product Updated!");
      } else {
        await API.post('/products', formData);
        toast.success("Product & Variants Created!");
      }
      navigate('/admin/my-products');
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setLoading(false); }
  };

  if (showVariantForm) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in slide-in-from-bottom-4 duration-300">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowVariantForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} className="text-black"/></button>
              <h2 className="text-lg font-black text-black uppercase tracking-tight">{editingIndex !== null ? 'Edit Variant' : 'New Variant'}</h2>
            </div>
            <button onClick={saveVariant} className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-[#7e2827] transition-all">
              <Check size={18}/> Confirm Variant
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
               <label className="text-[10px] font-black text-black uppercase tracking-widest block">Media (Up to 6)</label>
               {tempVariant.previewUrls.length < 6 && (
                 <div className="relative aspect-video rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group">
                    <UploadCloud size={40} className="text-slate-300 group-hover:text-black" />
                    <span className="text-[10px] font-black text-slate-400 mt-2 uppercase">Add Photos</span>
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                 </div>
               )}
               <div className="grid grid-cols-3 gap-3">
                  {tempVariant.previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                       <img src={url} className="w-full h-full object-cover" alt="p" />
                       <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white p-1 rounded-full text-rose-500 shadow-md opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
                    </div>
                  ))}
               </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
               <div className="grid grid-cols-2 gap-5">
                  <input type="text" value={tempVariant.sku} onChange={(e) => setTempVariant({...tempVariant, sku: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="SKU Code" />
                  <input type="text" value={tempVariant.barcode} onChange={(e) => setTempVariant({...tempVariant, barcode: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="Barcode" />
               </div>
               <div className="grid grid-cols-3 gap-5">
                  <input type="number" value={tempVariant.mrp} onChange={(e) => setTempVariant({...tempVariant, mrp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="MRP ₹" />
                  <input type="number" value={tempVariant.weight} onChange={(e) => setTempVariant({...tempVariant, weight: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="Weight" />
                  <select value={tempVariant.unit} onChange={(e) => setTempVariant({...tempVariant, unit: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none">
                       <option value="kg">KG</option><option value="gm">GM</option><option value="ml">ML</option><option value="ltr">LTR</option><option value="pcs">PCS</option>
                  </select>
               </div>
               <input type="text" value={tempVariant.size} onChange={(e) => setTempVariant({...tempVariant, size: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="Size / Label (e.g. 1 Liter)" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 p-4 font-sans text-black">
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-black">
          <ArrowLeft size={16} /> Exit
        </button>
        <button onClick={handlePublish} disabled={loading} className="bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#7e2827] disabled:opacity-50 transition-all">
          {loading ? "Processing..." : "Publish Product & Inventory"}
        </button>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 space-y-12">
        <section className="space-y-8">
           <h3 className="text-sm font-black text-black uppercase tracking-widest border-l-4 border-[#7e2827] pl-4">Product Info</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input type="text" value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="Product Name" />
              <input type="text" value={productData.brand} onChange={(e) => setProductData({...productData, brand: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="Brand Name" />

              <div className="relative" ref={dropdownRef}>
                <input type="text" placeholder={productData.categoryName || "Search Category..."} className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-black outline-none ${productData.categoryId ? 'border-emerald-200 bg-emerald-50/20' : 'border-transparent'}`} value={catSearch} onFocus={() => setShowCatDropdown(true)} onChange={(e) => setCatSearch(e.target.value)} />
                {showCatDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                    {catResults.map(c => <div key={c._id} className="p-4 text-sm font-bold text-black hover:bg-slate-50 cursor-pointer border-b last:border-0" onClick={() => { setProductData({...productData, categoryId: c._id, categoryName: c.name}); setShowCatDropdown(false); }}>{c.name}</div>)}
                  </div>
                )}
              </div>
              <input type="text" value={productData.tags} onChange={(e) => setProductData({...productData, tags: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none" placeholder="Tags (Comma separated)" />
           </div>
        </section>

        <section className="pt-10 border-t border-slate-100 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-black uppercase tracking-widest border-l-4 border-[#7e2827] pl-4">Inventory Variants</h3>
              <button onClick={() => openVariantForm()} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all"><Plus size={16}/> Add Size</button>
           </div>
           <div className="overflow-x-auto border border-slate-100 rounded-[2rem]">
              <table className="w-full text-left text-black">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Preview</th><th className="px-6 py-4">SKU</th><th className="px-6 py-4 text-center">MRP (₹)</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-6 py-4"><div className="h-12 w-12 rounded-xl bg-white border border-slate-200 overflow-hidden">{v.previewUrls?.length > 0 ? <img src={v.previewUrls[0]} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto h-full text-slate-200"/>}</div></td>
                      <td className="px-6 py-5 font-black text-xs">{v.sku}</td>
                      <td className="px-6 py-5 text-center font-black text-emerald-700 text-xs">₹{v.mrp}</td>
                      <td className="px-6 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => openVariantForm(idx)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl"><Edit3 size={18}/></button><button onClick={() => setVariants(variants.filter((_, i) => i !== idx))} className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl"><Trash2 size={18}/></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </section>
      </div>
    </div>
  );
};

export default ProductForm;
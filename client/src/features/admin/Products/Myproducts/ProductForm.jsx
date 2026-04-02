import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Search, UploadCloud, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

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
  const { id } = useParams(); // URL ID for Edit mode
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

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

  // --- NEW: FETCH DATA FOR EDIT MODE ---
  useEffect(() => {
    if (id) {
      const fetchProductData = async () => {
        try {
          setFetching(true);
          const res = await API.get(`/products/product-variant/${id}`);
          const { product, variants: fetchedVariants } = res.data.data;

          setProductData({
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId?._id,
            categoryName: product.categoryId?.name,
            description: product.description,
            tags: product.tags?.join(', '),
            isActive: product.isActive
          });

          // Map variants and handle existing images
          const mappedVariants = fetchedVariants.map(v => ({
            ...v,
            // Images coming from DB are objects with .url
            // We store them in previewUrls for display
            previewUrls: v.images.map(img => img.url),
            // Existing images aren't File objects yet, we keep them to know what to retain
            existingImages: v.images.map(img => img.url),
            images: [] // New files to be uploaded
          }));

          setVariants(mappedVariants);
        } catch (err) {
          toast.error("Failed to fetch product data");
          navigate(-1);
        } finally {
          setFetching(false);
        }
      };
      fetchProductData();
    }
  }, [id, navigate]);

  useEffect(() => {
    const handleOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCatDropdown(false); };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await API.get(`/categories/search?q=${debouncedCatSearch}`);
        setCatResults(data.data || []);
      } catch (err) { console.error(err); }
    };
    if (showCatDropdown) fetchCats();
  }, [debouncedCatSearch, showCatDropdown]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (tempVariant.previewUrls.length + files.length > 6) return toast.warning("Max 6 images allowed");
    const urls = files.map(f => URL.createObjectURL(f));
    setTempVariant(p => ({ 
        ...p, 
        images: [...p.images, ...files], 
        previewUrls: [...p.previewUrls, ...urls] 
    }));
  };

  const removeImage = (idx) => {
    setTempVariant(p => {
        const newPreviews = p.previewUrls.filter((_, i) => i !== idx);
        // Logic to remove from correct array (new file vs existing)
        const newImages = p.images.filter((_, i) => (i + (p.existingImages?.length || 0)) !== idx);
        const newExisting = p.existingImages?.filter((_, i) => i !== idx);
        
        return { ...p, previewUrls: newPreviews, images: newImages, existingImages: newExisting };
    });
  };

  const openVariantForm = (idx = null) => {
    if (idx !== null) { setEditingIndex(idx); setTempVariant({ ...variants[idx] }); }
    else { setEditingIndex(null); setTempVariant({ sku: "", barcode: "", mrp: "", size: "", unit: "kg", weight: "", images: [], previewUrls: [], existingImages: [] }); }
    setShowVariantForm(true);
  };

  const saveVariant = () => {
    const updated = [...variants];
    if (editingIndex !== null) updated[editingIndex] = tempVariant;
    else updated.push({ ...tempVariant });
    setVariants(updated);
    setShowVariantForm(false);
  };

  const handlePublish = async () => {
    if (!productData.name || !productData.categoryId || variants.length === 0) {
      return toast.warning("Complete info and add at least one variant");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('brand', productData.brand);
      formData.append('categoryId', productData.categoryId);
      formData.append('description', productData.description);
      formData.append('tags', productData.tags);

      const variantsMetadata = variants.map((v) => ({
        _id: v._id, // Send ID if existing
        sku: v.sku, barcode: v.barcode, mrp: v.mrp, 
        size: v.size, unit: v.unit, weight: v.weight,
        imageCount: v.images.length,
        existingImages: v.existingImages || [] // Tell backend which old images to keep
      }));
      formData.append('variantsMetadata', JSON.stringify(variantsMetadata));

      variants.forEach((v, vIdx) => {
        v.images.forEach((imgFile) => {
          formData.append(`variant_images_${vIdx}`, imgFile);
        });
      });

      if (id) {
        await API.put(`/products/${id}`, formData);
        toast.success("Product Updated!");
      } else {
        await API.post('/products', formData);
        toast.success("Product Created!");
      }
      navigate('/admin/my-products');
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="p-20 text-center font-black uppercase text-xs animate-pulse">Fetching Product Details...</div>;

  if (showVariantForm) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in slide-in-from-bottom-4 duration-300">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowVariantForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20}/></button>
              <h2 className="text-lg font-black uppercase tracking-tight">{editingIndex !== null ? 'Modify Variant' : 'New Variant'}</h2>
            </div>
            <button onClick={saveVariant} className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-[#7e2827] transition-all">
              <Check size={18}/> Save Variant
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
                <label className="text-[10px] font-black uppercase tracking-widest block text-slate-400">Variant Media</label>
                {tempVariant.previewUrls.length < 6 && (
                  <div className="relative aspect-video rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all group">
                     <UploadCloud size={40} className="text-slate-300 group-hover:text-black transition-colors" />
                     <span className="text-[10px] font-black text-slate-400 mt-2 uppercase">Upload Image</span>
                     <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                   {tempVariant.previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/90 p-1.5 rounded-full text-rose-500 shadow-md opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
                    </div>
                   ))}
                </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">SKU Code</label>
                     <input type="text" value={tempVariant.sku} onChange={(e) => setTempVariant({...tempVariant, sku: e.target.value})} className="w-full p-4 bg-slate-50 border border-transparent focus:border-slate-200 rounded-2xl text-sm font-bold outline-none transition-all" placeholder="Enter SKU" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Barcode</label>
                     <input type="text" value={tempVariant.barcode} onChange={(e) => setTempVariant({...tempVariant, barcode: e.target.value})} className="w-full p-4 bg-slate-50 border border-transparent focus:border-slate-200 rounded-2xl text-sm font-bold outline-none transition-all" placeholder="Enter Barcode" />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-5">
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">MRP (₹)</label>
                     <input type="number" value={tempVariant.mrp} onChange={(e) => setTempVariant({...tempVariant, mrp: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" placeholder="0.00" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Weight</label>
                     <input type="number" value={tempVariant.weight} onChange={(e) => setTempVariant({...tempVariant, weight: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Unit</label>
                     <select value={tempVariant.unit} onChange={(e) => setTempVariant({...tempVariant, unit: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none appearance-none">
                        <option value="kg">KG</option><option value="gm">GM</option><option value="ml">ML</option><option value="ltr">LTR</option><option value="pcs">PCS</option>
                     </select>
                   </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Display Size Label</label>
                  <input type="text" value={tempVariant.size} onChange={(e) => setTempVariant({...tempVariant, size: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. 500gm Pack or 1 Litre Bottle" />
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 p-4 font-sans text-black animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-black transition-colors">
          <ArrowLeft size={16} /> Discard Changes
        </button>
        <button onClick={handlePublish} disabled={loading} className="bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#7e2827] disabled:opacity-50 transition-all flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
          {id ? "Update Product" : "Publish Product"}
        </button>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 space-y-12 shadow-sm">
        <section className="space-y-8">
           <h3 className="text-sm font-black text-black uppercase tracking-widest border-l-4 border-[#7e2827] pl-4">Core Identification</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Product Name</label>
                <input type="text" value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none border border-transparent focus:border-slate-100" placeholder="e.g. Organic Sunflower Oil" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Brand</label>
                <input type="text" value={productData.brand} onChange={(e) => setProductData({...productData, brand: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none border border-transparent focus:border-slate-100" placeholder="e.g. Fortune" />
              </div>

              <div className="relative space-y-1" ref={dropdownRef}>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Category Assignment</label>
                <input type="text" placeholder={productData.categoryName || "Search Category..."} className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold text-black outline-none transition-all ${productData.categoryId ? 'border-emerald-200 bg-emerald-50/10' : 'border-transparent'}`} value={catSearch} onFocus={() => setShowCatDropdown(true)} onChange={(e) => setCatSearch(e.target.value)} />
                {showCatDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-2">
                    {catResults.map(c => <div key={c._id} className="p-3 text-xs font-bold text-black hover:bg-slate-50 rounded-xl cursor-pointer transition-colors" onClick={() => { setProductData({...productData, categoryId: c._id, categoryName: c.name}); setShowCatDropdown(false); setCatSearch(""); }}>{c.name}</div>)}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Search Tags</label>
                <input type="text" value={productData.tags} onChange={(e) => setProductData({...productData, tags: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold text-black outline-none border border-transparent focus:border-slate-100" placeholder="grocery, oil, healthy" />
              </div>
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Product Description</label>
              <textarea rows="3" value={productData.description} onChange={(e) => setProductData({...productData, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none resize-none" placeholder="Describe your product..."></textarea>
           </div>
        </section>

        <section className="pt-10 border-t border-slate-100 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-black uppercase tracking-widest border-l-4 border-[#7e2827] pl-4">Inventory & Variants</h3>
              <button onClick={() => openVariantForm()} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#7e2827] transition-all flex items-center gap-2"><Plus size={16}/> Add Size</button>
           </div>
           <div className="overflow-x-auto border border-slate-100 rounded-[2rem]">
              <table className="w-full text-left text-black">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Preview</th><th className="px-6 py-4">SKU</th><th className="px-6 py-4 text-center">MRP (₹)</th><th className="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                            {v.previewUrls?.length > 0 ? (
                                <img src={v.previewUrls[0]} className="w-full h-full object-cover" alt="" />
                            ) : <ImageIcon className="text-slate-200" size={18}/>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-xs text-black">{v.sku}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{v.size || 'Base'}</p>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-emerald-700 text-xs">₹{v.mrp}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openVariantForm(idx)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"><Edit3 size={18}/></button>
                            <button onClick={() => setVariants(variants.filter((_, i) => i !== idx))} className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
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
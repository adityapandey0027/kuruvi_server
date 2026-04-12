import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Save, Loader2, Power, PowerOff, X, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const BrandBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchBrandBanners = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/banners/brand/all');
      setBanners(data.data || []);
    } catch (err) {
      toast.error("Failed to load brand banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandBanners();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return toast.error("Please select an image");

    setUploading(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      await API.post('/banners/brand', formData);
      toast.success("Brand banner uploaded!");
      setImageFile(null);
      setPreview(null);
      setIsAdding(false);
      fetchBrandBanners();
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this brand banner?")) {
      try {
        await API.delete(`/banners/brand/${id}`); 
        setBanners(prev => prev.filter(b => b._id !== id));
        toast.success("Deleted successfully");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await API.patch(`/banners/brand/status/${id}`);
      fetchBrandBanners();
      toast.success("Status updated");
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Brand Partners</h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Detailed Partner Management</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${isAdding ? 'bg-black text-white' : 'bg-[#7e2827] text-white'}`}
        >
          {isAdding ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add Brand Image</>}
        </button>
      </div>

      {/* Conditional Rendering: Upload Form vs List Table */}
      {isAdding ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white rounded-full border border-slate-200">
              <ChevronLeft size={20} className="text-black"/>
            </button>
            <h3 className="text-sm font-black text-black uppercase tracking-widest">Upload Brand Partner Image</h3>
          </div>

          <form onSubmit={handleUpload} className="p-10 space-y-8">
            <div className="max-w-md mx-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Brand Visual (Logo or Banner)</label>
                <div className="relative group border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 hover:bg-slate-100/50 transition-all text-center h-64 flex flex-col items-center justify-center">
                  {preview ? (
                    <img src={preview} className="max-h-full max-w-full object-contain rounded-2xl p-2" alt="Preview" />
                  ) : (
                    <div className="py-12 flex flex-col items-center gap-2">
                      <ImageIcon size={40} className="text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click to select image</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full mt-8 py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex justify-center gap-3 disabled:bg-slate-300"
              >
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Upload Partner</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Brand Image</th>
                <th className="px-6 py-4">Identification</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto text-[#7e2827]" size={32} />
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No brand partners found
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-16 w-32 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                        <img 
                          src={banner.image.url || banner.image} 
                          alt="Brand" 
                          className="max-h-full max-w-full object-contain" 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Entry ID</span>
                        <code className="text-xs font-bold text-black bg-slate-100 px-2 py-1 rounded-md w-fit">
                          {banner._id}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(banner._id)}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${
                          banner.isActive 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {banner.isActive ? <><Power size={12}/> Live</> : <><PowerOff size={12}/> Hidden</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(banner._id)}
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BrandBanner;
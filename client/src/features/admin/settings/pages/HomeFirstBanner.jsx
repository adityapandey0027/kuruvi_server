import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronLeft, Save, Loader2, Power, PowerOff } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const HomeFirstBanner = () => {
  const [view, setView] = useState('list'); // 'list', 'add', or 'edit'
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/banners/home/all');
      setBanners(data.data || []);
    } catch (err) {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await API.delete(`/banners/${id}`);
        setBanners(prev => prev.filter(b => b._id !== id));
        toast.success("Banner deleted!");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await API.patch(`/banners/${id}/status`);
      fetchBanners();
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans">
      {view === 'list' && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">Home Banners</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hero Section Management</p>
            </div>
            <button
              onClick={() => { setSelectedBanner(null); setView('add'); }}
              className="flex items-center gap-2 bg-[#7e2827] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all"
            >
              <Plus size={16} /> Add New Banner
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Preview</th>
                  <th className="px-6 py-4">Title / Info</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#7e2827]"/></td></tr>
                ) : banners.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-10 text-slate-400 font-bold">No Banners Found</td></tr>
                ) : banners.map((banner) => (
                  <tr key={banner._id} className="hover:bg-slate-50/50 group">
                    <td className="px-6 py-4">
                      <div className="h-20 w-40 rounded-xl bg-slate-100 border overflow-hidden">
                        <img src={banner.image.url || banner.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black uppercase text-sm text-black">{banner.title || "Untitled Banner"}</p>
                      <p className="text-[10px] text-slate-400 font-bold">ID: {banner._id}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(banner._id)}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 mx-auto transition-colors ${banner.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {banner.isActive ? <><Power size={12}/> Active</> : <><PowerOff size={12}/> Inactive</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedBanner(banner); setView('edit'); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(banner._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(view === 'add' || view === 'edit') && (
        <BannerForm
          type={view}
          data={selectedBanner}
          onBack={() => setView('list')}
          refresh={fetchBanners}
        />
      )}
    </div>
  );
};

const BannerForm = ({ type, data, onBack, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(data?.title || "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(data?.image?.url || data?.image || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    if (imageFile) formData.append('image', imageFile);

    try {
      if (type === 'add') {
        await API.post('/banners/add', formData);
        toast.success("Banner Created!");
      } else {
        await API.put(`/banners/${data._id}`, formData);
        toast.success("Banner Updated!");
      }
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white rounded-full border border-slate-200 transition-all">
          <ChevronLeft size={20} className="text-black"/>
        </button>
        <h3 className="text-sm font-black text-black uppercase tracking-widest">{type === 'add' ? 'Create New' : 'Edit'} Banner</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Banner Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Banner Title / Caption</label>
            <input 
              type="text" 
              placeholder="Enter banner heading..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:border-[#7e2827]" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Banner Image (Recommended 1920x800)</label>
            <div className="relative group border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50 hover:bg-slate-100/50 transition-all text-center">
              {preview ? (
                <div className="relative inline-block w-full">
                  <img src={preview} className="max-h-64 w-full object-cover rounded-2xl shadow-md" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <p className="text-white text-xs font-bold uppercase tracking-widest">Change Image</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center gap-2">
                  <ImageIcon size={40} className="text-slate-300" />
                  <p className="text-xs font-bold text-slate-400">Click to upload banner image</p>
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
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex justify-center gap-3 disabled:bg-slate-400"
        >
          {loading ? "Processing..." : <><Save size={18}/> {type === 'add' ? 'Publish Banner' : 'Update Banner'}</>}
        </button>
      </form>
    </div>
  );
};

export default HomeFirstBanner;
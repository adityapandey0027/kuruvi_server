import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, ChevronLeft, Save, X, Check, LayoutGrid } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
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

const Category = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Debouncing the main list search term
  const debouncedMainSearch = useDebounce(searchTerm, 500);

  // Fetch Categories logic
  const fetchCategories = async (query = "") => {
    try {
      setLoading(true);
      // Agar search box mein kuch hai to /search use karo, varna /parent
      const endpoint = query ? `/categories/search?q=${query}` : `/categories/parent`;
      const { data } = await API.get(endpoint);
      
      // Backend response structure data.data ke hisaab se handle kiya
      setCategories(data.data || []);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // Initial load and Search load
  useEffect(() => {
    fetchCategories(debouncedMainSearch);
  }, [debouncedMainSearch]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This might delete child categories too.")) {
      try {
        await API.delete(`/categories/${id}`);
        setCategories(categories.filter(c => c._id !== id));
        toast.success("Deleted!");
      } catch (err) { toast.error("Delete failed"); }
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans">
      {view === 'list' && (
        <>
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">Product Categories</h2>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Hierarchy & Structure</p>
            </div>
            <button
              onClick={() => { setSelectedCategory(null); setView('add'); }}
              className="flex items-center gap-2 bg-[#7e2827] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all"
            >
              <Plus size={16} /> Add New Category
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search categories (Server-side)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#7e2827]/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4 text-center">Hierarchy Type</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Searching categories...</td></tr>
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                          {cat.image ? <img src={cat.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} className="text-slate-200" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => navigate(`/admin/category/sub/${cat._id}`)}
                          className="font-black text-black uppercase text-sm tracking-tight hover:text-[#7e2827] transition-all text-left"
                        >
                          {cat.name}
                        </button>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">CLICK TO VIEW CHILD ITEMS</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${cat.parentId ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                          {cat.parentId ? 'Sub-Category' : 'Main Category'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/admin/category/sub/${cat._id}`)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Subcategories"><LayoutGrid size={18} /></button>
                          <button onClick={() => { setSelectedCategory(cat); setView('edit'); }} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Edit Category"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(cat._id)} className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Category"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-20 font-bold text-slate-300 uppercase text-[10px] tracking-widest">No matching categories found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(view === 'add' || view === 'edit') && (
        <CategoryForm
          type={view}
          data={selectedCategory}
          onBack={() => setView('list')}
          refresh={() => fetchCategories(searchTerm)}
        />
      )}
    </div>
  );
};

// --- Form Component (Self-contained Search logic for Parents) ---
const CategoryForm = ({ type, data, onBack, refresh }) => {
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: data?.name || "",
    parentId: data?.parentId?._id || data?.parentId || "",
    parentName: data?.parentId?.name || "",
    isActive: data?.isActive ?? true,
  });

  const [parentSearch, setParentSearch] = useState("");
  const [parentResults, setParentResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedParentSearch = useDebounce(parentSearch, 400);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(data?.image || null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchParentSearch = async () => {
      try {
        const { data: res } = await API.get(`/categories/search?q=${debouncedParentSearch}`);
        setParentResults(res.data || []);
      } catch (err) { console.error("Parent search error", err); }
    };
    if (showDropdown) fetchParentSearch();
  }, [debouncedParentSearch, showDropdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      if (formData.parentId) form.append('parentId', formData.parentId);
      form.append('isActive', formData.isActive);
      if (imageFile) form.append('image', imageFile);

      if (type === 'add') {
        await API.post('/categories', form);
        toast.success("Category Created Successfully!");
      } else {
        await API.put(`/categories/${data._id}`, form);
        toast.success("Category Updated Successfully!");
      }
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    } finally { setLoading(false); }
  };
 
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
        <button type="button" onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all border border-slate-200"><ChevronLeft size={20} className="text-black"/></button>
        <h3 className="text-sm font-black text-black uppercase tracking-widest">{type === 'add' ? 'Add New' : 'Edit'} Category</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
            <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:border-[#7e2827]" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Masala & Oil" />
          </div>

          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parent Category (Link to Main)</label>
            <div className="relative">
              <input
                type="text"
                placeholder={formData.parentName || "Search Main Category..."}
                className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none ${formData.parentId ? 'border-emerald-500 bg-emerald-50/30' : ''}`}
                value={parentSearch}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => setParentSearch(e.target.value)}
              />
              {formData.parentId && <button type="button" onClick={() => { setFormData({...formData, parentId: "", parentName: ""}); setParentSearch(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"><X size={16} /></button>}
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                <div className="p-4 text-[10px] font-black text-[#7e2827] border-b border-slate-50 cursor-pointer hover:bg-slate-50" onClick={() => { setFormData({ ...formData, parentId: "", parentName: "" }); setShowDropdown(false); }}>
                  <Check size={14} className="inline mr-2"/> NONE (SET AS MAIN CATEGORY)
                </div>
                {parentResults.map((cat) => (
                  <div key={cat._id} className="p-4 text-sm font-bold text-black hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0" onClick={() => { setFormData({ ...formData, parentId: cat._id, parentName: cat.name }); setShowDropdown(false); setParentSearch(""); }}>
                    {cat.name} <Plus size={14} className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Image</label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setImageFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0])); } }} className="text-[10px] font-bold text-black" />
              {preview && <img src={preview} className="h-14 w-14 rounded-xl object-cover border-2 border-white shadow-md" alt="" />}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex justify-center gap-3">
          {loading ? "Saving..." : <><Save size={18}/> Update & Save Details</>}
        </button>
      </form>
    </div>
  );
};

export default Category;
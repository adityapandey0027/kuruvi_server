import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, ChevronLeft, Save, X, Check, LayoutGrid, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import API from "../../../../api/axios";

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
  const location = useLocation();
  const [view, setView] = useState('list');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Unified Pagination State
  const [pagination, setPagination] = useState({ 
    page: 1, 
    pages: 1, 
    total: 0, 
    limit: 10 
  });

  const debouncedMainSearch = useDebounce(searchTerm, 500);

  // 2. Fetch Logic supporting both search and pagination
  const fetchCategories = async (query = "", page = 1) => {
    try {
      setLoading(true);
      // Use the 'all' endpoint for standard paginated listing
      const endpoint = `/categories/all?q=${query}&page=${page}&limit=${pagination.limit}`;
      const { data: res } = await API.get(endpoint);
      
      setCategories(res.data || []);
      
      // Update pagination info from backend response
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset to Page 1 when search term changes
  useEffect(() => {
    fetchCategories(debouncedMainSearch, 1);
  }, [debouncedMainSearch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCategories(searchTerm, newPage);
    }
  };

  // Keep existing edit/delete logic...
  useEffect(() => {
    if (location.state?.editCategory) {
      setSelectedCategory(location.state.editCategory);
      setView('edit');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await API.delete(`/categories/${id}`);
        // Refresh current page after deletion
        fetchCategories(searchTerm, pagination.page);
        toast.success("Deleted successfully!");
      } catch (err) { 
        toast.error("Delete failed"); 
      }
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans">
      {view === 'list' && (
        <>
          {/* Header Section (Unchanged) */}
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
            {/* Search Section (Unchanged) */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-[#7e2827]/10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <table className="w-full text-left">
              {/* Existing Table Content... */}
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4 text-center">Type</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#7e2827]"/></td></tr>
                ) : categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50 group">
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 border overflow-hidden">
                        {cat.image ? <img src={cat.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} className="m-auto text-slate-200" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/admin/category/sub/${cat._id}`)} 
                        className="font-black uppercase text-sm hover:text-[#7e2827] text-left"
                      >
                        {cat.name}
                        {cat.parentName && <p className="text-[9px] text-slate-400 normal-case">Parent: {cat.parentName}</p>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${cat.parentId ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {cat.parentId ? 'Sub' : 'Main'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedCategory(cat); setView('edit'); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(cat._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Integrated Pagination UI */}
            {!loading && categories.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Showing Page {pagination.page} of {pagination.pages} 
                  <span className="ml-2 text-black/40">({pagination.total} Total)</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-1">
                    {[...Array(pagination.pages)].map((_, i) => {
                      const pageNum = i + 1;
                      const isVisible = 
                        pageNum === 1 || 
                        pageNum === pagination.pages || 
                        Math.abs(pageNum - pagination.page) <= 1;

                      if (!isVisible) {
                        if (pageNum === 2 || pageNum === pagination.pages - 1) {
                          return <span key={pageNum} className="px-1 text-slate-400 font-bold">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-10 w-10 rounded-xl text-[11px] font-black transition-all ${
                            pagination.page === pageNum 
                            ? 'bg-[#7e2827] text-white shadow-lg shadow-red-900/20' 
                            : 'bg-white border border-slate-200 text-black hover:bg-slate-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ChevronLeft size={18} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {(view === 'add' || view === 'edit') && (
        <CategoryForm
          type={view}
          data={selectedCategory}
          onBack={() => setView('list')}
          // Refresh current page after editing
          refresh={() => fetchCategories(searchTerm, pagination.page)}
        />
      )}
    </div>
  );
};

const CategoryForm = ({ type, data, onBack, refresh }) => {
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  console.log(data)
  const [formData, setFormData] = useState({
    name: data?.name || "",
    parentId: data?.parentId || "",
    parentName: data?.parentName || "",
    isActive: data?.isActive ?? true,
  });

  const [parentSearch, setParentSearch] = useState(data?.parentName || "");
  const [parentResults, setParentResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedParentSearch = useDebounce(parentSearch, 400);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(data?.image || null);

  // FIXED: Synchronization logic to fetch and "Auto-Select" the parent
  useEffect(() => {
    const initializeEdit = async () => {
      if (data && type === 'edit') {
        const pId = data.parentId || "";
        const pName = data.parentName || "";

        setFormData({
          name: data.name || "",
          parentId: pId,
          parentName: pName,
          isActive: data.isActive ?? true,
        });

        setParentSearch(pName);
        setPreview(data.image || null);

        // AUTO-SELECT LOGIC: If parentId exists, fetch its details to populate results
        if (pId) {
          try {
            // Making API call to get specific parent details
            const res = await API.get(`/categories/search?parentId=${pId}`);
            
            // If backend returns an array in data.data or an object, adapt accordingly
            const fetchedParent = res.data.data;
            
            if (fetchedParent) {
              // We put the fetched parent into results so the UI has the object to refer to
              setParentResults(Array.isArray(fetchedParent) ? fetchedParent : [fetchedParent]);
            }
          } catch (err) {
            console.error("Error auto-fetching parent details", err);
          }
        }
      }
    };

    initializeEdit();
  }, [data, type]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic: Only fire if user changes the pre-filled text
  useEffect(() => {
    const fetchParentSearch = async () => {
      // Don't search if box is empty OR matches the already selected parentName
      if (!parentSearch.trim() || parentSearch === formData.parentName) return;

      try {
        console.log("Searching for:", debouncedParentSearch);
        const { data: res } = await API.get(`/categories/search?q=${debouncedParentSearch}`);
        setParentResults(res.data || []);
      } catch (err) {
        console.error("Parent search error", err);
      }
    };

    if (showDropdown && parentSearch) fetchParentSearch();
  }, [debouncedParentSearch, showDropdown, formData.parentName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('parentId', formData.parentId || '');
      form.append('isActive', formData.isActive);
      if (imageFile) form.append('image', imageFile);

      if (type === 'add') {
        await API.post('/categories', form);
        toast.success("Created Successfully!");
      } else {
        await API.put(`/categories/${data._id}`, form);
        toast.success("Updated Successfully!");
      }
      refresh();
      onBack();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
        <button type="button" onClick={onBack} className="p-2 hover:bg-white rounded-full border border-slate-200 transition-all">
          <ChevronLeft size={20} className="text-black"/>
        </button>
        <h3 className="text-sm font-black text-black uppercase tracking-widest">{type === 'add' ? 'Add New' : 'Edit'} Category</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
            <input 
              required 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:border-[#7e2827]" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>

          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parent Category</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Parent Category..."
                className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none ${formData.parentId ? 'border-emerald-500 bg-emerald-50/30' : ''}`}
                value={parentSearch}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => setParentSearch(e.target.value)}
              />
              
              {formData.parentId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setFormData({...formData, parentId: "", parentName: ""}); 
                    setParentSearch("");
                  }} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                <div 
                  className="p-4 text-[10px] font-black text-[#7e2827] border-b cursor-pointer hover:bg-slate-50" 
                  onClick={() => { 
                    setFormData({ ...formData, parentId: "", parentName: "" }); 
                    setParentSearch(""); 
                    setShowDropdown(false); 
                  }}
                >
                  <Check size={14} className="inline mr-2"/> NONE (MAIN CATEGORY)
                </div>
                {parentResults.map((cat) => (
                  <div 
                    key={cat._id} 
                    className="p-4 text-sm font-bold text-black hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b" 
                    onClick={() => { 
                      setFormData({ ...formData, parentId: cat._id, parentName: cat.name }); 
                      setParentSearch(cat.name); 
                      setShowDropdown(false); 
                    }}
                  >
                    {cat.name} <Plus size={14} className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Image</label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setImageFile(e.target.files[0]); setPreview(URL.createObjectURL(e.target.files[0])); } }} />
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
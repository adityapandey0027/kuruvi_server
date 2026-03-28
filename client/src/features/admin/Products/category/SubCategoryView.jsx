import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Edit, ImageIcon, Search, LayoutGrid } from 'lucide-react';
import { toast } from 'react-toastify';
import API from "../../../../api/axios";

const SubCategoryView = () => {
  const { parentId } = useParams();
  const navigate = useNavigate();
  
  const [subCategories, setSubCategories] = useState([]);
  const [parentName, setParentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      // Backend endpoint: /categories/search?parentId=ID ya fir direct filter
      const { data } = await API.get(`/categories/${parentId}/subcategories`);
      console.log(data)
      setSubCategories(data.data.subCategories);
      
      // Parent ka naam nikalne ke liye (Optional: Agar backend data mein parent info hai)
      if (data.length > 0 && data[0].parentId?.name) {
        setParentName(data[0].parentId.name);
      }
    } catch (err) {
      toast.error("Failed to load sub-categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, [parentId]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this sub-category?")) {
      try {
        await API.delete(`/categories/${id}`);
        setSubCategories(subCategories.filter(c => c._id !== id));
        toast.success("Deleted!");
      } catch (err) { toast.error("Failed to delete"); }
    }
  };

  return (
    <div className="space-y-6 p-4 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <ChevronLeft size={24} className="text-black" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">
              {parentName || "Sub Categories"}
            </h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Showing child items for this category
            </p>
          </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search sub-categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-black outline-none focus:ring-2 focus:ring-[#7e2827]/10"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Items: {subCategories.length}
          </div>
        </div>

        {/* List View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {subCategories
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((sub) => (
              <div key={sub._id} className="group bg-slate-50 border border-slate-200 rounded-[2rem] p-5 hover:bg-white hover:shadow-xl hover:border-[#7e2827]/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm">
                    {sub.image ? (
                      <img src={sub.image} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <LayoutGrid className="m-auto h-full text-slate-200" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-black uppercase text-sm tracking-tight">{sub.name}</h4>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase mt-1">Status: Active</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => navigate(`/admin/category`, { state: { editCategory: sub } })}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(sub._id)}
                      className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {subCategories.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
               <ImageIcon size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Sub-categories found for this section</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCategoryView;
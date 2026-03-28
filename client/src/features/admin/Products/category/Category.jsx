import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2, Search, Image as ImageIcon, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const Category = () => {
  const [view, setView] = useState('list'); // list, add, edit, view
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dummy Data for Darkstores (Warehouse list from your PHP)
  const darkstores = [
    { id: 1, name: 'Bhopal Main' },
    { id: 2, name: 'Indore Warehouse' },
    { id: 3, name: 'Jabalpur Store' }
  ];

  const [categories, setCategories] = useState([
    { id: 1, name: 'PlayZone', banner: 'play.png', darkstoreStatus: { 1: true, 2: false, 3: true } },
    { id: 2, name: 'Baby Care', banner: 'baby.png', darkstoreStatus: { 1: true, 2: true, 3: true } },
  ]);

  // Handle Delete (PHP deleteuser logic)
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      setCategories(categories.filter(c => c.id !== id));
      toast.error("Category deleted successfully");
    }
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <>
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Product Categories</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage Store-wise Categories</p>
            </div>
            <button 
              onClick={() => setView('add')}
              className="flex items-center gap-2 bg-[#7e2827] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-900/20 hover:scale-105 transition-all"
            >
              <Plus size={16} /> Add New
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search by name..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#7e2827]/10"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-center">#</th>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                         <ImageIcon size={20} className="text-slate-300" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{cat.name}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedCategory(cat); setView('view'); }} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"><Eye size={18}/></button>
                        <button onClick={() => { setSelectedCategory(cat); setView('edit'); }} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"><Edit size={18}/></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18}/></button>
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
        <CategoryForm 
          type={view} 
          data={selectedCategory} 
          darkstores={darkstores} 
          onBack={() => setView('list')} 
        />
      )}

      {view === 'view' && (
        <CategoryView 
          data={selectedCategory} 
          onBack={() => setView('list')} 
        />
      )}
    </div>
  );
};

// --- Form Component (Create/Edit Logic) ---
const CategoryForm = ({ type, data, darkstores, onBack }) => {
  const [formData, setFormData] = useState({
    name: data?.name || "",
    status: data?.darkstoreStatus || {}
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const toggleStatus = (id) => {
    setFormData(prev => ({
      ...prev,
      status: { ...prev.status, [id]: !prev.status[id] }
    }));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{type === 'add' ? 'Add' : 'Edit'} Category</h3>
        <button onClick={onBack} className="text-xs font-bold text-slate-400 hover:text-slate-800">Cancel</button>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-[#7e2827]/5 focus:border-[#7e2827]/20"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^A-Za-z\s]/g, '')})}
              placeholder="Enter category name"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Banner</label>
            <div className="flex items-center gap-4">
                <input type="file" onChange={handleImageChange} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-red-50 file:text-[#7e2827] hover:file:bg-red-100 cursor-pointer" />
                {imagePreview && <img src={imagePreview} className="h-12 w-12 rounded-xl border object-cover" alt="preview" />}
            </div>
          </div>
        </div>

        {/* Darkstore Status Table (Your PHP Logic) */}
        <div className="space-y-4 pt-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Darkstore Visibility</label>
           <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-6 py-3">Darkstore Name</th>
                       <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {darkstores.map(ds => (
                       <tr key={ds.id}>
                          <td className="px-6 py-4 font-bold text-slate-600">{ds.name}</td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => toggleStatus(ds.id)}
                                className={`h-6 w-12 rounded-full transition-all relative ${formData.status[ds.id] ? 'bg-emerald-500' : 'bg-slate-200'}`}
                             >
                                <div className={`absolute top-1 bg-white h-4 w-4 rounded-full transition-all ${formData.status[ds.id] ? 'right-1' : 'left-1'}`}></div>
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onBack} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Back to list</button>
          <button className="flex-1 py-4 bg-[#7e2827] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20">Save Category</button>
        </div>
      </div>
    </div>
  );
};

// --- View Component ---
const CategoryView = ({ data, onBack }) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-6">
            <div className="h-32 w-32 bg-slate-50 rounded-3xl border-4 border-white shadow-xl flex items-center justify-center">
                <ImageIcon size={40} className="text-slate-200" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{data.name}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Active in {Object.values(data.darkstoreStatus).filter(v => v).length} Stores
                </p>
            </div>
        </div>
        <button onClick={onBack} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Close View</button>
    </div>
);

export default Category;
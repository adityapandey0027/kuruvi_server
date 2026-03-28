import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Eye, Search, LayoutGrid } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ProductList = () => {
  const navigate = useNavigate();

  // Dummy Data for Table
  const [products, setProducts] = useState([
    { id: 1, name: 'VVD hair oil 100 ml', category: 'Accessories', thumbnail: '' },
    { id: 2, name: 'FIVE STAR 9.8g', category: 'Special Deals', thumbnail: '' },
    { id: 3, name: 'LAYS Magic Masala 12.3g', category: 'Snacks', thumbnail: '' },
  ]);

  // Delete Action
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#7e2827] p-3 rounded-2xl text-white shadow-lg shadow-red-900/20">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">My Products</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
        </div>
        
        {/* Correct Link based on your new Router Path */}
        <Link 
          to="/admin/my-products/create" 
          className="bg-[#128741] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      {/* 2. Filter & Table Card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center p-6 gap-4 bg-slate-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase">Show</span>
            <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer">
              <option>10</option>
              <option>25</option>
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none w-72 focus:ring-4 focus:ring-[#7e2827]/5 transition-all" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">#</th>
                <th className="px-6 py-5">Image</th>
                <th className="px-6 py-5">Name</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((pro, index) => (
                <tr key={pro.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5 text-xs font-black text-slate-400">{index + 1}</td>
                  <td className="px-6 py-5">
                    <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                       <LayoutGrid size={20} className="text-slate-200" />
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-sm text-slate-700 uppercase tracking-tight group-hover:text-[#7e2827] transition-colors">
                    {pro.name}
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200/50">
                      {pro.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      {/* View Button */}
                      <button 
                        onClick={() => navigate(`/admin/my-products/view/${pro.id}`)}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <Eye size={20}/>
                      </button>

                      {/* Edit Button - Matches Route: my-products/edit/:id */}
                      <button 
                        onClick={() => navigate(`/admin/my-products/edit/${pro.id}`)}
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                      >
                        <Edit3 size={20}/>
                      </button>

                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(pro.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
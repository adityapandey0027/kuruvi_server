import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Eye, Search, LayoutGrid, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/products/all');
      // Backend structured as data.data based on your console log
      setProducts(data.data || []);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // 2. Delete Logic
  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await API.delete(`/products/${productId}`);
        setProducts(products.filter(p => p._id !== productId));
        toast.success("Product deleted");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-[#7e2827] p-3 rounded-2xl text-white shadow-lg">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Product Inventory</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total Items: {products.length}</p>
          </div>
        </div>
        
        <Link 
          to="/admin/my-products/create" 
          className="bg-black text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-[#7e2827] transition-all flex items-center gap-2"
        >
          <Plus size={18} /> New Product
        </Link>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/30 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by name or brand..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-black outline-none w-full focus:ring-2 focus:ring-[#7e2827]/10 transition-all" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">#</th>
                <th className="px-6 py-5">Product Info</th>
                <th className="px-6 py-5">Brand</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-xs font-bold text-slate-400 animate-pulse uppercase">Syncing with server...</td></tr>
              ) : products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((pro, index) => (
                <tr key={pro._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 text-xs font-bold text-slate-400">{index + 1}</td>
                  
                  {/* Product Details & Placeholder Image */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                        {/* Note: Since images are in variants, we check if variations exist.
                          If no images found, show generic LayoutGrid icon
                        */}
                        {pro.variations?.[0]?.images?.[0] ? (
                          <img src={pro.variations[0].images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <LayoutGrid size={18} className="text-slate-200" />
                        )}
                      </div>
                      <div>
                        <button 
                           onClick={() => navigate(`/admin/my-products/view/${pro._id}`)}
                           className="font-black text-sm text-black uppercase tracking-tight hover:text-[#7e2827] block text-left"
                        >
                          {pro.name}
                        </button>
                        <div className="flex gap-1 mt-1">
                          {pro.tags?.slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[8px] font-bold text-slate-400 uppercase">#{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{pro.brand || '---'}</span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-200/50">
                      {pro.categoryId?.name || 'General'}
                    </span>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/my-products/view/${pro._id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View Details"
                      >
                        <Eye size={18}/>
                      </button>

                      <button 
                        onClick={() => navigate(`/admin/my-products/edit/${pro._id}`)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Edit Product"
                      >
                        <Edit3 size={18}/>
                      </button>

                      <button 
                        onClick={() => handleDelete(pro._id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && !loading && (
             <div className="py-20 text-center flex flex-col items-center">
                <Package size={40} className="text-slate-100 mb-2" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Inventory is Empty</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
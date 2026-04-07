import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Eye, Search, LayoutGrid, Package, ChevronLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

// Utility for debouncing search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 1. Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // 2. Fetch Products with page and search parameters
  const fetchProducts = async (page = 1, search = "") => {
    setLoading(true);
    try {
      // Endpoint expects page, limit, and search query
      const { data } = await API.get(`/products/all?page=${page}&limit=${pagination.limit}&search=${search}`);
      
      setProducts(data.data || []);
      
      // Sync pagination state from server response
      if (data.total !== undefined) {
        setPagination({
          page: data.page,
          pages: Math.ceil(data.total / data.limit),
          total: data.total,
          limit: data.limit
        });
      }
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on search or page change
  useEffect(() => {
    fetchProducts(1, debouncedSearch);
  }, [debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchProducts(newPage, searchTerm);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await API.delete(`/products/${productId}`);
        // Refresh current page after deletion
        fetchProducts(pagination.page, searchTerm);
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Total Items: {pagination.total}
            </p>
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
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#7e2827]" size={24} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Syncing...</p>
                  </td>
                </tr>
              ) : (
                products.map((pro, index) => (
                  <tr key={pro._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-xs font-bold text-slate-400">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                          {/* Accessing images from the variants array returned by controller */}
                          {pro.variants?.[0]?.images?.[0] ? (
                            <img src={pro.variants[0].images[0]} className="w-full h-full object-cover" alt="" />
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
                        <button onClick={() => navigate(`/admin/my-products/view/${pro._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Details"><Eye size={18}/></button>
                        <button onClick={() => navigate(`/admin/my-products/edit/${pro._id}`)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Edit Product"><Edit3 size={18}/></button>
                        <button onClick={() => handleDelete(pro._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 3. Pagination Controls */}
          {!loading && products.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Page {pagination.page} of {pagination.pages} ({pagination.total} Total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30 hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {[...Array(pagination.pages)].map((_, i) => {
                    const p = i + 1;
                    if (pagination.pages > 5 && Math.abs(p - pagination.page) > 1 && p !== 1 && p !== pagination.pages) {
                       if (p === 2 || p === pagination.pages - 1) return <span key={p} className="px-1 text-slate-400">...</span>;
                       return null;
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`h-10 w-10 rounded-xl text-[10px] font-black transition-all ${
                          pagination.page === p ? 'bg-black text-white' : 'bg-white border border-slate-200 text-black hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="p-2 border border-slate-200 rounded-xl bg-white disabled:opacity-30 hover:bg-slate-50 transition-all rotate-180"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
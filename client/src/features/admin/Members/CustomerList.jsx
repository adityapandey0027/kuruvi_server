import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { Eye, Search, UserMinus, Loader2, User, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../api/axios';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Pagination State aligned with backend response
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // 2. Updated Fetch logic to include page and search query
  const fetchCustomers = async (page = 1, query = "") => {
    try {
      setLoading(true);
      // Controller expects 'page', 'limit', and 'q' for search
      const response = await API.get(`/admin/customers/all?page=${page}&limit=${pagination.limit}&q=${query}`);
      
      setCustomers(response.data.data || []);
      
      // Sync pagination metadata from server
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when debounced search term changes
  useEffect(() => {
    fetchCustomers(1, debouncedSearch);
  }, [debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchCustomers(newPage, searchTerm);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return toast.warn("Please select at least one row");
    
    if (window.confirm("Are you sure you want to delete the selected customers?")) {
      try {
        await axios.post('/api/customer/delete_all', { id: selectedIds });
        toast.success("Customers deleted successfully");
        setSelectedIds([]);
        fetchCustomers(pagination.page, searchTerm);
      } catch (error) {
        toast.error("An error occurred while deleting data");
      }
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#7e2827]" size={40} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
          Customer Management
        </h2>
        <button 
          onClick={handleDeleteSelected}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
        >
          <UserMinus size={16} /> Delete Selected ({selectedIds.length})
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, ID or mobile..." 
            className="flex-1 bg-transparent outline-none font-bold text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-6">
                  <input 
                    type="checkbox" 
                    className="accent-[#7e2827]"
                    onChange={(e) => setSelectedIds(e.target.checked ? customers.map(c => c._id) : [])}
                    checked={selectedIds.length === customers.length && customers.length > 0}
                  />
                </th>
                <th className="p-6">User Profile</th>
                <th className="p-6">Mobile Number</th>
                <th className="p-6 text-center">Display Name</th>
                <th className="p-6 text-center">Registration Date</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <input 
                      type="checkbox" 
                      className="accent-[#7e2827]"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => setSelectedIds(prev => prev.includes(item._id) ? prev.filter(i => i !== item._id) : [...prev, item._id])}
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none mb-1">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {item._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-bold text-slate-600">{item.mobile}</td>
                  <td className="p-6 text-center">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-800 rounded-lg font-black text-[9px] uppercase tracking-widest border border-slate-200">
                      {item.name}
                    </span>
                  </td>
                  <td className="p-6 text-center font-bold text-slate-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/customer/view/${item._id}`)}
                        className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. New Pagination Controls */}
        {!loading && customers.length > 0 && (
          <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Showing Page {pagination.page} of {pagination.pages} 
              <span className="ml-2 text-slate-400">({pagination.total} Total Customers)</span>
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white disabled:opacity-30 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex gap-1">
                {[...Array(pagination.pages)].map((_, i) => {
                  const pNum = i + 1;
                  // Basic ellipsis logic for high page counts
                  if (pagination.pages > 5 && Math.abs(pNum - pagination.page) > 1 && pNum !== 1 && pNum !== pagination.pages) {
                    if (pNum === 2 || pNum === pagination.pages - 1) return <span key={pNum} className="px-1 text-slate-400">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`h-10 w-10 rounded-xl text-[11px] font-black transition-all ${
                        pagination.page === pNum 
                        ? 'bg-[#7e2827] text-white shadow-lg' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white disabled:opacity-30 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
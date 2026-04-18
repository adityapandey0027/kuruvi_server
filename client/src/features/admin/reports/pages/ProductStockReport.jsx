import React, { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    RefreshCcw,
    Package,
    AlertTriangle,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Store // New Icon
} from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const ProductStockReport = () => {
    const [data, setData] = useState([]);
    const [stores, setStores] = useState([]); // Store list state
    const [selectedStoreId, setSelectedStoreId] = useState(""); // Selected store state
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    // 1. Fetch all available stores on mount
    const fetchStores = async () => {
        try {
            const { data } = await API.get('/stores');
            const storesList = data.data || [];
            setStores(storesList);
            
            // Default to the first store if available
            if (storesList.length > 0) {
                setSelectedStoreId(storesList[0]._id);
            }
        } catch (err) {
            toast.error("Failed to load store directory");
        }
    };

    // 2. Fetch stock data for the specific store
    const fetchStock = async () => {
        if (!selectedStoreId) return;
        
        try {
            setLoading(true);
            const res = await API.get(`/reports/stock-report/${selectedStoreId}`, {
                params: { q: searchTerm, page, limit: 15 }
            });
            setData(res.data.data);
            setPagination({
                total: res.data.total,
                pages: Math.ceil(res.data.total / 15)
            });
        } catch (err) {
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => fetchStock(), 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, page, selectedStoreId]);

    const handleExport = async (type) => {
        if (!selectedStoreId) return toast.warning("Please select a store first");
        
        try {
            const format = type === 'excel' ? 'stock-report-excel' : 'stock-report-pdf';
            const response = await API.get(`/reports/${format}/${selectedStoreId}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = type === 'excel' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `Stock_Report_${selectedStoreId.slice(-6)}_${Date.now()}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`${type.toUpperCase()} downloaded successfully`);
        } catch (err) {
            toast.error(`Failed to generate ${type.toUpperCase()} report`);
        }
    };

    return (
        <div className="space-y-6 p-4 font-sans max-w-[1600px] mx-auto">

            {/* 1. Header & Quick Actions */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-black text-white rounded-2xl shadow-xl shadow-black/10">
                        <Package size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-black uppercase tracking-tight leading-none">Inventory Ledger</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Stock Monitoring & Reports</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* STORE DROPDOWN */}
                    <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 hover:border-[#7e2827]/30 transition-all group">
                        <Store size={16} className="text-slate-400 mr-3 group-focus-within:text-[#7e2827]" />
                        <select 
                            value={selectedStoreId}
                            onChange={(e) => { setSelectedStoreId(e.target.value); setPage(1); }}
                            className="bg-transparent text-sm font-black uppercase tracking-tighter outline-none cursor-pointer pr-4 min-w-[180px]"
                        >
                            {stores.map(store => (
                                <option key={store._id} value={store._id}>
                                    {store.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search SKU or Product..."
                            className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827] focus:ring-4 focus:ring-[#7e2827]/5 w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="h-10 w-px bg-slate-100 mx-2 hidden xl:block" />

                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2 px-6 py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                    >
                        <FileSpreadsheet size={16} /> Excel
                    </button>

                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2 px-6 py-3.5 bg-rose-50 text-rose-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
                    >
                        <FileText size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* 2. Main Data Table */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-6">Product Details</th>
                            <th className="px-6 py-6">Category</th>
                            <th className="px-6 py-6 text-center">SKU</th>
                            <th className="px-6 py-6 text-center">Price Points</th>
                            <th className="px-6 py-6 text-center">Available Stock</th>
                            <th className="px-8 py-6 text-right">Operational Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="py-32 text-center">
                                    <Loader2 className="animate-spin mx-auto text-[#7e2827]" size={40} />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Compiling Inventory...</p>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-32 text-center text-slate-300">
                                    <Package size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-xs font-black uppercase tracking-widest">No matching stock data found</p>
                                </td>
                            </tr>
                        ) : data.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-black uppercase tracking-tight">{item.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.brand} • {item.variant.size} {item.variant.unit}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-500 uppercase">{item.category || "General"}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <code className="text-[11px] font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-md">{item.sku}</code>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[11px] font-black text-black">₹{item.price}</span>
                                        <span className="text-[9px] font-bold text-slate-300 line-through">₹{item.mrp}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`text-sm font-black ${item.stock <= 5 ? 'text-rose-500' : 'text-black'}`}>
                                        {item.stock}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.status === 'In Stock'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                        {item.status === 'In Stock' ? <RefreshCcw size={10} /> : <AlertTriangle size={10} />}
                                        {item.status}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="p-8 bg-slate-50/30 flex justify-between items-center border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing Page {page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={page >= pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-black hover:text-white disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductStockReport;
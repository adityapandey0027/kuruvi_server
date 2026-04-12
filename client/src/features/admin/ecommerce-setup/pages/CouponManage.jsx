import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, Loader2, Ticket, X, ChevronLeft, Calendar, Tag, Percent } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const CouponManage = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/coupons/admin/all');
            setCoupons(data.data || []);
        } catch (err) {
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This coupon will be permanently removed.")) {
            try {
                await API.delete(`/coupons/delete/${id}`);
                setCoupons(prev => prev.filter(c => c._id !== id));
                toast.success("Coupon deleted");
            } catch (err) {
                toast.error("Delete failed");
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            // Optimized: optimistic update to UI for better UX
            setCoupons(prev => prev.map(cpn =>
                cpn._id === id ? { ...cpn, isActive: !cpn.isActive } : cpn
            ));

            const { data } = await API.patch(`/coupons/status/${id}`);
            toast.success(data.message || "Status updated");
        } catch (err) {
            toast.error("Failed to update status");
            // Rollback on error
            fetchCoupons();
        }
    };

    return (
        <div className="space-y-6 p-4 font-sans">
            {view === 'list' && (
                <>
                    {/* Header */}
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div>
                            <h2 className="text-2xl font-black text-black uppercase tracking-tight">Promotional Coupons</h2>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Discounts & Incentives</p>
                        </div>
                        <button
                            onClick={() => { setSelectedCoupon(null); setView('add'); }}
                            className="flex items-center gap-2 bg-[#7e2827] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-black transition-all"
                        >
                            <Plus size={16} /> Create New Coupon
                        </button>
                    </div>

                    {/* List Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Code / Name</th>
                                    <th className="px-6 py-4 text-center">Discount</th>
                                    <th className="px-6 py-4 text-center">Validity</th>
                                    <th className="px-6 py-4 text-center">Usage</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#7e2827]" /></td></tr>
                                ) : coupons.map((cpn) => (
                                    <tr key={cpn._id} className="hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg text-[#7e2827]"><Ticket size={18} /></div>
                                                <div>
                                                    <p className="font-black uppercase text-sm text-black">{cpn.code}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{cpn.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-black">
                                                {cpn.discountType === 'PERCENTAGE' ? `${cpn.discountValue}%` : `₹${cpn.discountValue}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                                                {new Date(cpn.validFrom).toLocaleDateString()} - {new Date(cpn.validTill).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-[10px] font-black text-black">{cpn.usedCount} / {cpn.usageLimit || '∞'}</p>
                                        </td>
                                        {/* --- NEW STATUS TOGGLE COLUMN --- */}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(cpn._id)}
                                                className={`flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${cpn.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                    }`}
                                            >
                                                <div className={`h-1.5 w-1.5 rounded-full ${cpn.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                {cpn.isActive ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setSelectedCoupon(cpn); setView('edit'); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(cpn._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18} /></button>
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
                <CouponForm
                    type={view}
                    data={selectedCoupon}
                    onBack={() => setView('list')}
                    refresh={fetchCoupons}
                />
            )}
        </div>
    );
};

const CouponForm = ({ type, data, onBack, refresh }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: data?.code || "",
        name: data?.name || "",
        description: data?.description || "",
        discountType: data?.discountType || "PERCENTAGE",
        discountValue: data?.discountValue || "",
        maxDiscount: data?.maxDiscount || "",
        minOrderAmount: data?.minOrderAmount || "",
        validFrom: data?.validFrom ? data.validFrom.split('T')[0] : "",
        validTill: data?.validTill ? data.validTill.split('T')[0] : "",
        usageLimit: data?.usageLimit || "",
        perUserLimit: data?.perUserLimit || 1,
        userType: data?.userType || "ALL",
        isActive: data?.isActive ?? true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (type === 'add') {
                await API.post('/coupons/add', formData);
                toast.success("Coupon Created!");
            } else {
                await API.put(`/coupons/update/${data._id}`, formData);
                toast.success("Coupon Updated!");
            }
            refresh();
            onBack();
        } catch (err) {
            toast.error(err.response?.data?.message || "Error processing request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white rounded-full border border-slate-200"><ChevronLeft size={20} /></button>
                    <h3 className="text-sm font-black text-black uppercase tracking-widest">{type === 'add' ? 'New' : 'Edit'} Coupon</h3>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coupon Code</label>
                            <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                            <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                    </div>

                    {/* Discount Settings */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#7e2827] uppercase tracking-widest">Type</label>
                            <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold" value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Flat Amount (Fixed)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#7e2827] uppercase tracking-widest">Value</label>
                            <input type="number" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Order Amount</label>
                            <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold" value={formData.minOrderAmount} onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Discount (Cap)</label>
                            <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold" value={formData.maxDiscount} onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })} placeholder="Unlimited if empty" />
                        </div>
                    </div>

                    {/* Limits & Date */}
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid From</label>
                            <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.validFrom} onChange={e => setFormData({ ...formData, validFrom: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Till</label>
                            <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.validTill} onChange={e => setFormData({ ...formData, validTill: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Usage Limit</label>
                            <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.usageLimit} onChange={e => setFormData({ ...formData, usageLimit: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target User Type</label>
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={formData.userType} onChange={e => setFormData({ ...formData, userType: e.target.value })}>
                                <option value="ALL">All Users</option>
                                <option value="NEW">First Time Buyers</option>
                                <option value="EXISTING">Returning Customers</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex justify-center gap-3">
                    {loading ? "Processing..." : <><Save size={18} /> Save Coupon Strategy</>}
                </button>
            </form>
        </div>
    );
};

export default CouponManage;
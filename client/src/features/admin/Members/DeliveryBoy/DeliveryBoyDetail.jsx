import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from "../../../../api/axios"; // Using your configured API instance
import { 
  Wallet, Landmark, FileText, ArrowLeft, 
  Loader2, ExternalLink, CheckCircle, Package 
} from 'lucide-react';
import { toast } from 'react-toastify';

const DeliveryBoyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // FIXED: API path updated to match your backend riders endpoint
      const res = await API.get(`/admin/riders/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error("Could not fetch rider details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const updateStatus = async (statusValue) => {
    try {
      // Adjusted endpoint for status updates
      await API.post(`/admin/riders/update-status/${id}`, { status: statusValue });
      toast.success("Status updated successfully");
      fetchDetails(); 
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#7e2827]" size={40} />
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">
      Rider Profile Not Found
    </div>
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Navigation & Status Action */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-black font-black text-[10px] uppercase tracking-[0.2em] transition-all">
          <ArrowLeft size={16} /> Return to Partners
        </button>
        <div className="flex gap-3">
          {data.status !== 'active' ? (
            <button 
              onClick={() => updateStatus('active')} 
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
            >
              Approve Rider
            </button>
          ) : (
            <button 
              onClick={() => updateStatus('inactive')} 
              className="bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              Suspend Account
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden mb-4">
            {data.image ? (
              <img src={data.image} className="h-full w-full object-cover" alt="Rider" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300 font-black text-3xl">
                {data.name?.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{data.name}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{data.phone}</p>
          
          <div className="w-full mt-6 pt-6 border-t border-slate-50 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-900 truncate ml-4">{data.email}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Status:</span>
              <span className={data.status === 'active' ? 'text-emerald-600' : 'text-amber-500'}>{data.status}</span>
            </div>
          </div>
        </div>

        {/* Earning Summary Card (Updated to match Aditya's statsAgg) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-50 text-[#7e2827] rounded-2xl"><Wallet size={20} /></div>
            <h4 className="font-black text-xs uppercase tracking-widest">Performance Metrics</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Earnings</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{data.stats?.totalEarnings || 0}</p>
            </div>
            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivered Orders</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{data.stats?.totalDelivered || 0}</p>
                <CheckCircle className="text-emerald-500" size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Documents (KYC) */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FileText size={20} /></div>
            <h4 className="font-black text-xs uppercase tracking-widest">Verification Dossier</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Aadhar Card', url: data.aadharImage },
              { label: 'PAN Card', url: data.panImage },
              { label: 'Driving License', url: data.licenseImage },
              { label: 'Vehicle RC', url: data.rcImage }
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{doc.label}</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-xl text-[#7e2827] shadow-sm hover:scale-110 transition-transform">
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-[8px] font-bold text-slate-300 italic uppercase">Not Uploaded</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bank Account Info */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Landmark size={20} /></div>
            <h4 className="font-black text-xs uppercase tracking-widest">Payout Details</h4>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Account Holder', value: data.bankDetails?.holderName },
              { label: 'Account Number', value: data.bankDetails?.accountNo },
              { label: 'IFSC Code', value: data.bankDetails?.ifscCode },
              { label: 'Bank Name', value: data.bankDetails?.bankName }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                <span className="text-xs font-black text-slate-900 uppercase">{item.value || "N/A"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rider Order History (Updated to match Aditya's .orders array) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <Package className="text-[#7e2827]" size={18} />
          <h4 className="font-black text-xs uppercase tracking-widest">Consignment History</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="p-5">Reference ID</th>
                <th className="p-5">Timestamp</th>
                <th className="p-5">Valuation</th>
                <th className="p-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.orders?.length > 0 ? data.orders.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 font-black text-slate-900 tracking-tight">#{order.orderId}</td>
                  <td className="p-5 text-slate-500 font-bold">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-5 font-black text-slate-900 font-mono text-xs">₹{order.totalAmount}</td>
                  <td className="p-5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No transaction logs available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyDetail;
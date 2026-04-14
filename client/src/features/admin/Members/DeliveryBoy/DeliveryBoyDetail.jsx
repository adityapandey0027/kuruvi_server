import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from "../../../../api/axios"; 
import { 
  Wallet, Landmark, FileText, ArrowLeft, 
  Loader2, ExternalLink, CheckCircle, Package, MapPin, ShieldCheck, User
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
      const res = await API.get(`/admin/riders/details/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error("Could not fetch rider dossier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetails(); }, [id]);

  const updateStatus = async (statusValue) => {
    try {
      await API.post(`/admin/riders/update-status/${id}`, { status: statusValue });
      toast.success("Operational status updated");
      fetchDetails(); 
    } catch (err) {
      toast.error("Action failed");
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#7e2827]" size={40} />
    </div>
  );

  if (!data || !data.rider) return <div className="p-20 text-center font-black text-slate-300">Rider Not Found</div>;

  const { rider, stats, orders } = data;

  return (
    <div className="space-y-6 pb-20 font-sans max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-black font-black text-[10px] uppercase tracking-[0.2em] transition-all">
          <ArrowLeft size={16} /> Back to Fleet
        </button>
        <div className="flex gap-3">
          {!rider.isVerified && (
            <button 
              onClick={() => updateStatus('active')} 
              className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-emerald-100"
            >
              Verify Credentials
            </button>
          )}
          <button className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex flex-col items-center">
            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden mb-6">
              {rider.profileImage?.url ? (
                <img src={rider.profileImage.url} className="h-full w-full object-cover" alt="Rider" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#7e2827] text-white text-4xl font-black">{rider.name?.charAt(0)}</div>
              )}
            </div>
            <h3 className="text-2xl font-black text-black uppercase tracking-tighter">{rider.name}</h3>
            <span className="text-[10px] font-black text-[#7e2827] uppercase tracking-[0.3em] mt-1">{rider.status}</span>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-8">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Age</p>
                    <p className="text-sm font-black">{rider.age}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Gender</p>
                    <p className="text-sm font-black">{rider.gender}</p>
                </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
            <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-300 mt-1" />
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Residential Address</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
                        {rider.address.fullAddress}, {rider.address.city} - {rider.address.pincode}
                    </p>
                </div>
            </div>
          </div>
        </div>

        {/* Financial & Operational Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#7e2827]/10 text-[#7e2827] rounded-lg"><Wallet size={18}/></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Earnings</h4>
              </div>
              <p className="text-5xl font-black tracking-tighter italic">₹{stats.totalEarnings?.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={18}/></div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivered Orders</h4>
              </div>
              <p className="text-5xl font-black tracking-tighter italic">{stats.totalDelivered}</p>
            </div>
          </div>

          {/* Verification Docs */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6 text-[#7e2827]">
                <ShieldCheck size={20} />
                <h4 className="text-xs font-black uppercase tracking-widest">Government Verification</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Aadhaar Number</p>
                  <p className="text-xs font-black tracking-widest">{rider.documents?.aadhaarNumber}</p>
                </div>
                <a href={rider.documents?.aadhaarImage?.url} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-xl shadow-sm text-[#7e2827] hover:bg-black hover:text-white transition-all">
                  <ExternalLink size={16} />
                </a>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Driving License</p>
                  <p className="text-xs font-black tracking-widest">{rider.documents?.drivingLicenseNumber}</p>
                </div>
                <a href={rider.documents?.drivingLicenseImage?.url} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-xl shadow-sm text-[#7e2827] hover:bg-black hover:text-white transition-all">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank & Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 lg:col-span-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Landmark size={20} /></div>
            <h4 className="font-black text-xs uppercase tracking-widest">Settlement Account</h4>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Beneficiary', value: rider.bankDetails?.accountHolderName },
              { label: 'A/C Number', value: rider.bankDetails?.accountNumber },
              { label: 'Bank', value: rider.bankDetails?.bankName },
              { label: 'IFSC', value: rider.bankDetails?.ifscCode }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                <span className="text-xs font-black text-black uppercase">{item.value || "---"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order History Table */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-50">
             <h4 className="text-xs font-black uppercase tracking-widest">Recent Activity</h4>
             <span className="text-[9px] font-black text-slate-400 uppercase">Total Items: {data.pagination?.total}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[9px] font-black text-slate-400 uppercase bg-slate-50/20">
                <tr>
                  <th className="p-6">Manifest ID</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders?.length > 0 ? orders.map((o, i) => (
                  <tr key={i} className="text-xs font-bold text-slate-700">
                    <td className="p-6">#{o.orderId}</td>
                    <td className="p-6">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black">{o.status}</span>
                    </td>
                    <td className="p-6 text-right font-black">₹{o.totalAmount}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="p-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No order history available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyDetail;
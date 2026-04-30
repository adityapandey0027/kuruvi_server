import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from "../../../../api/axios"; 
import { 
  Wallet, Landmark, FileText, ArrowLeft, Loader2, ExternalLink, 
  CheckCircle, Package, MapPin, ShieldCheck, Power, UserCheck, 
  Smartphone, Truck, Navigation
} from 'lucide-react';
import { toast } from 'react-toastify';

const DeliveryBoyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAccountAction = async (actionType, value) => {
    const confirmMessage = actionType === 'isActive' 
      ? `Are you sure you want to ${value ? 'activate' : 'deactivate'} this rider?`
      : `Mark documents as verified?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      await API.put(`/admin/riders/update-status/${id}`, { [actionType]: value });
      toast.success(`Rider ${actionType === 'isActive' ? 'Status' : 'Verification'} updated`);
      fetchDetails(); 
    } catch (err) {
      toast.error("Operation failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-[#7e2827]" size={40} />
    </div>
  );

  if (!data || !data.rider) return <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">Rider Not Found</div>;

  const { rider, stats, location } = data;

  return (
    <div className="space-y-6 pb-20 font-sans max-w-7xl mx-auto px-4">
      
      {/* ADMINISTRATIVE CONTROL PANEL */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Partner Fleet Controls</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System ID: {id.slice(-8)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!rider.isVerified ? (
            <button 
              disabled={actionLoading}
              onClick={() => handleAccountAction('isVerified', true)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <CheckCircle size={14} /> Verify Documents
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase">
              <ShieldCheck size={14} /> Identity Verified
            </div>
          )}

          <button 
            disabled={actionLoading}
            onClick={() => handleAccountAction('isActive', !rider.isActive)}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border ${
              rider.isActive 
              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' 
              : 'bg-black text-white border-black hover:bg-[#7e2827]'
            } disabled:opacity-50`}
          >
            <Power size={14} /> {rider.isActive ? 'Deactivate Account' : 'Activate Account'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Identity Card */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-40 w-40 rounded-[3rem] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden flex-shrink-0">
              {rider.profileImage?.url ? (
                <img src={rider.profileImage.url} className="h-full w-full object-cover" alt="Rider" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[#7e2827] text-white text-5xl font-black">{rider.name?.charAt(0)}</div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
                <h3 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">{rider.name}</h3>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-6">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${rider.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {rider.isActive ? 'Access Enabled' : 'Access Revoked'}
                    </span>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase italic">{rider.status}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Contact</p>
                        <p className="text-[11px] font-black flex items-center gap-1 justify-center sm:justify-start">
                          <Smartphone size={10} /> {rider.phone}
                        </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Vehicle Info</p>
                        <p className="text-[11px] font-black flex items-center gap-1 justify-center sm:justify-start uppercase">
                          <Truck size={10} /> {rider.vehicleType || 'Two-Wheeler'}
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* PERFORMANCE PULSE */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Package size={120} />
             </div>
             
             <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                    <Wallet size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Fleet Earnings</span>
                </div>
                <p className="text-4xl font-black tracking-tighter italic text-black">₹{stats.totalEarnings?.toLocaleString()}</p>
             </div>

             <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-50 pt-6 sm:pt-0 sm:pl-8">
                <div className="flex items-center gap-2 mb-2 text-[#7e2827]">
                    <UserCheck size={16} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Job Metrics</span>
                </div>
                <div className="flex gap-6">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Success</p>
                        <p className="text-xl font-black italic">{stats.totalDelivered}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Live Load</p>
                        <p className="text-xl font-black italic">{rider.activeOrders}</p>
                    </div>
                </div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText size={16} className="text-[#7e2827]" /> ID & Credentials
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Government ID (Aadhaar)</p>
                    <p className="text-sm font-black tracking-widest">
                      {rider.documents?.aadhaarNumber ? `XXXX-XXXX-${rider.documents.aadhaarNumber.slice(-4)}` : '[Aadhaar Redacted]'}
                    </p>
                </div>
                <a href={rider.documents?.aadhaarImage?.url} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-xl shadow-sm text-[#7e2827] hover:bg-black hover:text-white transition-all"><ExternalLink size={18} /></a>
            </div>
            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Driving License</p>
                    <p className="text-sm font-black tracking-widest">{rider.documents?.drivingLicenseNumber || "NOT_PROVIDED"}</p>
                </div>
                <a href={rider.documents?.drivingLicenseImage?.url} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-xl shadow-sm text-[#7e2827] hover:bg-black hover:text-white transition-all"><ExternalLink size={18} /></a>
            </div>
          </div>
        </div>

        {/* Live Location Widget */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#7e2827]">
                    <MapPin size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Real-time Ping</h4>
                </div>
                {location?.lat && (
                  <a 
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] font-black uppercase text-blue-600 underline flex items-center gap-1"
                  >
                    <Navigation size={12} /> View Map
                  </a>
                )}
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase leading-relaxed">
                    {rider.address?.fullAddress}<br/>
                    {rider.address?.city} - {rider.address?.pincode}
                </p>
                <div className="pt-2 border-t border-slate-50">
                   <p className="text-[8px] font-black text-slate-400 uppercase">Last Signal</p>
                   <p className="text-[10px] font-bold text-slate-500">
                     {location?.ts ? new Date(location.ts).toLocaleString() : 'No active signal'}
                   </p>
                </div>
            </div>
        </div>
      </div>

      {/* Payout Channels */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Landmark size={20} /></div>
            <h4 className="font-black text-xs uppercase tracking-widest">Financial Payout Details</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Bank Name', value: rider.bankDetails?.bankName },
              { label: 'Beneficiary', value: rider.bankDetails?.accountHolderName },
              { label: 'A/C Number', value: rider.bankDetails?.accountNumber },
              { label: 'IFSC Code', value: rider.bankDetails?.ifscCode }
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">{item.label}</p>
                <p className="text-sm font-black text-black uppercase">{item.value || "---"}</p>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default DeliveryBoyDetail;
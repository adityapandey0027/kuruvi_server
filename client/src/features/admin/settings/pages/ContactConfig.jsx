import React, { useState, useEffect } from 'react';
import { Save, Loader2, Headset, Mail, Phone, MessageSquare, Clock, MapPin, Edit3, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const ContactConfig = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState({
    email: "",
    phone: "",
    description: "",
    whatsapp: "",
    address: "",
    workingHours: "",
    isActive: true
  });

  const fetchConfig = async () => {
    try {
      setFetching(true);
      const { data } = await API.get('/contacts/config');
      if (data.data) setConfig(data.data);
    } catch (err) {
      toast.info("Initialize your support contact details");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/contacts/config', config);
      toast.success("Support details updated!");
      setIsEditing(false);
      fetchConfig();
    } catch (err) {
      toast.error("Failed to save support configuration");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#7e2827]" size={40} /></div>;

  return (
    <div className="space-y-6 p-4 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
            <Headset className="text-[#7e2827]" /> Customer Support
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure Public Contact Information</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all ${isEditing ? 'bg-black text-white' : 'bg-[#7e2827] text-white'}`}
        >
          {isEditing ? <><X size={16}/> Cancel</> : <><Edit3 size={16}/> Edit Details</>}
        </button>
      </div>

      {!isEditing ? (
        /* --- LIST / PREVIEW VIEW --- */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-8 bg-slate-50/50 border-b border-slate-100">
            <h3 className="text-sm font-black text-black uppercase tracking-widest mb-2">Live Support Card</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{config.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100">
            {[
              { icon: <Mail size={20}/>, label: "Email Address", value: config.email },
              { icon: <Phone size={20}/>, label: "Phone Number", value: config.phone },
              { icon: <MessageSquare size={20}/>, label: "WhatsApp", value: config.whatsapp || "Not Linked" },
              { icon: <Clock size={20}/>, label: "Working Hours", value: config.workingHours },
              { icon: <MapPin size={20}/>, label: "Office Address", value: config.address, full: true },
            ].map((item, i) => (
              <div key={i} className={`bg-white p-6 flex items-start gap-4 ${item.full ? 'md:col-span-2' : ''}`}>
                <div className="p-3 bg-slate-50 rounded-xl text-[#7e2827]">{item.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-bold text-black mt-1">{item.value || "---"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- EDIT FORM --- */
        <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
              <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827]" value={config.email} onChange={e => setConfig({...config, email: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Phone</label>
              <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827]" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827]" value={config.whatsapp} onChange={e => setConfig({...config, whatsapp: e.target.value})}/>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Working Hours</label>
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827]" value={config.workingHours} onChange={e => setConfig({...config, workingHours: e.target.value})}/>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Description</label>
              <textarea rows="2" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827]" value={config.description} onChange={e => setConfig({...config, description: e.target.value})}/>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
              <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#7e2827]" value={config.address} onChange={e => setConfig({...config, address: e.target.value})}/>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex justify-center items-center gap-3 active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Publish Support Info</>}
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactConfig;
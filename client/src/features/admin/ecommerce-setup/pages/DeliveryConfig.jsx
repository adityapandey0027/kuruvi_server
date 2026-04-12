import React, { useState, useEffect } from 'react';
import { Save, Loader2, Truck, Plus, Trash2, CheckCircle2, ArrowRight, Edit3, X, List } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const DeliveryConfig = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState({
    type: "ORDER_VALUE",
    baseFee: 0,
    freeDeliveryAbove: 0,
    orderValueRules: [],
    distanceRules: [],
    isActive: true
  });

  const fetchConfig = async () => {
    try {
      setFetching(true);
      const { data } = await API.get('/delivery/config');
      if (data.data) setConfig(data.data);
    } catch (err) {
      toast.info("Setup your delivery rules");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.post('/delivery/config', config);
      toast.success("Settings Saved Successfully");
      setIsEditing(false);
      fetchConfig();
    } catch (err) {
      toast.error("Error saving configuration");
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const isOrder = config.type === 'ORDER_VALUE';
    const newRule = isOrder 
      ? { minAmount: 0, maxAmount: 0, fee: 0 }
      : { minKm: 0, maxKm: 0, fee: 0 };
    
    const field = isOrder ? 'orderValueRules' : 'distanceRules';
    setConfig({ ...config, [field]: [...config[field], newRule] });
  };

  if (fetching) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#7e2827]" size={40} /></div>;

  return (
    <div className="space-y-6 p-4 font-sans max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Delivery Engine</h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Current Logic: <span className="text-[#7e2827]">{config.type.replace('_', ' ')}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all ${isEditing ? 'bg-black text-white' : 'bg-[#7e2827] text-white'}`}
        >
          {isEditing ? <><X size={16}/> Cancel</> : <><Edit3 size={16}/> Modify Config</>}
        </button>
      </div>

      {!isEditing ? (
        /* --- LIST / SUMMARY VIEW --- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center justify-center">
             <div className="p-4 bg-slate-50 rounded-2xl mb-3 text-[#7e2827]">
                <CheckCircle2 size={32}/>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Strategy</p>
             <h4 className="text-xl font-black text-black uppercase">{config.type.replace('_', ' ')}</h4>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center justify-center">
             <div className="p-4 bg-emerald-50 rounded-2xl mb-3 text-emerald-600">
                <Truck size={32}/>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Free Delivery Above</p>
             <h4 className="text-xl font-black text-black uppercase">₹{config.freeDeliveryAbove}</h4>
          </div>

          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                <List size={18} className="text-[#7e2827]"/>
                <h3 className="text-xs font-black uppercase tracking-widest">Active Rate Tiers</h3>
             </div>
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <tr>
                      <th className="px-8 py-4">Range ({config.type === 'ORDER_VALUE' ? '₹' : 'KM'})</th>
                      <th className="px-8 py-4 text-right">Delivery Fee</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {(config.type === 'ORDER_VALUE' ? config.orderValueRules : config.distanceRules).map((rule, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-8 py-4 text-sm font-bold text-black flex items-center gap-3">
                            {config.type === 'ORDER_VALUE' ? `₹${rule.minAmount}` : `${rule.minKm} KM`} 
                            <ArrowRight size={14} className="text-slate-300"/> 
                            {config.type === 'ORDER_VALUE' ? `₹${rule.maxAmount}` : `${rule.maxKm} KM`}
                         </td>
                         <td className="px-8 py-4 text-right text-sm font-black text-[#7e2827]">
                            ₹{rule.fee}
                         </td>
                      </tr>
                   ))}
                   {(config.type === 'ORDER_VALUE' ? config.orderValueRules : config.distanceRules).length === 0 && (
                      <tr>
                         <td colSpan="2" className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest">No tiers configured</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      ) : (
        /* --- EDIT MODE (YOUR PREVIOUS CODE) --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           {/* Global Controls */}
           <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Select Pricing Logic</label>
              <div className="flex gap-2">
                {['ORDER_VALUE', 'DISTANCE'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setConfig({ ...config, type: mode })}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${config.type === mode ? 'bg-black text-white border-black shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#7e2827]/10 shadow-sm">
              <label className="text-[10px] font-black text-[#7e2827] uppercase tracking-widest block mb-4">Free Delivery Rule</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#7e2827] text-sm">₹</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-4 py-4 bg-[#7e2827]/5 border border-[#7e2827]/10 rounded-2xl text-sm font-black text-[#7e2827] outline-none" 
                  value={config.freeDeliveryAbove} 
                  onChange={e => setConfig({...config, freeDeliveryAbove: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          {/* Tier Builder */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-black uppercase tracking-widest">Configure Tiers</h3>
              <button onClick={addRule} className="p-2 bg-black text-white rounded-xl hover:bg-[#7e2827] transition-all"><Plus size={16} /></button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {(config.type === 'ORDER_VALUE' ? config.orderValueRules : config.distanceRules).map((rule, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 group">
                  <input 
                    type="number" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-black" 
                    value={config.type === 'ORDER_VALUE' ? rule.minAmount : rule.minKm} 
                    onChange={e => {
                      const field = config.type === 'ORDER_VALUE' ? 'orderValueRules' : 'distanceRules';
                      const sub = config.type === 'ORDER_VALUE' ? 'minAmount' : 'minKm';
                      const updated = [...config[field]];
                      updated[index][sub] = Number(e.target.value);
                      setConfig({...config, [field]: updated});
                    }}
                  />
                  <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                  <input 
                    type="number" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-black" 
                    value={config.type === 'ORDER_VALUE' ? rule.maxAmount : rule.maxKm} 
                    onChange={e => {
                      const field = config.type === 'ORDER_VALUE' ? 'orderValueRules' : 'distanceRules';
                      const sub = config.type === 'ORDER_VALUE' ? 'maxAmount' : 'maxKm';
                      const updated = [...config[field]];
                      updated[index][sub] = Number(e.target.value);
                      setConfig({...config, [field]: updated});
                    }}
                  />
                  <div className="relative flex-shrink-0 w-24">
                     <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7e2827]">₹</span>
                     <input 
                      type="number" 
                      className="w-full pl-5 pr-2 py-2.5 rounded-xl border border-[#7e2827]/20 bg-white text-xs font-black text-[#7e2827] outline-none" 
                      value={rule.fee} 
                      onChange={e => {
                        const field = config.type === 'ORDER_VALUE' ? 'orderValueRules' : 'distanceRules';
                        const updated = [...config[field]];
                        updated[index].fee = Number(e.target.value);
                        setConfig({...config, [field]: updated});
                      }}
                    />
                  </div>
                  <button onClick={() => {
                      const field = config.type === 'ORDER_VALUE' ? 'orderValueRules' : 'distanceRules';
                      setConfig({ ...config, [field]: config[field].filter((_, i) => i !== index) });
                    }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-6 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all flex justify-center items-center gap-3 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Deploy Changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryConfig;
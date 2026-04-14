import React from 'react';
import { 
  ShieldCheck, 
  Database, 
  Eye, 
  MapPin, 
  Lock, 
  UserCheck, 
  Mail, 
  ExternalLink 
} from 'lucide-react';

const PrivacyPolicyView = () => {
  const lastUpdated = "April 13, 2026";

  const privacySections = [
    {
      id: 1,
      icon: <Database size={20} />,
      title: "Information We Collect",
      points: [
        "Personal Data: Name, phone number, and delivery address.",
        "Transaction Data: Order history and secure payment tokens.",
        "Device Data: IP address and app usage behavior for optimization.",
        "Location: Precise data to ensure accurate delivery tracking."
      ]
    },
    {
      id: 2,
      icon: <Eye size={20} />,
      title: "Data Utilization",
      points: [
        "To process and facilitate lightning-fast deliveries.",
        "To provide 24/7 customer support via Kuruvi channels.",
        "To detect and prevent fraudulent transactions or misuse."
      ]
    },
    {
      id: 3,
      icon: <Lock size={20} />,
      title: "Sharing & Security",
      points: [
        "We never sell your personal data to third-party advertisers.",
        "Data is shared only with delivery partners and secure gateways.",
        "Industry-standard encryption is used for all data at rest."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans bg-white min-h-screen">
      {/* Policy Header */}
      <div className="bg-[#7e2827] p-12 rounded-[3rem] text-white mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Database size={180} />
        </div>
        
        <div className="relative z-10">
          <span className="text-white/60 font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">Legal Framework</span>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
            Privacy <br/> <span className="text-white/40">Protocol</span>
          </h1>
          <p className="text-white/70 text-sm font-medium max-w-lg leading-relaxed">
            At Kuruvi Q Commerce, we treat your data with the same speed and care as your orders. 
            Learn how we protect your digital footprint.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 gap-8">
        {privacySections.map((section) => (
          <div key={section.id} className="group border-b border-slate-100 pb-8 last:border-0">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-slate-900 rounded-2xl text-white group-hover:bg-[#7e2827] transition-colors shadow-sm">
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-black uppercase tracking-tight mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-500 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7e2827] mt-1.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action/Contact Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck size={18} className="text-[#7e2827]" />
            <p className="text-[10px] font-black uppercase text-black">Your Rights</p>
          </div>
          <p className="text-xs text-slate-500 mb-4">Access, correct, or request deletion of your data anytime.</p>
          <a href="mailto:kuruviqcommerce@gmail.com" className="text-xs font-bold underline decoration-[#7e2827] decoration-2 underline-offset-4">
            Contact Data Officer
          </a>
        </div>

        <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
          <div className="flex items-center gap-3 mb-2">
            <ExternalLink size={18} className="text-white/50" />
            <p className="text-[10px] font-black uppercase">Official Links</p>
          </div>
          <p className="text-xs text-white/50 mb-4">Visit our official portal for the full legal disclosure.</p>
          <a href="https://kuruvikal.com" className="text-xs font-bold text-white hover:text-slate-300 transition-colors">
            kuruvikal.com →
          </a>
        </div>
      </div>

      <p className="mt-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
        Last Revised: {lastUpdated}
      </p>
    </div>
  );
};

export default PrivacyPolicyView;
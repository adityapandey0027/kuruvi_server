import React from 'react';
import { ShieldCheck, Truck, Clock, AlertCircle, Award, CheckCircle2 } from 'lucide-react';

const DriverPolicyView = () => {
  const lastUpdated = "July 24, 2025";

  const sections = [
    {
      id: 1,
      icon: <Award size={20} />,
      title: "Eligibility Criteria",
      content: [
        "Comply with local traffic laws and delivery regulations at all times.",
        "Possess and maintain a valid, active Driver's License.",
        "Maintain a functional smartphone with the Kuruvi Partner App installed."
      ]
    },
    {
      id: 2,
      icon: <Truck size={20} />,
      title: "Registration & Onboarding",
      content: [
        "Complete the digital onboarding process via the Partner App.",
        "Provide accurate personal and vehicle documentation for verification.",
        "Agree to adhere to this policy and our general Terms of Service."
      ]
    },
    {
      id: 3,
      icon: <ShieldCheck size={20} />,
      title: "Conduct and Professionalism",
      content: [
        "Be polite, respectful, and courteous to customers and store staff.",
        "Avoid aggressive behavior, misconduct, or use of offensive language.",
        "Strictly abstain from alcohol, tobacco, or drugs during duty hours.",
        "Refrain from smoking during pickups, delivery, or while on customer premises."
      ]
    },
    {
      id: 4,
      icon: <Clock size={20} />,
      title: "Delivery Standards",
      content: [
        "Deliver items promptly and within the promised timeframe.",
        "Contact support immediately for route issues, OTP mismatches, or customer non-availability.",
        "Maintain a minimum acceptance rate to stay in the Active fleet status.",
        "Mark an order as 'Delivered' only after physical handover."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans bg-slate-50 min-h-screen">
      {/* Policy Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ShieldCheck size={160} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#7e2827] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Official Policy</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">v.2.0.4</span>
          </div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none mb-4">
            Delivery Partner <br/> <span className="text-[#7e2827]">Conduct & Terms</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
            As a Kuruvi delivery partner, you are the face of our logistics network. This policy outlines the standards required to maintain a safe and reliable ecosystem.
          </p>
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Clock size={14} /> Last Updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* Policy Content Blocks */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-[#7e2827]/20 transition-all group">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl text-black group-hover:bg-[#7e2827] group-hover:text-white transition-colors shadow-inner">
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="text-[#7e2827] opacity-30 italic">0{section.id}.</span> {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.content.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium leading-snug">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        {/* Termination / Warning Clause */}
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] flex items-start gap-5">
           <AlertCircle className="text-rose-500 flex-shrink-0" size={24} />
           <div>
              <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Enforcement & Compliance</h4>
              <p className="text-xs text-rose-700/70 font-bold leading-relaxed">
                Repeated delays, unverified cancellations, or customer misconduct can lead to immediate account suspension or permanent deactivation from the Kuruvi network.
              </p>
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center pb-12">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Kuruvi Q-Commerce © 2026 • Legal Department
        </p>
      </div>
    </div>
  );
};

export default DriverPolicyView;
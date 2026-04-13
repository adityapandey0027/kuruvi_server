import React from 'react';
import { ShieldCheck, ShoppingBag, CreditCard, RefreshCcw, Info, CheckCircle2 } from 'lucide-react';

const CustomerPolicyView = () => {
  const lastUpdated = "April 13, 2026";

  const sections = [
    {
      id: 1,
      icon: <ShoppingBag size={20} />,
      title: "Ordering & Pricing",
      content: [
        "All orders are subject to real-time stock availability.",
        "Delivery fees are calculated based on your specific logistics zone.",
        "Promotional codes must be applied before final payment."
      ]
    },
    {
      id: 2,
      icon: <CreditCard size={20} />,
      title: "Payments & Refunds",
      content: [
        "Secure digital payments via UPI, Cards, and Net Banking.",
        "Refunds for cancelled orders are initiated instantly to the original source.",
        "COD is subject to availability in your specific pincode."
      ]
    },
    {
      id: 3,
      icon: <RefreshCcw size={20} />,
      title: "Cancellation Policy",
      content: [
        "Cancellations are permitted until the order reaches 'Confirmed' status.",
        "A 100% cancellation fee applies to perishables once prepared.",
        "Returns are accepted for damaged or incorrect items upon delivery."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans bg-white min-h-screen">
      {/* Policy Header */}
      <div className="bg-slate-900 p-12 rounded-[3rem] text-white mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <ShieldCheck size={180} />
        </div>
        
        <div className="relative z-10">
          <span className="text-[#7e2827] font-black text-[10px] uppercase tracking-[0.3em] mb-4 block">Terms of Service</span>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
            Customer <br/> <span className="text-slate-400">Policies</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
            By using the Kuruvi platform, you agree to our terms regarding order fulfillment, payments, and user conduct.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.id} className="group border-b border-slate-100 pb-8 last:border-0">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl text-black group-hover:bg-[#7e2827] group-hover:text-white transition-all shadow-sm">
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-black uppercase tracking-tight mb-4">
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  {section.content.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-slate-500 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Support Note */}
        <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Info className="text-[#7e2827]" />
                <div>
                    <p className="text-[10px] font-black uppercase text-black">Need Clarification?</p>
                    <p className="text-xs font-bold text-slate-400">Contact our 24/7 legal support team via the help center.</p>
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase">Updated: {lastUpdated}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerPolicyView;
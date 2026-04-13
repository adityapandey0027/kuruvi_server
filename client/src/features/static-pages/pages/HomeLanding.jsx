import React from 'react';
import { ShoppingBag, Truck, ShieldCheck, ArrowRight, Zap, MapPin, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeLanding = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-black">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="flex justify-between items-center px-8 py-6 sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl italic">K</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Kuruvi</h1>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <a href="#features" className="hover:text-[#7e2827] transition-colors">How it works</a>
          <Link to="/legal/customer-policy" className="hover:text-[#7e2827] transition-colors">Privacy</Link>
        </div>

      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative px-8 py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#7e2827]/5 border border-[#7e2827]/10 px-4 py-2 rounded-full mb-6">
              <Zap size={14} className="text-[#7e2827] animate-pulse" />
              <span className="text-[10px] font-black text-[#7e2827] uppercase tracking-[0.2em]">Ultra-Fast Q-Commerce</span>
            </div>
            <h2 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              Daily Essentials <br />
              <span className="text-[#7e2827]">In 10 Minutes.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed mb-10">
              Fresh groceries, snacks, and household needs delivered to your doorstep before you even finish your coffee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-slate-100 p-2 rounded-[2rem] flex items-center gap-4 border border-slate-200 shadow-inner">
                <MapPin className="ml-4 text-slate-400" size={20} />
                <input type="text" placeholder="Enter your delivery location" className="bg-transparent outline-none text-sm font-bold w-full" />
                <button className="bg-black text-white p-4 rounded-[1.5rem] hover:bg-[#7e2827] transition-all">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-50 rounded-[4rem] aspect-square relative overflow-hidden border border-slate-100 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-80" 
                alt="Grocery Hero"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            </div>
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl flex items-center gap-4 animate-bounce">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                <Truck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Average Delivery</p>
                <p className="text-lg font-black italic">09:54 MINS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY PREVIEW */}
      <section className="px-8 py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[10px] font-black text-[#7e2827] uppercase tracking-[0.3em] mb-2">Shop by</p>
              <h3 className="text-4xl font-black uppercase tracking-tighter">Popular Categories</h3>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-[#7e2827] hover:border-[#7e2827] transition-all">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {['Fruits', 'Dairy', 'Snacks', 'Beverages', 'Pantry', 'Baby Care'].map((cat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 hover:border-[#7e2827] hover:-translate-y-2 transition-all cursor-pointer group text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:bg-[#7e2827]/5 transition-colors">
                  <ShoppingBag className="text-slate-300 group-hover:text-[#7e2827]" size={28} />
                </div>
                <p className="text-xs font-black uppercase tracking-tight">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DRIVER/PARTNER RECRUITMENT */}
      <section className="px-8 py-20">
        <div className="max-w-7xl mx-auto bg-black rounded-[4rem] p-12 lg:p-20 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            <div>
              <h3 className="text-white text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                Earn while you <br />
                <span className="text-[#7e2827]">Deliver Freedom.</span>
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-8 max-w-sm">
                Join our elite fleet of delivery partners. Flexible hours, instant payouts, and a supportive community.
              </p>
              <div className="flex gap-4">
                <Link to="/legal/driver-policy" className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7e2827] hover:text-white transition-all">
                  Join the Fleet
                </Link>
                <div className="flex items-center gap-2 text-white text-[9px] font-black uppercase">
                  <Smartphone size={16} /> Download Partner App
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
               <div className="w-full h-80 border-2 border-white/10 rounded-[3rem] flex items-center justify-center">
                  <Truck size={100} className="text-white/10" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="px-8 py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
          <div className="col-span-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Kuruvi</h1>
            <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
              Redefining local commerce through speed, transparency, and high-quality logistics. Experience the future of shopping.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-[#7e2827]">Company</h4>
            <ul className="space-y-4 text-xs font-bold text-slate-500">
              <li><Link to="/legal/customer-policy">Terms of Service</Link></li>
              <li><Link to="/legal/driver-policy">Privacy Policy</Link></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-[#7e2827]">Quick Links</h4>
            <ul className="space-y-4 text-xs font-bold text-slate-500">
              <li><a href="#">Support Center</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          <p>© 2026 Kuruvi Q-Commerce. All rights reserved.</p>
          <div className="flex gap-6">
            <ShieldCheck size={16} />
            <span>Geo-Verified Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeLanding;
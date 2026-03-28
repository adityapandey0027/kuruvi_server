import React from 'react';

const StatCard = ({ label, value, color = 'blue-500', icon }) => {
  // Mapping the border and background colors based on the color prop
  const borderColor = `border-${color}`;
  const iconBg = `bg-${color}/10`;
  const iconColor = `text-${color}`;

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-[6px] ${borderColor} flex flex-col justify-center transition-all duration-300 hover:shadow-md hover:-translate-y-1`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {value}
          </h3>
        </div>
        
        {/* Icon Container */}
        <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <span className={`text-xl ${iconColor} filter drop-shadow-sm`}>
            {icon}
          </span>
        </div>
      </div>
      
      {/* Optional: Add a small "Trend" indicator later */}
      <div className="mt-4 flex items-center gap-1">
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">
          +12.5%
        </span>
        <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
      </div>
    </div>
  );
};

export default StatCard;
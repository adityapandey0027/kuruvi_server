import React from 'react';
import { Eye, Edit3, Trash2, RotateCcw } from 'lucide-react';

const SubcategoryTable = ({ data, onEdit, onView }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <th className="px-6 py-5 text-center w-12">
               <input type="checkbox" className="rounded border-slate-300 text-[#7e2827]" />
            </th>
            <th className="px-6 py-5 w-16">Id</th>
            <th className="px-6 py-5">Image</th>
            <th className="px-6 py-5">Subcategory</th>
            <th className="px-6 py-5">Category</th>
            <th className="px-6 py-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-5 text-center">
                <input type="checkbox" className="rounded border-slate-300 text-[#7e2827]" />
              </td>
              <td className="px-6 py-5 text-sm font-bold text-slate-400">{index + 1}</td>
              <td className="px-6 py-5">
                <div className="h-14 w-14 rounded-xl bg-white border border-slate-100 p-1 shadow-sm group-hover:scale-110 transition-transform">
                  <img 
                    src={item.image || 'https://via.placeholder.com/100'} 
                    className="w-full h-full object-contain rounded-lg" 
                    alt="subcat" 
                  />
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-[#7e2827]">
                  {item.name}
                </span>
              </td>
              <td className="px-6 py-5">
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                  {item.catename}
                </span>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onView(item)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100">
                    <Eye size={16}/>
                  </button>
                  <button onClick={() => onEdit(item)} className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-md shadow-amber-100">
                    <Edit3 size={16}/>
                  </button>
                  {/* Agar is_deleted check karna hai jaisa old mein tha */}
                  <button className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all shadow-md shadow-rose-100">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubcategoryTable;
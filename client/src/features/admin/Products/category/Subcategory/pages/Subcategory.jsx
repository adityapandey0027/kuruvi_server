import React, { useState, useMemo } from 'react';
import SubcategoryTable from '../components/SubcategoryTable';
import SubcategoryForm from '../components/SubcategoryForm';
import { Plus, LayoutGrid, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Subcategory = () => {
  const [view, setView] = useState('list');
  const [selectedData, setSelectedData] = useState(null);
  
  // Filtering States (As per your screenshot)
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Categories for dropdowns
  const categories = [
    { id: 1, name: 'Special Deals' },
    { id: 2, name: 'Accessories' },
    { id: 3, name: 'Baby Care' }
  ];

  // Dummy Data (Old PHP data logic)
  const [subcategories] = useState([
    { id: 1, name: 'Family Offer', category: 1, catename: 'Special Deals', image: null },
    { id: 2, name: 'Hair Band', category: 2, catename: 'Accessories', image: null },
    { id: 3, name: 'Head Band', category: 2, catename: 'Accessories', image: null },
    { id: 4, name: 'Wrist Bangle', category: 2, catename: 'Accessories', image: null },
    { id: 5, name: 'Ear Rings', category: 2, catename: 'Accessories', image: null },
    // ... add more for pagination testing
  ]);

  // --- LOGIC: Filter & Search ---
  const filteredData = useMemo(() => {
    return subcategories.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.catename.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, subcategories]);

  // --- LOGIC: Pagination & Entries ---
  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfLastItem = currentPage * entriesPerPage;
  const indexOfFirstItem = indexOfLastItem - entriesPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {view === 'list' ? (
        <>
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#7e2827] p-3 rounded-2xl text-white shadow-lg">
                <LayoutGrid size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sub-Categories</h2>
            </div>
            <button 
              onClick={() => setView('add')}
              className="bg-[#128741] hover:bg-[#0e6d34] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Add New
            </button>
          </div>

          {/* TABLE CONTROLS (Same as your screenshot) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Show</span>
                <select 
                  value={entriesPerPage}
                  onChange={(e) => {setEntriesPerPage(Number(e.target.value)); setCurrentPage(1);}}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#7e2827]/10"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm font-bold text-slate-500">entries</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-[#7e2827]/5 w-64 transition-all"
                />
              </div>
            </div>

            {/* Subcategory Table Component */}
            <SubcategoryTable 
              data={currentItems} 
              onEdit={(item) => {setSelectedData(item); setView('edit');}}
              onView={(item) => {setSelectedData(item); setView('view');}}
            />

            {/* PAGINATION FOOTER */}
            <div className="p-6 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} entries
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-[#7e2827] text-white shadow-md' : 'border border-slate-200 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <SubcategoryForm 
          mode={view} 
          data={selectedData} 
          categories={categories}
          onBack={() => setView('list')} 
        />
      )}
    </div>
  );
};

export default Subcategory;
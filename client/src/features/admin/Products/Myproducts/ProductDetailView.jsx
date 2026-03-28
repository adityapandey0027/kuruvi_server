import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Package, Tag, Layers, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../../../api/axios';

const ProductDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await API.get(`/products/product-variant/${id}`);
        setData(res.data.data);
      } catch (err) {
        toast.error("Failed to load details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black uppercase text-xs tracking-widest animate-pulse">Loading Catalog...</div>;
  if (!data) return null;

  const { product, variants } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 p-4 font-sans text-black animate-in fade-in duration-500">
      
      {/* 1. Header Navigation */}
      <div className="flex justify-between items-center bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-black">
          <ArrowLeft size={16} /> Inventory List
        </button>
        <button 
          onClick={() => navigate(`/admin/my-products/edit/${product._id}`)}
          className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#7e2827] transition-all"
        >
          <Edit3 size={16} className="inline mr-2" /> Edit Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Product Profile (Left) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 space-y-6 sticky top-6">
            <div className="space-y-1">
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                {product.categoryId?.name || 'Uncategorized'}
              </span>
              <h1 className="text-3xl font-black uppercase leading-tight pt-2">{product.name}</h1>
              <p className="text-sm font-bold text-[#7e2827] uppercase tracking-widest">{product.brand || 'No Brand'}</p>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Tag size={12}/> Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags?.map((t, i) => (
                    <span key={i} className="text-[10px] font-bold text-black bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">#{t}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={12}/> Catalog Status</p>
                <span className={`text-[10px] font-black uppercase ${product.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                   ● {product.isActive ? 'Active In Store' : 'Hidden from Users'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">About Product</p>
               <p className="text-xs text-slate-600 leading-relaxed font-bold">
                 {product.description || "Detailed specifications not provided."}
               </p>
            </div>
          </div>
        </div>

        {/* 3. Variants Grid (Right) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Marketplace Variants ({variants.length})</h3>
          
          <div className="grid grid-cols-1 gap-5">
            {variants.map((v) => (
              <div key={v._id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:shadow-2xl hover:border-black/5 transition-all group overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8">
                  
                  {/* FIX: Image logic to handle Object structure v.images[0].url */}
                  <div className="flex-shrink-0">
                    <div className="h-44 w-44 rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-hidden relative shadow-inner">
                      {v.images && v.images.length > 0 ? (
                        <img 
                          src={v.images[0].url} // Corrected: Mapping url from object
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt="Variant" 
                        />
                      ) : (
                        <ImageIcon size={32} className="m-auto h-full text-slate-200" />
                      )}
                      
                      {v.images?.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/80 text-white text-[9px] font-black px-3 py-1 rounded-full backdrop-blur-md">
                          {v.images.length} PHOTOS
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter">{v.size || 'Base Variant'}</h4>
                        <div className="inline-flex items-center bg-black text-white text-[9px] font-black px-2 py-0.5 rounded mt-2 uppercase tracking-widest">
                          SKU: {v.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MRP PRICE</p>
                        <p className="text-3xl font-black text-emerald-700">₹{v.mrp}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-4 border-y border-slate-50">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Net Weight</p>
                        <p className="text-sm font-black text-black uppercase">{v.weight} {v.unit}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Internal ID</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate uppercase">{v._id.slice(-8)}</p>
                      </div>
                      {/* Sub-gallery for extra images */}
                      <div className="flex -space-x-2 overflow-hidden">
                        {v.images?.slice(1, 4).map((img, i) => (
                           <img key={i} src={img.url} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;
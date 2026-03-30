import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import Pusher from "pusher-js";
import { 
  User, Phone, MapPin, Truck, CheckCircle, 
  Package, ArrowLeft, X, Smartphone, QrCode, Mail, Receipt
} from "lucide-react";
import API from "../../../api/axios";
import { toast } from "react-toastify";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riders, setRiders] = useState([]); // Real riders from backend

  // 1. Google Maps Loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_KEY_HERE" 
  });

  // 2. Fetch Order Data from API
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const { data } = await API.get(`/orders/detail/${id}`);
        setOrder(data.data);
        
        // Agar rider already assigned hai toh initial coordinates set karein
        if(data.data.rider_lat) {
           setDriverLocation({ lat: parseFloat(data.data.rider_lat), lng: parseFloat(data.data.rider_lng) });
        }
      } catch (err) {
        toast.error("Order details not found");
        // navigate("/admin/inhouse-orders");
      }
    };

    const fetchAvailableRiders = async () => {
        try {
            const { data } = await API.get('/riders/available');
            setRiders(data.data || []);
        } catch (err) { console.error("Rider fetch error", err); }
    };

    fetchOrderData();
    fetchAvailableRiders();
  }, [id]);

  // 3. Pusher Real-time Tracking
  useEffect(() => {
    if (!id) return;
    const pusher = new Pusher('cbb209a4f378b1367685', { cluster: 'ap2' });
    const channel = pusher.subscribe(`rider-location-${id}`);
    
    channel.bind('update', (data) => {
      const pos = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
      setDriverLocation(pos);
      
      if (window.google && order) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
          origin: pos,
          destination: { lat: order.drop_lat, lng: order.drop_lng },
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === "OK") setDirections(result);
        });
      }
    });

    return () => {
        pusher.unsubscribe(`rider-location-${id}`);
        channel.unbind_all();
    };
  }, [id, order]);

  if (!order) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7e2827] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Logistics Database...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans text-black">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-black">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-black uppercase tracking-tight">Order #{order.id}</h2>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${order.delivery_status === 4 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {order.delivery_status === 4 ? 'Delivered' : 'In-Transit'}
                </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Timeline: {order.created_date}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {order.delivery_status !== 4 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-[#7e2827] transition-all flex items-center gap-2"
            >
              <Truck size={14} /> Re-Assign Rider
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INFORMATION */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* INFO CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <User className="absolute -right-4 -bottom-4 text-slate-50 group-hover:scale-110 transition-transform duration-700" size={120} />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                Customer Profile
              </h3>
              <div className="space-y-3 relative z-10">
                <p className="text-lg font-black text-black uppercase tracking-tight">{order.user_name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2 font-bold"><Phone size={14} className="text-[#7e2827]"/> {order.phone}</p>
                <p className="text-xs text-slate-400 flex items-center gap-2 font-bold"><Mail size={14} className="text-[#7e2827]"/> {order.email}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                Dispatch Destination
              </h3>
              <div className="flex gap-3">
                 <div className="p-2 bg-rose-50 rounded-xl h-fit text-rose-500"><MapPin size={20} /></div>
                 <p className="text-sm text-slate-600 font-black leading-relaxed uppercase">
                    {order.address}
                 </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{order.warehouse_name}</p>
                <span className="text-[8px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-400">GEO VERIFIED</span>
              </div>
            </div>
          </div>

          {/* ITEM LIST TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <Package size={16} className="text-[#7e2827]"/> Consignment Details
                </h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Manifest Item</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Taxable Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-black uppercase tracking-tight">{item.pname}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{item.pack_size}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500">₹{item.product_price}</td>
                    <td className="px-6 py-5 text-center"><span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black">x{item.product_quantity}</span></td>
                    <td className="px-8 py-5 text-sm font-black text-black text-right tracking-tight">₹{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: MAP & BILLING */}
        <div className="space-y-8">
          
          {/* TRACKING MAP CARD */}
          <div className="bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-sm h-[380px] relative overflow-hidden group">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1.8rem' }}
                center={driverLocation || { lat: order.drop_lat, lng: order.drop_lng }}
                zoom={14}
                options={{ 
                    disableDefaultUI: true,
                    styles: [{ featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#000000" }] }] 
                }}
              >
                {/* User Drop Location */}
                <Marker position={{ lat: order.drop_lat, lng: order.drop_lng }} label="🏠" />
                
                {/* Rider Live Position */}
                {driverLocation && (
                    <Marker 
                        position={driverLocation} 
                        icon={{
                            url: "https://cdn-icons-png.flaticon.com/512/713/713437.png", // Delivery Icon
                            scaledSize: new window.google.maps.Size(40, 40)
                        }} 
                    />
                )}
                
                {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: "#7e2827", strokeWeight: 4 } }} />}
              </GoogleMap>
            ) : <div className="h-full bg-slate-100 animate-pulse rounded-[1.8rem]"></div>}
            
            <div className="absolute top-6 left-6 bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black shadow-2xl uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div> Live Tracking
            </div>
          </div>

          {/* BILLING SUMMARY - MODERN DARK THEME */}
          <div className="bg-black text-white p-8 rounded-[3rem] shadow-2xl shadow-slate-300 relative overflow-hidden group">
            <Receipt className="absolute -right-6 -top-6 text-white/5 group-hover:rotate-12 transition-transform duration-700" size={150} />
            
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Payment Invoice</h3>
                <span className="text-[9px] font-black bg-[#7e2827] px-3 py-1 rounded-full uppercase tracking-tighter">{order.payment_option}</span>
            </div>

            <div className="space-y-5 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Order Total</span>
                <span className="font-black text-lg">₹{order.totalsubtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Logistics Fee</span>
                <span className="text-emerald-400 font-black text-[10px] uppercase bg-emerald-400/10 px-2 py-1 rounded-lg">Complimentary</span>
              </div>
              
              <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Settlement Amount</span>
                    <p className="text-3xl font-black tracking-tighter mt-1">₹{order.total}</p>
                </div>
                <div className="p-2 bg-white rounded-2xl">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Kuruvi-${order.id}`} alt="QR" className="w-14 h-14 mix-blend-multiply" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RE-ASSIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-black uppercase tracking-tight flex items-center gap-3 text-sm">
                <Truck size={20} className="text-[#7e2827]" /> Dispatch Control
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-black p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100 shadow-sm">
                <X size={20} />
              </button>
            </div>
            <div className="p-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Available Fleet Members</label>
              <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black text-black outline-none focus:ring-4 focus:ring-[#7e2827]/5 focus:border-[#7e2827]/30 transition-all mb-10 appearance-none uppercase tracking-tight">
                <option>Choose Rider...</option>
                {riders.map(rider => (
                    <option key={rider._id} value={rider._id}>{rider.name} ({rider.area})</option>
                ))}
              </select>
              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 rounded-2xl transition-all">Dismiss</button>
                <button onClick={() => { setIsModalOpen(false); toast.info("Rider update request sent"); }} className="flex-1 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-[#7e2827] transition-all">Re-Assign Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
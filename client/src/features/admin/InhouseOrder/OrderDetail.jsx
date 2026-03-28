import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import Pusher from "pusher-js";
import { 
  User, Phone, MapPin, Truck, CheckCircle, 
  Package, ArrowLeft, X, Smartphone, QrCode 
} from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Google Maps Loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_KEY_HERE" // Apni API Key yahan dalein
  });

  useEffect(() => {
    // 2. Dummy Data (PHP logic ke hisaab se)
    const fetchOrder = {
      id: id,
      user_name: "Atul Gautam",
      phone: "+91 9876543210",
      email: "atul@kuruvi.com",
      created_date: "2026-03-28",
      total: "1,250",
      totalsubtotal: "1,100",
      shipping_charge: 0,
      payment_option: "COD",
      ar_status: "1", // Accepted
      delivery_status: 3, // Out for delivery
      address: "Bhopal, MP - 462001",
      warehouse_name: "Kuruvi Darkstore 01",
      qrcode: "qr_1024.png",
      drop_lat: 23.2599,
      drop_lng: 77.4126,
      items: [
        { pname: "Amul Gold Milk", pack_size: "1L", product_price: "64", discount_value: "0", product_quantity: 2, gst: "5%", subtotal: "128" }
      ]
    };
    setOrder(fetchOrder);

    // 3. Pusher Real-time Tracking (Rider Location)
    const pusher = new Pusher('cbb209a4f378b1367685', { cluster: 'ap2' });
    const channel = pusher.subscribe(`rider-location-${id}`);
    
    channel.bind('update', (data) => {
      const pos = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
      setDriverLocation(pos);
      // Route update logic
      if (window.google) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
          origin: pos,
          destination: { lat: fetchOrder.drop_lat, lng: fetchOrder.drop_lng },
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === "OK") setDirections(result);
        });
      }
    });

    return () => pusher.unsubscribe(`rider-location-${id}`);
  }, [id]);

  if (!order) return <div className="p-20 text-center font-bold text-slate-400">Loading Order Details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/inhouse-orders" className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-[#7e2827]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Order Details <span className="text-[#7e2827]">#{id}</span></h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Placed on {order.created_date}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {order.delivery_status !== 4 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-200 transition-all flex items-center gap-2"
            >
              <Truck size={14} /> Re-Assign Rider
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INFORMATION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* INFO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <User size={14} className="text-[#7e2827]" /> Customer Info
              </h3>
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">{order.user_name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2 font-medium"><Smartphone size={14}/> {order.phone}</p>
                <p className="text-xs text-slate-400 mt-2 font-medium break-all">{order.email}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <MapPin size={14} className="text-[#7e2827]" /> Delivery Location
              </h3>
              <p className="text-sm text-slate-600 font-bold leading-relaxed">
                {order.address}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-50">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Darkstore: {order.warehouse_name}</p>
              </div>
            </div>
          </div>

          {/* PRODUCT TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4">GST</th>
                  <th className="px-6 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.pname}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.pack_size}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">₹{item.product_price}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800 text-center">{item.product_quantity}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{item.gst}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">₹{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: MAP & SUMMARY */}
        <div className="space-y-6">
          
          {/* TRACKING MAP */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm h-[320px] relative overflow-hidden group">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1rem' }}
                center={driverLocation || { lat: order.drop_lat, lng: order.drop_lng }}
                zoom={14}
                options={{ disableDefaultUI: true }}
              >
                <Marker position={{ lat: order.drop_lat, lng: order.drop_lng }} label="🏠" />
                {driverLocation && <Marker position={driverLocation} label="🛵" />}
                {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
              </GoogleMap>
            ) : <div className="h-full bg-slate-100 animate-pulse rounded-xl"></div>}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm uppercase tracking-widest border border-slate-200">Live Status</div>
          </div>

          {/* BILLING SUMMARY */}
          <div className="bg-[#111827] text-white p-6 rounded-2xl shadow-xl shadow-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Summary</h3>
                <span className="text-[10px] font-black bg-[#7e2827] text-white px-2 py-1 rounded tracking-tighter uppercase">{order.payment_option}</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">Subtotal</span><span className="font-bold font-mono text-white text-lg">₹{order.totalsubtotal}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400 font-medium">Delivery</span><span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">FREE</span></div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Grand Total</span>
                <span className="text-2xl font-black text-white font-mono">₹{order.total}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Packing Slip</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">QR Verified</p>
               </div>
               <div className="p-1.5 bg-white rounded-lg">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=Kuruvi-Order-${id}`} alt="QR" className="w-12 h-12 mix-blend-multiply" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* RE-ASSIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 text-sm">
                <Truck size={16} className="text-[#7e2827]" /> Re-Assign Rider
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Select Available Rider</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#7e2827]/5 transition-all mb-8">
                <option>Choose from list...</option>
                <option value="1">Rider Rahul (Bhopal South)</option>
                <option value="2">Rider Aman (Bhopal East)</option>
              </select>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-[#7e2827] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all">Assign Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
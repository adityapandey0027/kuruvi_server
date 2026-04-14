import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import Pusher from "pusher-js";
import { 
  User, Phone, MapPin, Truck, Package, ArrowLeft, X, Receipt, Mail, Navigation2
} from "lucide-react";
import { toast } from "react-toastify";
import API from '../../../../api/axios';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_KEY_HERE" 
  });

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const { data } = await API.get(`/orders/detail/${id}`);
        setOrder(data.data);
        
        // Initializing map if rider has lat/lng in address or tracking
        if(data.data.address?.lat) {
           setDriverLocation({ lat: data.data.address.lat, lng: data.data.address.lng });
        }
      } catch (err) {
        toast.error("Order details not found");
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

  const handleAssignRider = async () => {
    if(!selectedRider) return toast.warning("Select a rider first");
    try {
        await API.post(`/admin/orders/assign-rider`, { orderId: order.orderId, riderId: selectedRider });
        toast.success("Rider assigned successfully");
        setIsModalOpen(false);
        // Refresh data
        const { data } = await API.get(`/orders/detail/${id}`);
        setOrder(data.data);
    } catch (err) { toast.error("Assignment failed"); }
  }

  if (!order) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7e2827] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Logistics Database...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans text-black p-4">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-black uppercase tracking-tight">Order #{order.orderId}</h2>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-emerald-50 text-emerald-600`}>
                    {order.status.orderStatus}
                </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Created: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7e2827] transition-all flex items-center gap-2"
        >
          <Truck size={14} /> {order.rider?.name ? 'Re-Assign Rider' : 'Assign Rider'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* PROFILE & RIDER INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <User className="absolute -right-4 -bottom-4 text-slate-50" size={120} />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Customer Profile</h3>
              <div className="space-y-2 relative z-10">
                <p className="text-lg font-black uppercase">{order.customer.name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2 font-bold"><Mail size={14}/> {order.customer.email}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <Truck className="absolute -right-4 -bottom-4 text-slate-50" size={120} />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Assigned Personnel</h3>
              <div className="space-y-2 relative z-10">
                <p className="text-lg font-black uppercase">{order.rider.name || "UNASSIGNED"}</p>
                <p className="text-sm text-slate-500 flex items-center gap-2 font-bold">
                    <Phone size={14}/> {order.rider.phone || "Waiting for dispatch..."}
                </p>
              </div>
            </div>
          </div>

          {/* ITEM LIST */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 font-black text-[10px] uppercase">
                <Package size={16} className="inline mr-2 text-[#7e2827]"/> Consignment Items ({order.summary.totalItems})
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Item Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-8 py-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-black uppercase tracking-tight">{item.name || item.pname}</td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500">₹{item.price || item.product_price}</td>
                    <td className="px-6 py-5 text-center"><span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black">x{item.quantity || item.product_quantity}</span></td>
                    <td className="px-8 py-5 text-sm font-black text-right">₹{(item.price || item.product_price) * (item.quantity || item.product_quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TRACKING & INVOICE */}
        <div className="space-y-8">
          <div className="bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-sm h-[380px] relative overflow-hidden">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '1.8rem' }}
                center={driverLocation || { lat: 23.2599, lng: 77.4126 }} // Default to Bhopal if no location
                zoom={14}
                options={{ disableDefaultUI: true }}
              >
                {driverLocation && <Marker position={driverLocation} />}
              </GoogleMap>
            ) : <div className="h-full bg-slate-100 animate-pulse rounded-[1.8rem]"></div>}
            <div className="absolute top-6 left-6 bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Live Tracking</div>
          </div>

          <div className="bg-black text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <Receipt className="absolute -right-6 -top-6 text-white/5" size={150} />
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase">Payment Summary</h3>
                <span className="text-[9px] font-black bg-[#7e2827] px-3 py-1 rounded-full">{order.status.paymentOption}</span>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>ITEMS TOTAL</span>
                <span>₹{order.pricing.itemTotal}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>DELIVERY FEE</span>
                <span>₹{order.pricing.deliveryFee}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black uppercase text-slate-500">Total Payable</span>
                    <p className="text-3xl font-black mt-1">₹{order.pricing.totalAmount}</p>
                </div>
                <div className="bg-white p-1 rounded-lg">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${order.orderId}`} className="w-12 h-12" alt="qr"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RE-ASSIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black uppercase text-sm">Rider Selection</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-10">
              <select 
                value={selectedRider}
                onChange={(e) => setSelectedRider(e.target.value)}
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-black outline-none mb-10 appearance-none uppercase"
              >
                <option value="">Select available rider</option>
                {riders.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 text-[10px] font-black text-slate-400 uppercase">Dismiss</button>
                <button onClick={handleAssignRider} className="flex-1 py-4 bg-black text-white text-[10px] font-black uppercase rounded-2xl">Confirm Dispatch</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
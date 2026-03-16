import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({

  name: String,

  phone: String,

  vehicleType: {
    type: String,
    enum:["bike","cycle"]
  },

  location:{
    type:{
      type:String,
      enum:["Point"],
      default:"Point"
    },
    coordinates:[Number]
  },

  status:{
    type:String,
    enum:["ONLINE","BUSY","OFFLINE"]
  },
  currentOrderId :{
    type : String
  },

  activeOrders:Number

},{
    timestamps : true
});

riderSchema.index({ location:"2dsphere" });

const Rider = mongoose.model("Rider", riderSchema);
export default Rider;
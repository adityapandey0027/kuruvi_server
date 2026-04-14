import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  key: String,
  url: String
}, { _id: false });

const riderSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true,
    unique: true
  },

  age: Number,

  gender: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER"]
  },

  address: {
    fullAddress: String,
    city: String,
    pincode: String
  },

  profileImage: imageSchema,

  documents: {
    aadhaarNumber: String,
    aadhaarImage: imageSchema,

    drivingLicenseNumber: String,
    drivingLicenseImage: imageSchema
  },

  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },

  vehicleType: {
    type: String,
    enum: ["bike", "cycle"]
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0] 
    }
  },

  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null
  },

  activeOrders: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["ONLINE", "BUSY", "OFFLINE"],
    default: "OFFLINE"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  role: {
    type: String,
    default: "rider"
  }

}, { timestamps: true });

// Indexes
riderSchema.index({ location: "2dsphere" });
riderSchema.index({ createdAt: -1 });
riderSchema.index({ name: "text", phone: "text" });

const Rider = mongoose.model("Rider", riderSchema);
export default Rider;
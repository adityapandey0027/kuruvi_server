import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({

  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true
  },

  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Variant",
    required: true 
  },
  // mrp : {
  //   type : Number,
  // },
  price: {
    type: Number,
    required: true 
  },

  stock: {
    type: Number,
    default: 0,
    min: 0 
  },

  reservedStock: {
    type: Number,
    default: 0,
    min: 0 
  },

  batchNumber: {
    type: String,
    default: undefined, 
    trim: true
  },
  
  expiryDate: {
    type: Date,
    default: undefined
  },
  
  lowStockThreshold: {
    type: Number,
    default: 5,
  },

  isAvailable: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

inventorySchema.index({ storeId: 1, variantId: 1 }, { unique: true }); 

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
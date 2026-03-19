import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    sku: {
        type: String,
        unique: true,
        required: true 
    },
    
    barcode: { 
        type: String,
        unique: true,
        sparse: true 
    },
    mrp: { 
        type: Number,
        required: true
    },

    size: String,

    unit: String,

    weight: Number,

    images: [String],
    
    attributes: {
        type: Map,
        of: String
    }

}, { timestamps: true });

variantSchema.index({ productId: 1 }); // Speeds up fetching variants for a product

const Variant = mongoose.model("Variant", variantSchema);

export default Variant;







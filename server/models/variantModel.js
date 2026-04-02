const variantSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    sku: {
        type: String,
        unique: true,
        sparse: true 
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

    images: [
        {
            key: String,
            url: String
        }
    ],

    attributes: {
        type: Map,
        of: String
    }

}, { timestamps: true });

variantSchema.index({ productId: 1 });
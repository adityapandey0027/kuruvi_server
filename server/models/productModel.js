import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    brand: {
        type: String
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    description: {
        type: String
    },
    tags: [String],

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

productSchema.index({ categoryId: 1 }); 

productSchema.index(
    { name: "text", brand: "text", tags: "text" },
    { weights: { name: 10, brand: 5, tags: 2 } }
);

const Product = mongoose.model("Product",productSchema);

export default Product;
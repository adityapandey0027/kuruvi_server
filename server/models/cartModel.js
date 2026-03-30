import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
    items: [{
        variantId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant"
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: Number
    }],
}, {
    timestamps: true
});
cartSchema.index({ userId: 1, storeId: 1 }); 
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 18000 });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
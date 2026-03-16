import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },

  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Variant"
  },

  quantity: Number,

  price: Number

});

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;
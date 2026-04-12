import mongoose from "mongoose";

const deliveryConfigSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["DISTANCE", "ORDER_VALUE"],
        default: "ORDER_VALUE"
    },
    baseFee: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number, default: 0 },
    orderValueRules: [
        {
            minAmount: { type: Number, required: true },
            maxAmount: { type: Number, required: true },
            fee: { type: Number, required: true }
        }
    ],
    distanceRules: [
        {
            minKm: { type: Number, required: true },
            maxKm: { type: Number, required: true },
            fee: { type: Number, required: true }
        }
    ],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

deliveryConfigSchema.index({ isActive: 1 });

const DeliveryConfig = mongoose.model("DeliveryConfig", deliveryConfigSchema);

export default DeliveryConfig;
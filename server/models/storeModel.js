import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
    name: {
        type: String
    },
    city: {
        type: String
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: [Number]
    },
    serviceRadius: {
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{
    timestamps : true
});
storeSchema.index({ location: "2dsphere" });
const Store = mongoose.model("Store", storeSchema);

export default Store;
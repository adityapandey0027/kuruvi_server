import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    brand: {
        type: String,
        default: null
    },

    note: {
        type: String,
        default: null
    },

    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
    }

}, { timestamps: true });

export default mongoose.model("ProductSuggestion", suggestionSchema);
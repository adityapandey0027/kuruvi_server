import mongoose from "mongoose";

const policySchema = new mongoose.Schema({

    type: {
        type: String,
        enum: ["PRIVACY", "TERMS", "REFUND", "ABOUT"],
        required: true,
        unique: true
    },
    receiver :{
        type : String,
        enum : ['user', 'rider', 'store']
    },

    title: {
        type: String,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    version: {
        type: Number,
        default: 1
    },

    isActive: {
        type: Boolean,
        default: true
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }

}, { timestamps: true });


policySchema.index({ type: 1, isActive: 1 });

export default mongoose.model("Policy", policySchema);
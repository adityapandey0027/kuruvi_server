import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
        required: true
    }
}, { timestamps: true });

favoriteSchema.index({ userId: 1, variantId: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
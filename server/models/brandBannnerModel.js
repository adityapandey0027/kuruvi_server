import mongoose from "mongoose";

const brandBannerSchema = new mongoose.Schema({
    image: {
        key: String,
        url: String
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const BrandBanner = mongoose.model("BrandBanner", brandBannerSchema);

export default BrandBanner;
import mongoose from "mongoose";

const homeFirstBannerSchema = new mongoose.Schema({
    image: {
        key: String,
        url: String
    },
    title: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const HomeFirstBanner = mongoose.model("HomeFirstBanner", homeFirstBannerSchema);

export default HomeFirstBanner;
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },

    level: {
        type: Number,
        default: 0
    },

    image: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true

    }
}, {
    timestamps: true
})
categorySchema.index({ parentId: 1 });
const Category = mongoose.model("Category", categorySchema);

export default Category;
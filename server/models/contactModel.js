import mongoose from "mongoose";

const contactConfigSchema = new mongoose.Schema(
{
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: "For any issues, contact our support team."
    },

    whatsapp: {
        type: String
    },

    address: {
        type: String
    },

    workingHours: {
        type: String,
        default: "9 AM - 9 PM"
    },

    isActive: {
        type: Boolean,
        default: true
    }

},
{
    timestamps: true
}
);

contactConfigSchema.index({ isActive: 1 });

const ContactConfig = mongoose.model("ContactConfig", contactConfigSchema);

export default ContactConfig;
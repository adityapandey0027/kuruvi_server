import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "User",
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
      index: true
    },
    email: {
      type: String,
      default: null
    },
    image: [
      {
        key: String,
        url: String
      }
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    oneSignalId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
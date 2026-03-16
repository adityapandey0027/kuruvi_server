import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        default : "User"
    },
    mobile : {
        type : String,
        required : true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'] 
    },
    role : {
        type : String,
        enum : ["user", "admin"],
        default : "user"
    }, 
    oneSignalId : {
        type : String
    }
    
}, { timestamps : true})

userSchema.index({ mobile: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);

export default User;
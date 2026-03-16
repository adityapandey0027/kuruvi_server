import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const conn =await mongoose.connect(process.env.MONGO_URI, {
           dbName : "Kuruvi_app"
        });
        console.log("MongoDB Connected");  
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
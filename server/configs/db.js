import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected'))
        await mongoose.connect(`${process.env.MONGODB_URI}/social-app`)
        
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }   
}

export default connectDB;
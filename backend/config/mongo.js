import mongoose from "mongoose";

const connectDb = async () => {
    try {
        console.log("before Connected to MongoDB");
        await mongoose.connect("mongodb://localhost:27017/fyp-lms");
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB:', error);
    }
}
export default connectDb;
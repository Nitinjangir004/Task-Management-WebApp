import mongoose from "mongoose"

export default async function mongodb() {
    const mongourl = process.env.MONGODB_URL;

    if (!mongourl) {
        throw new Error("MONGODB_URL is not defined in environment variables")
    }

    await mongoose.connect(mongourl);
    console.log("Database connected successfully");
}
import mongoose from "mongoose";
import { config } from "dotenv";
config();
const mongourl= process.env.MONGODB_URL;
export default async function mongodb(){
    try{
        await mongoose.connect(mongourl).then(()=>{console.log("Successfully connected Database")})}
    catch(error){
        console.log("error while connecting db " +error);
    }
}
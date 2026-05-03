import mongoose from "mongoose";

export default async function mongodb(){
    try{
        await mongoose.connect("mongodb+srv://nitinjangir004:DbNikkulinkblue@cluster0.jqwg5.mongodb.net/Task-Management-Webapp"
    ).then(()=>{console.log("Successfully connected Database")})}
    catch(error){
        console.log("error while connecting db " +error);
    }
}
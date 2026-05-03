import mongoose from "mongoose";
// const Objectid = mongoose.Schema.ObjectId;

const userschema = new mongoose.Schema({ 
    email:{
        type:String,
        required:true,
    },
    username :{
        type:String,
        required:true,
    },
    password :{
        type:String
    },

})
const UserModel = mongoose.model("UserModel" , userschema);
export default UserModel;
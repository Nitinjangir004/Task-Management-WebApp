import mongoose from "mongoose";
const Schema = mongoose.Schema;
const Objectid = mongoose.Schema.Types.ObjectId;

const organisationSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    createdBy:{
        ref:'User',
        type:Objectid,
        required:true
    },
    members:[{
        user:{
            ref:'User',
            type:Objectid,
            required:true
        },
        role:{
            type:String,
            enum:['owner', 'admin', 'member'],
            default:"member"
        },
        joinedAt:{
            type:Date,
            default:Date.now
        }
    }],
    inviteToken:{
        type:String
    },
    inviteTokenExpire:{
        type:Date
    }
},{ timestamps: true })

const Organisation = mongoose.model("Organisation" , organisationSchema);
export default Organisation;
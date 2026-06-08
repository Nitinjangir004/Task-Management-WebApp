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
    
    requiresApproval: {
        type: Boolean,
        default: false 
    },

    joinRequests: [{
        user: {
            type: Objectid,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        reviewedBy: {
            type: Objectid,
            ref: 'User',
            default: null
        }
    }],
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
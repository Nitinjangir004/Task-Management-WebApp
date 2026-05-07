import mongoose from "mongoose";
// const Objectid = mongoose.Schema.ObjectId;

const userschema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,      // prevent duplicate emails at DB level
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {        // store refresh token for invalidation
        type: String,
        default: null
    }
}, { timestamps: true })   // adds createdAt, updatedAt automatically
const User = mongoose.model("User" , userschema);
export default User;
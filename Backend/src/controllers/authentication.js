import bcrypt from "bcrypt";
import User from "../model/user.js";
import jsonwebtoken from "jsonwebtoken";
import { config } from "dotenv";
config();
const Accesssecretkey=process.env.ACCESS_SECRET_KEY;
const Refreshsecretkey=process.env.REFRESH_SECRET_KEY;
//Signin
export  const signup = async(req,res)=>{
    try {
        const {username,password} = req.body;
        const email = req.body.email.toLowerCase().trim();

        if(!username||!password||!email){
            return res.status(400).json({
                message:"Username and Password is not found"
            })
        }
        const exist = await User.findOne({email});
        if(exist){
            return res.status(409).json({ message: "Email already exists" })
        }
        else{
            const hashpassword = await bcrypt.hash(password,10)
            const newUser = await User.create({
                username:username,
                email:email,
                password:hashpassword                
            })
            // access token 
            const AccessToken = jsonwebtoken.sign({
                "id":newUser._id,
                email
            },Accesssecretkey,{expiresIn:"15m"});

            //refresh token 
            const RefreshToken = jsonwebtoken.sign({
                "id":newUser._id,
                email
            },Refreshsecretkey,{expiresIn:"7d"});

            newUser.refreshToken = RefreshToken;
            await newUser.save({ validateBeforeSave: false });
            
            res.cookie("refreshToken", RefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000 // 15minutes
            })
            return res.status(201).json({
                sucess:200,
                AccessToken : AccessToken,
                message:"Sign-in completed"
            })
        }
    } 
    catch (error) {
        res.status(500).json({ message: "Something went wrong during signup", error: error.message });
    }
}

// Login 
export const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(500).json({
                 message: "email & password is not found , Please try again "
            })
        }
        const userexist = await User.findOne({email});
        if(!userexist){
            return res.status(400).json({
                message: "Email is not Found , Signup First"
            })
        }else{
            const conform_pass = await bcrypt.compare(password,userexist.password);
            if(!conform_pass){
                return res.status(401).json({
                message: "email & password is not match , Please try again "
            })
            }
            const AccessToken = jsonwebtoken.sign({
                id:userexist._id,
                email:email
            },Accesssecretkey,{expiresIn:"15m"});

            const RefreshToken = jsonwebtoken.sign({
                id:userexist._id,
                email:email
            },Refreshsecretkey,{expiresIn:"7d"});

            userexist.refreshToken = RefreshToken;
            await userexist.save({ validateBeforeSave: false });

            res.cookie("refreshToken", RefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000 // 15minutes
            })
            return res.status(200).json({
               AccessToken:AccessToken,
                message:"Login completed"
            })
        }
    } 
    catch (error) {
         res.status(500).json({ message: "Something went wrong during login", error: error.message });
    }
}

//Refresh Token 

const refresh = async (req,res)=>{
    const refreshToken = req.cookies?.refreshToken;
    if(!refreshToken){
        return res.status(400).json({
            message : ""
        })
         
    } 
    const verify = jsonwebtoken.verify();
}
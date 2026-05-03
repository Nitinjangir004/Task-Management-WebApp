import bcrypt from "bcrypt";
import UserModel from "../model/user.js";
import jsonwebtoken from "jsonwebtoken";
import { config } from "dotenv";
config();
const Accesssecretkey=process.env.ACCESS_SECRET_KEY;
const Refreshsecretkey=process.env.REFRESH_SECRET_KEY;
//Signin
export  const sigin = async(req,res)=>{
    try {
        const {username,email,password} = req.body;

        if(!username||!password||!email){
            return res.status(400).json({
                message:"Username and Password is not found"
            })
        }

        const exist = await UserModel.findOne({email});
        console.log("exit "+exist);
        if(exist){
            return res.json({
                message:"email is already exit "
            })
        }
        else{
            const hashpassword = await bcrypt.hash(password,14,()=>{console.log("password is hashed")})
            await UserModel.create({
                username:username,
                email:email,
                password:hashpassword                
            })
            // access token 
            const AccessToken = await jsonwebtoken.sign({
                "id":UserModel._id,
                email
            },Accesssecretkey,{expiresIn:"15m"});

            //refresh token 
            const RefreshToken = await jsonwebtoken.sign({
                "id":UserModel._id,
                email
            },Refreshsecretkey,{expiresIn:"7d"});
            res.cookie("uid",AccessToken);
            return res.status(200).json({
                sucess:200,
                message:"Sign-in completed"
            })
        }
    } 
    catch (error) {
        res.status(500).json({
             message: error.message 
        })
    }
}

// Login 


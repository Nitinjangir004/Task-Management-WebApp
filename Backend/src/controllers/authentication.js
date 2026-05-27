import bcrypt from "bcrypt";
import User from "../model/user.js";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer"
import { transporter } from "../../utils/mailer.js";
import { config } from "dotenv";
config();
const Accesssecretkey=process.env.ACCESS_SECRET_KEY;
const Refreshsecretkey=process.env.REFRESH_SECRET_KEY;

// otp template 

// A reusable function to generate the HTML email
export const generateOtpEmailTemplate = (otp) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px; background-color: #ffffff;">
      
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f5;">
        <h2 style="color: #1a1a1a; margin: 0; font-size: 24px;">Task Management App</h2>
      </div>
      
      <div style="padding: 30px 0; color: #4a4a4a; line-height: 1.6; font-size: 16px;">
        <p style="margin-top: 0;">Hello,</p>
        <p>Thank you for signing up! To complete your registration and secure your account, please use the following One-Time Password (OTP) to verify your email address.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; background-color: #EEF2FF; padding: 15px 30px; border-radius: 8px; border: 1px solid #C7D2FE;">
            ${otp}
          </span>
        </div>
        
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #71717a;">If you did not request this email, there is nothing you need to do. Simply ignore this message.</p>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f5; color: #a1a1aa; font-size: 12px;">
        <p style="margin: 0;">This is an automated message, please do not reply to this email.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Task Management App. All rights reserved.</p>
      </div>
      
    </div>
  `;
};

//Signup
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
            //password
            const hashpassword = await bcrypt.hash(password,10)

            // node mailer code , to send otp on the provided email
            // Create a transporter using SMTP
            
            //to verify connection 
            try {
                await transporter.verify();
                console.log("Server is ready to take our messages");
            } catch (err) {
                console.error("Verification failed:", err);
            }
            // generate Otp via Math.floor
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            // 2. Set expiration (e.g., 10 minutes from now)
            const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);

            // add the otp , expireDate -- in the User
            const newUser = await User.create({
                username:username,
                email:email,
                password:hashpassword,
                otp:generatedOtp,
                otpExpires:otpExpiryTime
                               
            })
            // send otp via node mailer 
            try {
                const info = await transporter.sendMail({
                    from: `"Task App Team" <${process.env.SMTP_USER}>`, // sender address
                    to: email, // The user's email
                    subject: "Verify Your Email Address - Task App", // Clean, clear subject line
                    
                    // Fallback for ancient email clients or strict firewalls
                    text: `Hello, your email verification code is: ${generatedOtp}. This code expires in 10 minutes.`, 
                    
                    // The beautiful HTML template we just created
                    html: generateOtpEmailTemplate(generatedOtp), 
                });

                console.log("Verification email sent successfully: %s", info.messageId);

                } catch (error) {
                    return res.status(500).json({
                        sucess:false,
                        message:"Somthing Went worng with nodemailer",error: error.message
                    })
                }
            return res.status(200).json({
                sucess:true,
                message:"OTP Send On the Email"
            })
        }
    } 
    catch (error) {
        res.status(500).json({ message: "Something went wrong during signup", error: error.message });
    }
}
export const verifyotp = async(req,res)=>{    
    try {
        const {email,otp} = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        const newUser =await User.findOne({email})
        if (!newUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (newUser.isVerified) {
            return res.status(400).json({ message: "Account is already verified" });
        }
        if(newUser.otp !== otp || newUser.otpExpires < Date.now() ){
            return res.status(400).json({ message: "Invalid or expired OTP and try to resend otp" });
        }
        newUser.isVerified = true;
        newUser.otp = undefined;
        newUser.otpExpires =undefined;
        const AccessToken = jsonwebtoken.sign({
            id:newUser._id,
            email
        },Accesssecretkey,{expiresIn:"15m"});

        //refresh token 
        const RefreshToken = jsonwebtoken.sign({
            id:newUser._id,
            email
        },Refreshsecretkey,{expiresIn:"7d"});

        newUser.refreshToken = RefreshToken;
        await newUser.save({ validateBeforeSave: false });
        
        res.cookie("refreshToken", RefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(201).json({
            sucess:200,
            AccessToken : AccessToken,
            message:"Sign-in completed"
        })
    }
    catch (error) {
        res.status(500).json({ message: "Something went wrong during verifyOTP", error: error.message });
    }
}

// Login 
export const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(400).json({
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
            if (!userexist.isVerified) {
            return res.status(403).json({ 
                success: false,
                isVerified: false,
                message: "Please verify your email before logging in." 
            });
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
                maxAge: 7 * 24 * 60 * 60 * 1000
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

export const refresh = async (req,res)=>{
    try {
        const refreshToken = req.cookies?.refreshToken;
    if(!refreshToken){
        return res.status(400).json({
            message : "Refresh token is missing"
        });
    } 
    let decoded;
    try {
        decoded = jsonwebtoken.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    } catch (err) {
        return res.status(403).json({
            message: "Refresh token is invalid or expired. Please log in again."
        });
    }
    const userexist = await User.findOne({refreshToken:refreshToken});
    if(!userexist){
        return res.status(400).json({
            message : "Refresh token is Incorrect & login Again"
        });
    }
    const AccessToken = jsonwebtoken.sign({
        id:userexist._id,
        email:userexist.email
    },Accesssecretkey,{expiresIn:"15m"});

    const RefreshToken = jsonwebtoken.sign({
        id:userexist._id,
        email:userexist.email
    },Refreshsecretkey,{expiresIn:"7d"});

    userexist.refreshToken = RefreshToken;
    await userexist.save({ validateBeforeSave: false });

    res.cookie("refreshToken", RefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    return res.status(200).json({
        AccessToken:AccessToken,
        message:"New Access and Refresh Token"
    })

    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ 
            message: "Something went wrong during token generation", 
            error: error.message 
        });
    };
}

export const resendotp = async(req,res)=>{
    try {
        const {email} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                sucess:false,
                message:"User not Found"
            })
        }
        if (user.isVerified) {
            return res.status(400).json({ message: "Account is already verified" });
        }
        // generate Otp via Math.floor
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        // 2. Set expiration (e.g., 10 minutes from now)
        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
        try {
            const info = await transporter.sendMail({
                from: `"Task App Team" <${process.env.SMTP_USER}>`, // sender address
                to: email, // The user's email
                subject: "Verify Your Email Address - Task App", // Clean, clear subject line
                
                // Fallback for ancient email clients or strict firewalls
                text: `Hello, your email verification code is: ${generatedOtp}. This code expires in 10 minutes.`, 
                
                // The beautiful HTML template we just created
                html: generateOtpEmailTemplate(generatedOtp), 
            });
            console.log("Verification email sent successfully: %s", info.messageId);
            } 
        catch (error) {
            return res.status(500).json({
                sucess:false,
                message:"Somthing Went worng with nodemailer",error: error.message
            })
        }
        user.otp= generatedOtp;
        user.otpExpires= otpExpiryTime;
        await user.save({validateBeforeSave:false});
        return res.status(200).json({
            sucess:true,
            message:"OTP Send On the Email"
        })

    } catch (error) {
       res.status(500).json({ message: "Something went wrong during resendotp", error: error.message }); 
    }
}
import bcrypt from "bcrypt";
import User from "../model/user.js";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer"
import { transporter } from "../../utils/mailer.js";
import { generateOtpEmailTemplate ,generateWelcomeEmailTemplate } from "../../utils/mailtemplate.js";
const Accesssecretkey=process.env.ACCESS_SECRET_KEY;
const Refreshsecretkey=process.env.REFRESH_SECRET_KEY;
const ResetTokenkey=process.env.RESET_SECRET_KEY;


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
                    from: `"Flowship Team" <${process.env.SMTP_USER}>`, // sender address
                    to: email, // The user's email
                    subject: "Verify Your Email Address - Flowship", // Clean, clear subject line
                    
                    // Fallback for ancient email clients or strict firewalls
                    text: `Hello, your email verification code is: ${generatedOtp}. This code expires in 10 minutes.`, 
                    
                    // The beautiful HTML template we just created
                    html: generateOtpEmailTemplate(generatedOtp,true), 
                });

                console.log("Verification email sent successfully: %s", info.messageId);

                } catch (error) {
                    return res.status(500).json({
                        success:false,
                        message:"Somthing Went worng with nodemailer",error: error.message
                    })
                }
            return res.status(200).json({
                success:true,
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

        res.cookie("accessToken", AccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000  // 15 minutes
        })
        
        res.cookie("refreshToken", RefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        await transporter.sendMail({
            from: `"Flowship Team" <${process.env.SMTP_USER}>`,
            to: newUser.email,
            replyTo: process.env.REPLY_TO,
            subject: "Welcome to Flowship 🚀",
            html: generateWelcomeEmailTemplate(newUser.username)
        })

        return res.status(201).json({
            success:200,
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
                id:userexist._id.toString(),
                email:email
            },Accesssecretkey,{expiresIn:"15m"});

            const RefreshToken = jsonwebtoken.sign({
                id:userexist._id,
                email:email
            },Refreshsecretkey,{expiresIn:"7d"});

            userexist.refreshToken = RefreshToken;
            await userexist.save({ validateBeforeSave: false });

            res.cookie("accessToken", AccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000  // 15 minutes
            })
            res.cookie("refreshToken", RefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            return res.status(200).json({
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

    res.cookie("accessToken", AccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000  // 15 minutes
    })

    res.cookie("refreshToken", RefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    return res.status(200).json({
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
                success:false,
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
                from: `"Flowship Team" <${process.env.SMTP_USER}>`, // sender address
                to: email, // The user's email
                replyTo: process.env.REPLY_TO,
                subject: "Verify Your Email Address - Flowship", // Clean, clear subject line
                
                // Fallback for ancient email clients or strict firewalls
                text: `Hello, your email verification code is: ${generatedOtp}. This code expires in 10 minutes.`, 
                
                // The beautiful HTML template we just created
                html: generateOtpEmailTemplate(generatedOtp,true), 
            });
            console.log("Verification email sent successfully: %s", info.messageId);
            } 
        catch (error) {
            return res.status(500).json({
                success:false,
                message:"Somthing Went worng with nodemailer",error: error.message
            })
        }
        user.otp= generatedOtp;
        user.otpExpires= otpExpiryTime;
        await user.save({validateBeforeSave:false});
        return res.status(200).json({
            success:true,
            message:"OTP Send On the Email"
        })

    } catch (error) {
       res.status(500).json({ message: "Something went wrong during resendotp", error: error.message }); 
    }
}
//forgetpassword
export const forgetPassword = async(req,res)=>{
    try {
        const {email} = req.body;
        if(!email){
            return res.status(400).json({
                success:false,
                message:"Email not found"
            })
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                success:false,
                message:"Email not found"
            })
        }
        // generate Otp via Math.floor
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        // 2. Set expiration (e.g., 10 minutes from now)
        const otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
        try {
            const info = await transporter.sendMail({
                from: `"Flowship Team" <${process.env.SMTP_USER}>`,
                to: email,
                subject: "Reset Password OTP - Flowship",
                text: `Hello, your reset password verification code is: ${generatedOtp}. This code expires in 10 minutes.`, 
                html: generateOtpEmailTemplate(generatedOtp,false), 
            });
            console.log("Verification email sent successfully: %s", info.messageId);
        } 
        catch (error) {
            return res.status(500).json({
                success:false,
                message:"Somthing Went worng with nodemailer",error: error.message
            })
        }
        //check again
        user.passwordresetotp = generatedOtp;
        user.passwordresetotpExpire = otpExpiryTime;
        await user.save({validateBeforeSave:false});
        return res.status(200).json({
            success: true,
            message: "OTP sent to your email"
        })

    } catch (error) {
      return res.status(500).json({ message: "Something went wrong during forgetpassword", error: error.message });   
    }
}
// /verify-reset-otp
export const VerifyResetOtp = async (req,res)=>{
    try {
        const {email ,otp} = req.body;
        if(!email || !otp || otp.length !== 6){
            return res.status(400).json({
                message:"otp not found or email is invalid"
            })
        }
        const newUser =await User.findOne({email})
        if (!newUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if(newUser.passwordresetotp !== otp || newUser.passwordresetotpExpire < Date.now() ){
            return res.status(400).json({ message: "Invalid or expired OTP and try to again forgetpassword" });
        }
        
        const resettoken = jsonwebtoken.sign({
            id:newUser._id.toString(),
            email:newUser.email
        },ResetTokenkey,{expiresIn:"15m"});
        newUser.passwordresetotp = undefined;
        newUser.passwordresetotpExpire =undefined;
        newUser.resettoken = resettoken;
        await newUser.save({validateBeforeSave:false});
        return res.status(200).json({
            success:true,
            resettoken :resettoken,
            message:"this is resettoken vaild for 15 min"
        })
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong during VerifyResetOtp", error: error.message });
    }
}
//reset-password
export const resetpassword = async(req,res)=>{
    try {
        const {email ,resettoken,password} = req.body;
        if(!email||!resettoken||!password){
            return res.status(400).json({
                    message: "email & password is not found , Please try again "
            })
        }
        const userexist = await User.findOne({email});
        if(!userexist){
            return res.status(400).json({
                message: "Email is not Found , Signup First"
            })
        }
        
        let verify
        try {
            verify = jsonwebtoken.verify(resettoken, ResetTokenkey)
        } catch {
            return res.status(401).json({ message: "Reset token is invalid or expired" })
        }
        const hashpassword =await bcrypt.hash(password,10);
        userexist.password =hashpassword;
        userexist.resettoken= undefined;
        userexist.refreshToken= undefined;
        await userexist.save({validateBeforeSave:false});
        return res.status(200).json({
            success:true,
            message:"Password has change ,please login"
        })

    } catch (error) {
      return res.status(500).json({ message: "Something went wrong during reset-password", error: error.message });  
    }
}

// logout 

export const logout = async (req, res) => {
    try {
        const accessToken = req.cookies?.accessToken
        const refreshToken = req.cookies?.refreshToken
        if (refreshToken) {
            await User.findOneAndUpdate(
                { refreshToken },
                { refreshToken: null }
            )
        }
        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Logout failed",
            error: error.message
        })
    }
}
import User from "../model/user.js";

export const getme = async(req,res)=>{
    try {
        const userid = req.user.id;
    if(!userid){
        return res.status(400).json({
            success:false,
            message:"user not found in db , please signup & login"
        })
    }
    const currentUser = await User.findById({userid});
    if(!currentUser){
        return res.status(400).json({
            success:false,
            message:"user not found in db , please signup & login"
        })
    }
    return res.status(200).json({
        suucess:true,
        message:"This is Your Details",
        username:currentUser.username,
        email:currentUser.email,
    })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"server getting error",
            error:error.message
        })
    }
}
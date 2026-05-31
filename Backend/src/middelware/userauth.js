import jsonwebtoken from "jsonwebtoken";

const Accesssecretkey=process.env.ACCESS_SECRET_KEY;
export const auth = async(req,res,next)=>{
    try {
        const accessToken = req.cookies?.accessToken
    if(!accessToken){
        return res.status(402).json({
            sucess:false,
            message:"Access token not found"
        })
    }
    const verify = await jsonwebtoken.verify(accessToken,Accesssecretkey);
    if(!verify){
        return res.status(402).json({
            sucess:false,
            message:"Access token is wrong , please login again"
        })
    }
    req.user = verify;
    next();
    } catch (error) {
        return res.status(500).json({
            sucess:false,
            message:"Server failure",
            error:error.message
        })
    }
}
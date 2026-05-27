export const auth = async(req,res,next)=>{
    const {AccessToken} = req.body;
    if(!AccessToken){
        return res.status(402).json({
            sucess:false,
            message:"Access token not found"
        })
    }
}
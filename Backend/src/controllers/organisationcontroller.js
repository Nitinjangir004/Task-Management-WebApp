import Organisation from "../model/organisation.js";
import User from "../model/user.js";

// Create organisation
export const createOrg = async (req,res)=>{
    try {
        const userid = req.user.id;
        const {name,description,member}= req.body;
        if(!userid){
            return res.status(400).json({
                success:false,
                message:'User id not found'
            })
        }
        const User = await User.findone(userid);
        if(!name){
            return res.status(400).json({
                success:false,
                message:'name not found'
            })    
        }
        const Organisation =await Organisation.create({
            name:name,
            description:description,
            member:member,
            createdBy:userid
        })
        return res.status(200).json({
            success:true,
            message:"Orignation is Created Successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server error",
            error:error.message
        })
    }
}
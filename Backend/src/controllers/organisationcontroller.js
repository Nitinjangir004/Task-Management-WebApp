import crypto from 'crypto'
import Organisation from "../model/organisation.js";
import User from "../model/user.js";
// Create organisation -- done
// Generate invite token -- done
// Request Approval -- not done
// Join via invite link -- not done
// Get organisation details -- not done
// List members -- not done
// Remove member -- not done
// Regenerate invite token -- not done


// Create organisation
export const createOrg = async (req,res)=>{
    try {
        const userid = req.user.id;
        const {name,description}= req.body;
        if(!userid){
            return res.status(400).json({
                success:false,
                message:'User id not found'
            })
        }
        if(!name){
            return res.status(400).json({
                success:false,
                message:'name not found'
            })    
        }
        const Organisation =await Organisation.create({
            name:name,
            description:description,
            member:[{
                user: userid,
                role: 'owner',
            }],
            createdBy:userid
        })
        return res.status(201).json({
            success:true,
            message:"Orignation is Created Successfully",
            OrganisationID:Organisation._id,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"organisation create time Server error",
            error:error.message
        })
    }
}


// create the inviteToken 
// route → /org/:orgId/invite
export const generateInviteToken = async(req,res)=>{
    try {
        const userid = req.user.id;
        const {OrgID} = req.params;
        if(!userid){
            return res.status(400).json({
                success:false,
                message:'User id not found'
            })
        }
        if(!OrgID){
            return res.status(400).json({
                success:false,
                message:'User id not found'
            })
        }
        const validOrgansiation =await Organisation.findById(OrgID);
        if(!validUser){
            return res.status(400).json({
                success:false,
                message:"user not found in db , please signup & login"
            })
        }
        if(!validOrgansiation){
            return res.status(400).json({
                success:false,
                message:"organisation not found in db , please create"
            })
        }
        // Check role in members array
        const userMember = validOrgansiation.members.find(
            m => m.user.equals(userid)
        )
        if(!userMember || !['owner', 'admin'].includes(userMember.role)){
            return res.status(403).json({
                success: false,
                message: "Only owner or admin can generate invite link"
            })
        }
        // Generate token
        const inviteToken = crypto.randomBytes(20).toString('hex');

        // Set expiry — 7 days
        const inviteTokenExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        validOrgansiation.inviteToken= inviteToken;
        validOrgansiation.inviteTokenExpire= inviteTokenExpire;
        await validOrgansiation.save({validateBeforeSave:false});
        const inviteLink = `${process.env.CLIENT_URL}/join/${inviteToken}`;
        return res.status(201).json({
            success:true,
            message:"Invite Link is created",
            Link :inviteLink,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server error while generating invite token",
            error:error.message
        })
    }
}

// creating Join Organisation

export const joinOrg = async (req,res)=>{
    const userid = req.user.id;
    const invitetoken = req.body;
    if(!invitetoken){
        return res.status(403).json({
            success:false,
            message:"invite Token is not found "
        })
    }
    
}
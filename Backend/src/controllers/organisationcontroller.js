import crypto from 'crypto'
import Organisation from "../model/organisation.js";
import User from "../model/user.js";

// Create organisation
export const createOrg = async (req,res)=>{
    try {
        const userid = req.user.id;
        const {name,description,approval}= req.body;
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
            createdBy:userid,
            requiresApproval:approval,
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
    try {
        const userid = req.user.id;
        const {invitetoken} = req.params;
        if(!invitetoken){
            return res.status(403).json({
                success:false,
                message:"invite Token is not found "
            })
        }
        const CurrentOrg = await Organisation.findOne({inviteToken:invitetoken});
        if(!CurrentOrg){
        return res.status(404).json({
            success: false,
            message: "Invalid invite link"
        })
        }
        if(!CurrentOrg.inviteToken.equals(invitetoken)){
        return res.status(403).json({
                success:false,
                message:"invite Token is invalid "
            }) 
        }
        if(Date.now() > CurrentOrg.inviteTokenExpire){
            return res.status(403).json({
                success: false,
                message: "Invite link has expired — ask admin to regenerate"
            })
}
        // check already member or requested for join
        const alreadyMember = CurrentOrg.members.find(m=>m.user.equals(userid));
        if(alreadyMember){
            return res.status(400).json({
                success: false,
                message: "You are already a member of this organisation"
            })
        }
        const alreadyRequested = CurrentOrg.joinRequests.find((m)=>m.user.equals(userid));
        if(alreadyRequested){
            return res.status(400).json({
                success: false,
                message: "Your join request is already pending"
            })
        }
        const Approval = CurrentOrg.requiresApproval;
        if(Approval){
            CurrentOrg.joinRequests.push({user:userid});
            await CurrentOrg.save({validateBeforeSave:false});
            return res.status(201).json({
                success:true,
                message:"Join request sent — wait for admin approval"
            })
        }else{
            CurrentOrg.members.push({ user: userid, role: 'member' })
            await CurrentOrg.save({validateBeforeSave:false});
            return res.status(201).json({
                success:true,
                message:`You are now member of ${CurrentOrg.name} organisation `
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while joining organisation",
            error: error.message
        })
    }
}

// 2. Get Pending Join Requests
// GET /org/:orgId/requests

export const joinRequests =async (req,res)=>{
    try {
        const user = req.user;
        const {OrgID} = req.params;
        if(!OrgID){
            return res.status(403).json({
                success:false,
                message:"OrgId not found"
            })
        }
        const CurrentOrg = await Organisation.findById(OrgID);
        if(!CurrentOrg){
            return res.status(404).json({
                success: false,
                message: "Invalid invite link"
            })
        }
        userMember = CurrentOrg.members.find((m)=>{
            m.user=user;
        })
        if(!userMember){
            return res.status.json({
                success:false,
                message:"user not found in org"
            })
        }

    } catch (error) {
        
    }
}

// Admin/Owner only
// Return all users in joinRequests[] with status pending


// 3. Approve Join Request
// POST /org/:orgId/requests/:requestId/approve

// Admin/Owner only
// Move user from joinRequests[] → members[]
// Remove from joinRequests[]


// 4. Reject Join Request
// POST /org/:orgId/requests/:requestId/reject

// Admin/Owner only
// Remove user from joinRequests[] entirely


// 5. Get Organisation Details
// GET /org/:orgId

// Members only (must be in org)
// Return org info + populated members list


// 6. Remove Member
// DELETE /org/:orgId/members/:memberId

// Admin/Owner only
// Can't remove yourself if only admin/owner
// Can't remove owner


// 7. Update Member Role
// PATCH /org/:orgId/members/:memberId/role

// Owner only
// Change member role between admin/member
// Can't change owner's role


// 8. Leave Organisation
// DELETE /org/:orgId/leave

// Any member
// Owner can't leave — must transfer ownership first


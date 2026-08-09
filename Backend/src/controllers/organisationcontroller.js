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
        const newOrganisation =await Organisation.create({
            name:name,
            description:description,
            members:[{
                user: userid,
                role: 'owner',
            }],
            createdBy:userid,
            requiresApproval:approval,
        })
        return res.status(201).json({
            success:true,
            message:"Orignation is Created Successfully",
            OrganisationID:newOrganisation._id,
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
// route → /org/:orgID/invite
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
                message:'Org id not found'
            })
        }
        const validOrgansiation =await Organisation.findById(OrgID);
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
        const inviteLink = `${process.env.CLIENT_URL}/org/join/${inviteToken}`;
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
        if(CurrentOrg.inviteToken !== invitetoken){
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
// GET /org/:orgID/requests

export const joinRequests =async (req,res)=>{
    try {
        const user = req.user;
        const {orgID} = req.params;
        if(!orgID){
            return res.status(403).json({
                success:false,
                message:"OrgId not found"
            })
        }
        const CurrentOrg = await Organisation.findById(orgID).populate('joinRequests.user', 'username email');
        if(!CurrentOrg){
            return res.status(404).json({
                success: false,
                message: "Org is not exist , try with diffrent one"
            })
        }
        const userMember = CurrentOrg.members.find((m)=>m.user.equals(user.id))
        if(!userMember || !['admin','owner'].includes(userMember.role)){
            return res.status(403).json({
                success:false,
                message:"User did not have Permission"
            })
        }
        const PendingRequest = CurrentOrg.joinRequests.filter((m)=>m.status==='pending');
        if(PendingRequest.length===0){
           return res.status(200).json({
            success:true,
            message:"there is Zero Pending Request Left"
            }) 
        }
        return res.status(200).json({
            success:true,
            message:"All Pending Request details",
            Details:PendingRequest
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"server error while fetching Pending Request",
            error:error.message
        })
    }
}

// 3. Approve Join Request
// POST /org/:orgId/requests/:requestId/approve

// Admin/Owner only
// Move user from joinRequests[] → members[]
// Remove from joinRequests[]
export const ApproveJoinRequest = async (req,res)=>{
    try {
        const user = req.user;
        const {orgID,requestID} = req.params;
        if(!orgID || !requestID){
            return res.status(403).json({
                success:false,
                message:"orgID or RequestID not found"
            })
        }
        const CurrentOrg = await Organisation.findById(orgID);
        if(!CurrentOrg){
            return res.status(403).json({
                success:false,
                message:"OrgID is invalid"
            })
        }
        const verifyrequest = CurrentOrg.joinRequests.find((m)=>m._id.equals(requestID));
        if(!verifyrequest){
            return res.status(403).json({
                success:false,
                message:"Your Request not found in the Org"
            })
        }
        const Permission = CurrentOrg.members.find((m)=>m.user.equals(user.id))
        if(!Permission || !["owner" , "admin"].includes(Permission.role)){
            return res.status(403).json({
                success:false,
                message:"You have not permission for this work"
            })
        }
        CurrentOrg.members.push({user: verifyrequest.user,role:"member"});
        const deleterequest = await Organisation.findByIdAndUpdate(orgID,{
            $pull :{joinRequests :{_id:requestID}}
        });
        await CurrentOrg.save({validateBeforeSave:false});
        return res.status(200).json({
            success:true,
            message:"request is approved"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error While aproving request of pending user",
            error:error.message
        })
    }
}

// 4. Reject Join Request
// POST /org/:orgId/requests/:requestId/reject

// Admin/Owner only
// Remove user from joinRequests[] entirely
export const RejectJoinRequest = async (req,res)=>{
    try {
        const user = req.user.id;
        const {orgID,requestID} = req.params;
        if(!orgID || !requestID){
            return res.status(400).json({
                success:false,
                message:"orgID or RequestID not found"
            })
        }
        const CurrentOrg = await Organisation.findById(orgID);
        if(!CurrentOrg){
            return res.status(400).json({
                success:false,
                message:"OrgID is invalid"
            })
        }
        const verifyrequest = CurrentOrg.joinRequests.find((m)=>m._id.equals(requestID));
        if(!verifyrequest){
            return res.status(404).json({
                success:false,
                message:"Your Request is not found in the Org"
            })
        }
        const Permission = CurrentOrg.members.find((m)=>m.user.equals(user))
        if(!Permission || !["owner" , "admin"].includes(Permission.role)){
            return res.status(403).json({
                success:false,
                message:"You have not permission for this work"
            })
        }
        const deleterequest = await Organisation.findByIdAndUpdate(orgID,{
            $pull :{joinRequests :{_id:requestID}}
        });
        return res.status(200).json({
            success:true,
            message:"Join Request is Rejected",
            Details:deleterequest,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error While rejecting request of pending user",
            error:error.message
        })
    }
}

// 5. Get Organisation Details
// GET /org/:orgId

// Members only (must be in org)
// Return org info + populated members list
export const OrgDetails = async (req,res)=>{
    try {
        const userid = req.user.id;
        const {orgID} = req.params;
        if(!orgID) return res.status(403).json({success:false,message:"Orgid is not found"});
        const CurrentOrg = await Organisation.findById(orgID).populate('members.user','username email');
        if(!CurrentOrg) return res.status(403).json({ success:false,message:"Org invalid"});
        const verify = CurrentOrg.members.find((m)=>m.user.equals(userid));
        if(!verify) return res.status(403).json({success:false,message:"you have are not member of this OrgID"});
        return res.status(200).json({
            success:true,
            message:"here are all details about the Organisation",
            Details:CurrentOrg
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server error while fetch Org details",
            error:error.message
        })
    }

}

// 6. Remove Member
// DELETE /org/:orgID/members/:memberID

// Admin/Owner only
// Can't remove yourself if only admin/owner
// Can't remove owner
export const removemember = async (req,res)=>{
    try {
        const user = req.user.id;
        const {orgID,memberID} = req.params;
        if(!memberID || !orgID){
            return res.status(404).json({
                success:false,
                message:"Memeber id or Org id not found"
            })
        }
        if(user === memberID){
            return res.status(400).json({
                success: false,
                message: "You cannot remove yourself — use leave organisation instead"
            })
        }
        const CurrentOrg = await Organisation.findById(orgID);
        if(!CurrentOrg){
            return res.status(404).json({
                success:false,
                message:"Org not found"
            })
        }
        const Permission = CurrentOrg.members.find((m)=>m.user.equals(user));
        if(!Permission || !["owner", "admin"].includes(Permission.role)){
            return res.status(403).json({
                success:false,
                message:"You have not permission for this work"
            })
        } 
        if(Permission.role === 'admin' && targetMember.role === 'admin'){
            return res.status(403).json({
                success: false,
                message: "Admin cannot remove another admin — only owner can"
            })
        }
        const targetMember  = CurrentOrg.members.find((m)=>m.user.equals(memberID));
        if(!targetMember  || ["owner"].includes(targetMember .role)){
            return res.status(403).json({
                success:false,
                message:"You can't remove Owner OR Member can't find"
            })
        }
        await Organisation.findByIdAndUpdate(orgID,{
            $pull :{members:{user:memberID}}
        })
        return res.status(200).json({
            success:true,
            message:"Memeber removed successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Server error while removing member",
            error:error.message
        })
    }
}

// 7. Update Member Role
// PATCH /org/:orgId/members/:memberId/role

// Owner only
// Change member role between admin/member
// Can't change owner's role

export const RoleUpdate = async(req,res)=>{
try {
    const user = req.user.id;
    const {orgID,memberID} =  req.params;
    const {newrole} = req.body;
    if(!memberID || !orgID || !newrole){
        return res.status(404).json({
            success:false,
            message:"Memeber id or Orgid or NewRole not found"
        })
    }
    if(user === memberID){
        return res.status(400).json({
            success: false,
            message: "You cannot remove yourself — use leave organisation instead"
        })
    }
    const allowedrole = ["member","admin"];
    if(!allowedrole.includes(newrole)){
        return res.status(400).json({
            success: false,
            message: "Invalid role — must be 'admin' or 'member'"
        })
    }
    const CurrentOrg = await Organisation.findById(orgID);
    if(!CurrentOrg){
        return res.status(404).json({
            success:false,
            message:"Org not found"
        })
    }
    const CurrentUser = CurrentOrg.members.find((m)=>m.user.equals(user));
    if(!CurrentUser){
        return res.status(403).json({
            success:false,
            message:"User is not member of this Org"
        })
    }
    if(!["owner"].includes(CurrentUser.role)){
        return res.status(403).json({
            success: false,
            message: "You do not have permission for this action"
        })
    }
    const targetMember = CurrentOrg.members.find((m)=>m.user.equals(memberID));
    if(!targetMember ){
        return res.status(404).json({
            success: false,
            message: "Member not found in Org"
        })
    }
    if(targetMember.role === "owner"){
        return res.status(403).json({
            success: false,
            message: "Owner role cannot be change"
        })
    }
    await Organisation.updateOne({_id:orgID,"members.user":memberID},{
        $set:{"members.$.role":newrole}
    })
    return res.status(200).json({
        success:true,
        message:"Member role is changed successfully"
    })

} catch (error) {
    return res.status(500).json({
        success:false,
        message:"Server error while updating role of member",
        error:error.message
    })
}
}



// 8. Leave Organisation
// DELETE /org/:orgId/leave

// Any member
// Owner can't leave — must transfer ownership first

export const LeaveOrg = async (req,res)=>{
    try{
        const user = req.user.id;
        const {orgID} = req.params;
        if(!orgID ){
            return res.status(404).json({
                success:false,
                message:"Orgid  not found"
            })
        }
        const CurrentOrg = await Organisation.findById(orgID);
        if(!CurrentOrg){
            return res.status(404).json({
                success:false,
                message:"Org not found"
            })
        }
        const CurrentUser = CurrentOrg.members.find((m)=>m.user.equals(user));
        if(!CurrentUser){
            return res.status(403).json({
                success:false,
                message:"User is not member of this Org"
            })
        } 
        if(CurrentUser.role==="member"){
            CurrentOrg.members.pull(user);
            await CurrentOrg.save();
            return res.status(200).json({
                success: true,
                message: "Successfully left the organisation"
            });
        }
        return res.status(400).json({
            success: false,
            message: "Admins or owners cannot leave without transferring ownership"
        });
    }catch(error){
            return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }

};

// 9. Fetch All Organsiation
// Get /org


import express from "express";
import { ApproveJoinRequest, createOrg, generateInviteToken, joinOrg, joinRequests } from "../controllers/organisationcontroller.js";
import { auth } from "../middelware/userauth.js";
const OrgRouter = express().router;

OrgRouter.post("/createOrg",auth,createOrg);
OrgRouter.post("/:OrgID/invite",auth,generateInviteToken);
OrgRouter.post("/join/:invitetoken",auth,joinOrg);
OrgRouter.get("/:orgID/requests",auth,joinRequests);
OrgRouter.post("/:orgId/requests/:requestId/approve",auth,ApproveJoinRequest);
 
export default OrgRouter;

import express from "express";
const router = express().router;
import { signup,login, verifyotp,resendotp,refresh, forgetPassword, VerifyResetOtp, resetpassword } from "../controllers/authentication.js";
import { auth } from "../middelware/userauth.js";
import { getme } from "../controllers/usercontoller.js";

router.post("/signup",signup);
router.post('/verify',verifyotp);
router.post("/login",login);
router.post("/resendotp",resendotp);
router.post("/forgetpassword",forgetPassword);
router.post("/verifyresendotp",VerifyResetOtp);
router.post("/resetpassword",resetpassword);
router.get("/me",auth,getme)
router.get("/user", function(req,res){
    res.json({
        messsage:"hello"
    })
})

export default router;
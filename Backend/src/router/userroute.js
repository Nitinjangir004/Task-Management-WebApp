import express from "express";
const router = express().router;
import { signup,login, verifyotp,resendotp,refresh } from "../controllers/authentication.js";

router.post("/signup",signup);
router.post('/verify',verifyotp);
router.post("/login",login);
router.post("/resendotp",resendotp);
router.get("/user", function(req,res){
    res.json({
        messsage:"hello"
    })
})

export default router;